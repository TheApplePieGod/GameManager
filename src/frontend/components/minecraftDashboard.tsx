import { Button, Paper, TextField, Typography, Select, MenuItem, Checkbox, FormControlLabel } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import { Message, MessageType } from '../definitions/types';
import * as theme from '../theme';
import { ChatDrawer } from './chatDrawer';
import { FilesDialog } from './filesDialog';
import { SettingsDialog } from './settingsDialog';
import { SnackbarStatus } from './snackbar';

const API_VERSION = 1;

interface Props {
    openSnackbar: (status: SnackbarStatus, message: string, closeDelay: number) => void;
}

window.socket = undefined;
let closing = false;
let receivedLogs: string[] = []
let disableJump = false;
export const MinecraftDashboard = (props: Props) => {
    const [apiKey, setApiKey] = React.useState("");
    const [host, setHost] = React.useState("");
    const [storeApiKey, setStoreApiKey] = React.useState(true);
    const [command, setCommand] = React.useState("");
    const [ready, setReady] = React.useState(false);
    const [support, setSupport] = React.useState(false);
    const [connecting, setConnecting] = React.useState(false);
    const [logs, setLogs] = React.useState("");
    const [restarting, setRestarting] = React.useState(true);

    const startMonitor = (force: boolean) => {
        if ((ready || force) && window.socket) {
            window.socket.send(JSON.stringify({ type: MessageType.StartMonitor }));
            receivedLogs = [];
            setLogs("");
        }
    }

    const stopMonitor = () => {
        if (ready && window.socket) {
            window.socket.send(JSON.stringify({ type: MessageType.StopMonitor }));
            receivedLogs = [];
            setLogs("");
        }
    }

    const issueCommand = () => {
        if (ready && window.socket) {
            window.socket.send(JSON.stringify({ type: MessageType.IssueCommand, data: command.trim() }));
            setCommand("");
        }
    }

    const restartServer = () => {
        if (ready && window.socket) {
            window.socket.send(JSON.stringify({ type: MessageType.Restart }));
            setRestarting(true);
            props.openSnackbar(SnackbarStatus.Info, `Restarting server...`, 6000);
        }
    }

    const disconnect = () => {
        if (window.socket)
        window.socket.close();
        cleanup();
    }

    const cleanup = () => {
        setReady(false);
        setLogs("");
        setConnecting(false);
        receivedLogs = [];
        closing = false;
        window.socket = undefined;
    }

    const connect = () => {
        setConnecting(true);
        props.openSnackbar(SnackbarStatus.Info, `Connecting...`, 6000);

        if (window.socket)
            window.socket.close();

        window.socket = new WebSocket(`ws://${host}`);
        window.socket.addEventListener("message", (msg) => {
            let jsonString = "";
            if (typeof(msg.data) == "string")
                jsonString = msg.data;
            else {
                return;
            }

            const message = JSON.parse(jsonString);

            switch (message.type) {
                default:
                {} break;

                case MessageType.Connect: {
                    setConnecting(false);
                    if (message.data.success) {
                        setReady(true);
                        setRestarting(message.data.restarting != 0);
                        setSupport(message.data.support);
                        props.openSnackbar(SnackbarStatus.Success, `Connection established! Your connection is being monitored`, 4000);
                    }
                    else {
                        closing = true;
                        props.openSnackbar(SnackbarStatus.Error, `Failed to establish connection: ${message.data.message}`, 4000);
                    }
                } break;

                case MessageType.Disconnect: {
                    cleanup();
                    props.openSnackbar(SnackbarStatus.Error, `Connection closed: ${message.data}`, 4000);
                } break;

                case MessageType.StartMonitor: { // a response here means we failed to start monitoring
                    setLogs("");
                    receivedLogs = [];
                    props.openSnackbar(SnackbarStatus.Error, `${message.data}`, 4000);
                } break;

                case MessageType.MonitorReceive: {
                    if (receivedLogs.length == 0)
                        receivedLogs.push("<Loading last 300 lines of the log>\n");
                    receivedLogs.push(message.data);
                    setLogs(receivedLogs.join(""));
                    const console = document.getElementById("console");
                    if (console && !disableJump)
                        console.scrollTop = console.scrollHeight;
                } break;

                case MessageType.IssueCommand: { // a response here means the command failed to send
                    props.openSnackbar(SnackbarStatus.Error, `${message.data}`, 4000);
                } break;

                case MessageType.Restart: { // a response here means the restart failed
                    setRestarting(false);
                    props.openSnackbar(SnackbarStatus.Error, `${message.data}`, 4000);
                } break;

                case MessageType.Restarted: {
                    setRestarting(false);
                    //startMonitor(true);
                    props.openSnackbar(SnackbarStatus.Success, `Restart successful!`, 4000);
                } break;
            }
        });

        window.socket.onopen = () => {
            if (window.socket)
                window.socket.send(JSON.stringify({ type: MessageType.Connect, data: { key: apiKey, apiVersion: API_VERSION } }));
        };
        window.socket.onclose = (e) => {
            if (!closing)
                props.openSnackbar(SnackbarStatus.Warning, "Your connection has been closed", 4000);
            cleanup();
        }
        window.socket.onerror = () => {
            props.openSnackbar(SnackbarStatus.Error, "Connection error", 4000);
            cleanup();
        }
    }

    const parseLogsText = () => {
        let elems: JSX.Element[] = [];
        const split = logs.split('\n');
        for (let i = 0; i < split.length; i++) {
            elems.push(<p style={{ margin: 0 }} key={i}>{split[i]}</p>);
        }
        return elems;
    }

    const updateStoreApiKey = (checked: boolean) => {
        setStoreApiKey(checked);
        localStorage.setItem("storeapikey", `${checked}`);
        if (checked)
            localStorage.setItem("apikey", apiKey);
        else 
            localStorage.setItem("apikey", "");
    }

    const updateApiKey = (value: string) => {
        setApiKey(value);
        if (storeApiKey)
            localStorage.setItem("apikey", value);
    }

    const updateHost = (value: string) => {
        setHost(value);
        localStorage.setItem("host", value);
    }

    const commandKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key == "Enter" && command.trim() != "") {
            e.preventDefault();
            issueCommand();
        }
    }

    const consoleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const div = e.target as HTMLDivElement;
        if (div.scrollTop + div.offsetHeight - div.scrollHeight >= -10)
            disableJump = false;
        else
            disableJump = true;
    }

    React.useEffect(() => {
        const savedHost = localStorage.getItem("host");
        if (savedHost)
            setHost(savedHost);
        const savedKey = localStorage.getItem("apikey");
        if (savedKey)
            setApiKey(savedKey);
        const savedStoreKey = localStorage.getItem("storeapikey");
        if (savedStoreKey)
            setStoreApiKey(savedStoreKey == "true");
        return (() => {
            setReady(false);
            if (window.socket) {
                window.socket.close();
                cleanup();
            }
        });
    }, []);

    React.useEffect(() => {
        if (ready)
            startMonitor(false);
    }, [ready])

    return (
        <div>
            {!ready &&
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Typography color="textPrimary" variant="h2"><b>Minecraft Manager</b></Typography>
                <TextField
                    style={{ width: "80%", marginBottom: "0.75rem", marginTop: "2rem" }}
                    label="Host"
                    variant="outlined"
                    value={host}
                    onChange={(e) => updateHost(e.target.value)}
                />
                <TextField
                    style={{ width: "80%", marginBottom: "0.25rem" }}
                    label="API key"
                    variant="outlined"
                    value={apiKey}
                    type="password"
                    onChange={(e) => updateApiKey(e.target.value)}
                />
                <FormControlLabel
                    control={<Checkbox checked={storeApiKey} onChange={(e) => updateStoreApiKey(e.target.checked)} />}
                    label="Remember API key"
                    style={{ marginBottom: "0.25rem", color: theme.PALETTE_WHITE }}
                />
                <Button variant="outlined" disabled={connecting} onClick={connect}>Connect</Button>
            </div>
            }
            {ready &&
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {support &&
                        <Typography variant="h4" style={{ color: theme.PALETTE_RED }}>SUPPORT CONNECTION</Typography>
                    }
                    <ChatDrawer openSnackbar={props.openSnackbar} support={support} />
                    <FilesDialog openSnackbar={props.openSnackbar} />
                    <SettingsDialog openSnackbar={props.openSnackbar} />
                    <div
                        id="console"
                        onScroll={consoleScroll}
                        style={{ width: "95%", fontFamily: "Source Code Pro", overflowY: "scroll", height: "70vh", margin: "1rem", padding: "1rem", backgroundColor: "#000", color: theme.PALETTE_WHITE }}
                    >
                        {parseLogsText()}
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                        <Button variant="outlined" disabled={restarting} onClick={() => startMonitor(false)}>Reconnect to log</Button>
                        <Button variant="outlined" disabled={logs == "" || restarting} onClick={stopMonitor}>Stop loading log</Button>
                        <Button variant="outlined" disabled={restarting} onClick={restartServer}>Restart server</Button>
                        <Button variant="contained" style={{ backgroundColor: theme.PALETTE_RED }} onClick={disconnect}>Disconnect</Button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                        <TextField
                            onKeyDown={commandKeyDown}
                            style={{ width: "50%", marginBottom: "0.25rem" }}
                            label="Command"
                            variant="outlined"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            disabled={restarting}
                        />
                        <Button variant="outlined" disabled={command.trim() == "" || restarting} onClick={issueCommand}>Issue Command</Button>
                    </div>
                </div>
            }
        </div>
    );
}
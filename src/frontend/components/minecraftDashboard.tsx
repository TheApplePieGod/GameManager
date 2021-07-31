import { Button, Paper, TextField, Typography, Select, MenuItem, Checkbox, FormControlLabel } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import { Message, MessageType } from '../definitions/types';
import * as theme from '../theme';
import { SnackbarStatus } from './snackbar';

interface Props {
    openSnackbar: (status: SnackbarStatus, message: string, closeDelay: number) => void;
}

let socket: WebSocket | undefined = undefined;
let closing = false;
let receivedLogs: string[] = []
export const MinecraftDashboard = (props: Props) => {
    const [apiKey, setApiKey] = React.useState("");
    const [host, setHost] = React.useState("");
    const [storeApiKey, setStoreApiKey] = React.useState(true);
    const [command, setCommand] = React.useState("");
    const [ready, setReady] = React.useState(false);
    const [connecting, setConnecting] = React.useState(false);
    const [logs, setLogs] = React.useState("");

    const startMonitor = () => {
        if (ready && socket)
            socket.send(JSON.stringify({ type: MessageType.StartMonitor }));
    }

    const stopMonitor = () => {
        if (ready && socket) {
            socket.send(JSON.stringify({ type: MessageType.StopMonitor }));
            receivedLogs = [];
            setLogs("");
        }
    }

    const issueCommand = () => {
        if (ready && socket) {
            socket.send(JSON.stringify({ type: MessageType.IssueCommand, data: command.trim() }));
            setCommand("");
        }
    }

    const cleanup = () => {
        setReady(false);
        setLogs("");
        setConnecting(false);
        receivedLogs = [];
        closing = false;
    }

    const connect = () => {
        setConnecting(true);
        props.openSnackbar(SnackbarStatus.Info, `Connecting...`, 6000);

        if (socket)
            socket.close();

        socket = new WebSocket(`ws://${host}`);
        socket.onmessage = (msg) => {
            let jsonString = "";
            if (typeof(msg.data) == "string")
                jsonString = msg.data;
            else
                jsonString = msg.data.toString();
            const message = JSON.parse(jsonString);

            switch (message.type) {
                default:
                {} break;

                case MessageType.Connect: {
                    setConnecting(false);
                    if (message.data == "") {
                        setReady(true);
                        props.openSnackbar(SnackbarStatus.Success, `Connection established`, 4000);
                    }
                    else {
                        closing = true;
                        props.openSnackbar(SnackbarStatus.Error, `Failed to establish connection: ${message.data}`, 6000);
                    }
                } break;

                case MessageType.StartMonitor: { // a response here means we failed to start monitoring
                    setLogs("");
                    receivedLogs = [];
                    props.openSnackbar(SnackbarStatus.Error, `${message.data}`, 6000);
                } break;

                case MessageType.MonitorReceive: {
                    receivedLogs.push(message.data);
                    setLogs(receivedLogs.join(""));
                    const console = document.getElementById("console");
                    if (console)
                        console.scrollTop = console.scrollHeight;
                } break;

                case MessageType.IssueCommand: { // a response here means the command failed to send
                    props.openSnackbar(SnackbarStatus.Error, `${message.data}`, 6000);
                } break;
            }
        };
        socket.onopen = () => {
            if (socket)
                socket.send(JSON.stringify({ type: MessageType.Connect, data: apiKey }));
        };
        socket.onclose = (e) => {
            if (!closing)
                props.openSnackbar(SnackbarStatus.Warning, "Your connection has been closed", 4000);
            cleanup();
        }
        socket.onerror = () => {
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
        if (e.key == "Enter") {
            e.preventDefault();
            issueCommand();
        }
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
            if (socket) {
                socket.close();
                cleanup();
            }
        });
    }, []);

    React.useEffect(() => {
        if (ready)
            startMonitor();
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
                    <div id="console" style={{ width: "95%", fontFamily: "Source Code Pro", overflowY: "scroll", maxHeight: "70vh", margin: "1rem", padding: "1rem", backgroundColor: "#000", color: theme.PALETTE_WHITE }}>
                        {parseLogsText()}
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                        <Button variant="outlined" onClick={startMonitor}>Reconnect to log</Button>
                        <Button variant="outlined" disabled={logs == ""} onClick={stopMonitor}>Stop loading log</Button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                        <TextField
                            onKeyDown={commandKeyDown}
                            style={{ width: "50%", marginBottom: "0.25rem" }}
                            label="Command"
                            variant="outlined"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                        />
                        <Button variant="outlined" disabled={command.trim() == ""} onClick={issueCommand}>Issue Command</Button>
                    </div>
                </div>
            }
        </div>
    );
}
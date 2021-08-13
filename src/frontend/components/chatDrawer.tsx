import { Button, Paper, TextField, Typography, Select, MenuItem, Checkbox, FormControlLabel, Drawer, Fab, Tooltip } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import { ChatMessage, Message, MessageType } from '../definitions/types';
import * as theme from '../theme';
import ChatIcon from '@material-ui/icons/Chat';
import { SnackbarStatus } from './snackbar';

interface Props {
    support: boolean;
    openSnackbar: (status: SnackbarStatus, message: string, closeDelay: number) => void;
}

let receivedChats: ChatMessage[] = [];
export const ChatDrawer = (props: Props) => {
    const [open, setOpen] = React.useState(false);
    const [chat, setChat] = React.useState<JSX.Element[]>([]);
    const [message, setMessage] = React.useState("");

    const parseChat = () => {
        let elems: JSX.Element[] = [];
        let index = 0;
        receivedChats.forEach((c) => {
            let styles: React.CSSProperties = { marginLeft: 0, marginRight: "auto", backgroundColor: "#1c1e21", padding: "0.5rem", marginBottom: "0.25rem" };
            if (c.support == props.support)
                styles = { marginLeft: "auto", marginRight: 0, backgroundColor: "#1e63b2", padding: "0.5rem", marginBottom: "0.25rem" };

            elems.push(
                <div key={index} style={styles}>
                    <Typography>{c.message}</Typography>
                </div>
            );
            index++;
        });
        setChat(elems);
    }

    const sendMessage = () => {
        if (window.socket) {
            window.socket.send(JSON.stringify({ type: MessageType.SendChat, data: message }));
            setMessage("");
        }
    }

    const chatKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key == "Enter" && message.trim() != "") {
            e.preventDefault();
            sendMessage();
        }
    }

    const handleMessage = (msg: { data: any }) => {
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

            case MessageType.ChatReceive: {
                receivedChats.push(message.data);
                parseChat();
                const chatlog = document.getElementById("chatlog");
                if (chatlog)
                    chatlog.scrollTop = chatlog.scrollHeight;
            } break;

            case MessageType.LoadChat: {
                if (message.data.success) {
                    receivedChats = message.data.data.concat(receivedChats);
                    parseChat();
                    const chatlog = document.getElementById("chatlog");
                    if (chatlog)
                        chatlog.scrollTop = chatlog.scrollHeight;
                } else {
                    props.openSnackbar(SnackbarStatus.Error, "Failed to load chat history", 4000);
                }
            } break;
        }
    }

    const openDrawer = () => {
        setOpen(true);
        setTimeout(() => {
            const chatlog = document.getElementById("chatlog");
            if (chatlog) {
                chatlog.scrollTop = chatlog.scrollHeight;
            }
        }, 200);
    }

    React.useEffect(() => {
        window.socket?.addEventListener('message', handleMessage);

        return (() => {
            window.socket?.removeEventListener('message', handleMessage);
        });
    }, [window.socket, props.support, receivedChats]);

    React.useEffect(() => {
        window.socket?.send(JSON.stringify({ type: MessageType.LoadChat }));
        setChat([]);
        setMessage("");
        receivedChats = [];
    }, [])

    return (
        <React.Fragment>
            <Drawer anchor={"left"} open={open} onClose={() => setOpen(false)}>
                <div id="chatlog" style={{ width: "500px", height: "100%", maxHeight: "calc(100% - 100px)", overflowY: "scroll", display: "flex", flexDirection: "column", padding: "1rem" }}>
                    {chat}
                </div>
                <div style={{ padding: "1rem" }}>
                    <div style={{ marginBottom: "0.5rem", width: "100%", display: "flex", alignItems: "center" }}>
                        <TextField
                            fullWidth
                            onKeyDown={chatKeyDown}
                            placeholder="Send a message"
                            variant="outlined"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <Button variant="outlined" onClick={sendMessage}>Send</Button>
                    </div>
                    <Button style={{ width: "100%" }} variant="outlined" onClick={() => setOpen(false)}>Close</Button>
                </div>
            </Drawer>
            <Tooltip arrow title="Live support">
                <Fab color="primary" onClick={openDrawer} style={{ position: "fixed", left: 0, bottom: 0, margin: "1rem" }}><ChatIcon /></Fab>
            </Tooltip>
        </React.Fragment>
    );
}
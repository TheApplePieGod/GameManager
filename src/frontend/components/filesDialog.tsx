import { Button, Paper, TextField, Typography, Select, MenuItem, Checkbox, FormControlLabel, Drawer, Fab, Tooltip, Dialog, DialogTitle } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import { ChatMessage, Message, MessageType } from '../definitions/types';
import * as theme from '../theme';
import DescriptionIcon from '@material-ui/icons/Description';
import EditIcon from '@material-ui/icons/Edit';
import { SnackbarStatus } from './snackbar';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-tomorrow_night_bright";

interface Props {
    openSnackbar: (status: SnackbarStatus, message: string, closeDelay: number) => void;
}

export const FilesDialog = (props: Props) => {
    const [open, setOpen] = React.useState(false);
    const [editState, setEditState] = React.useState({
        open: false,
        fileName: "",
        path: "",
        data: "",
    });
    const [files, setFiles] = React.useState<string[]>([]);
    const [path, setPath] = React.useState("/paper");
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);

    const handleClose = () => {
        setOpen(false);
    }

    const handleOpen = () => {
        setOpen(true);
        setLoading(true);
        window.socket?.send(JSON.stringify({ type: MessageType.ListFiles, data: path }));
    }

    const updatePath = (newPath: string) => {
        setPath(newPath);
        setLoading(true);
        window.socket?.send(JSON.stringify({ type: MessageType.ListFiles, data: newPath }));
    }

    const edit = (editPath: string, fileName: string) => {
        setLoading(true);
        setEditState({ open: true, fileName: fileName, data: "", path: editPath });
        window.socket?.send(JSON.stringify({ type: MessageType.LoadFile, data: editPath }));
    }

    const stepBack = () => {
        let steps = path.split('/');
        steps.pop();
        const newPath = steps.join('/');
        setPath(newPath);
        setLoading(true);
        window.socket?.send(JSON.stringify({ type: MessageType.ListFiles, data: newPath }));
    }

    const goToRoot = () => {
        updatePath("/paper");
    }

    const handleMessage = (msg: MessageEvent) => {
        let jsonString = "";
        if (typeof(msg.data) == "string")
            jsonString = msg.data;
        else
            jsonString = msg.data.toString();
        const message = JSON.parse(jsonString);

        switch (message.type) {
            default:
            {} break;

            case MessageType.ListFiles: {
                setLoading(false);
                if (message.data.success) {
                    message.data.data = message.data.data.trim();
                    if (message.data.data != path) { // this will happen if we try to ls a regular file
                        let newFiles = message.data.data.split("\n");
                        newFiles.shift(); // remove first element as that is the 'total' row returned from ls 
                        setFiles(newFiles);
                    }
                    else
                        stepBack();
                } else {
                    props.openSnackbar(SnackbarStatus.Error, "Failed to list files", 4000);
                }
            } break;

            case MessageType.LoadFile: {
                setLoading(false);
                if (message.data.success) {
                    setEditState({ ...editState, data: message.data.data });
                } else {
                    props.openSnackbar(SnackbarStatus.Error, message.data.message, 4000);
                }
            } break;

            case MessageType.SaveFile: {
                setSaving(false);
                if (message.data.success) {
                    setEditState({ open: false, fileName: "", path: "", data: "" });
                    props.openSnackbar(SnackbarStatus.Success, "Saved!", 4000);
                } else {
                    props.openSnackbar(SnackbarStatus.Error, message.data.message, 4000);
                }
            } break;
        }
    }

    const saveEdits = () => {
        setSaving(true);
        props.openSnackbar(SnackbarStatus.Info, "Saving...", 4000);
        window.socket?.send(JSON.stringify({ type: MessageType.SaveFile, data: { path: editState.path, data: editState.data } }));
    }

    React.useEffect(() => {
        window.socket?.addEventListener('message', handleMessage);

        return (() => {
            window.socket?.removeEventListener('message', handleMessage);
        });
    }, [window.socket, path, editState.open]);

    return (
        <React.Fragment>
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="lg"
            >
                {open &&
                    <React.Fragment>
                        <DialogTitle>Manage Files</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <div style={{ display: "flex", gap: "0.25rem", marginBottom: "-0.5rem", marginLeft: "1rem" }}>
                                <Button variant="outlined" disabled={loading || path == "/paper"} onClick={stepBack}>Step back</Button>
                                <Button variant="outlined" disabled={loading || path == "/paper"} onClick={goToRoot}>Go to root</Button>
                            </div>
                            <div
                                id="filelist"
                                style={{ width: "95%", fontFamily: "Source Code Pro", overflowY: "scroll", height: "70vh", margin: "1rem", padding: "1rem", backgroundColor: "#000", color: theme.PALETTE_WHITE }}
                            >
                                <Typography style={{ marginBottom: "0.5rem" }}><b>Path: {path}</b></Typography>
                                {
                                    files.map((f, i) => {
                                        if (f == "") return undefined;
                                        const split = f.trim().split(' ');
                                        const size = split[0];
                                        const name = split[1];
                                        const isDirectory = !name.includes('.');
                                        const canEdit = !isDirectory && !size.includes("G") && (size.includes('M') && parseInt(size.substring(0, size.length - 1))) < 10; // 10 MB max
                                        return ( // we can assume a '.' indicates a file
                                            <div key={i} style={{ display: "flex", alignItems: "center" }}>
                                                <Typography style={{ color: isDirectory ? "#325bff" : "" }}>{`(${size}) ${name}`}</Typography>
                                                {isDirectory && <Button disabled={loading} style={{ padding: 0, minWidth: "32px" }} onClick={() => updatePath(`${path}/${name}`)}>+</Button>}
                                                {canEdit && <Button disabled={loading} style={{ padding: 0, minWidth: "32px" }} onClick={() => edit(`${path}/${name}`, name)}><EditIcon fontSize={"small"} /></Button>} 
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                        <Button variant="contained" onClick={handleClose}>Close</Button>
                    </React.Fragment>
                }
            </Dialog>
            <Tooltip arrow title="Server files">
                <Fab color="secondary" onClick={handleOpen} style={{ position: "fixed", left: "4rem", bottom: 0, margin: "1rem" }}><DescriptionIcon /></Fab>
            </Tooltip>
            <Dialog
                open={editState.open}
                onClose={() => setEditState({ ...editState, open: false })}
                fullWidth
                maxWidth="lg"
            >
                {open &&
                    <React.Fragment>
                        <DialogTitle>{editState.fileName}</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            {!loading ?
                                <AceEditor
                                    placeholder="The file is empty! Add some text here..."
                                    mode="sql"
                                    theme="tomorrow_night_bright"
                                    onChange={(text) => setEditState({ ...editState, data: text })}
                                    readOnly={saving}
                                    value={editState.data}
                                    tabSize={4}
                                    showPrintMargin={false}
                                    width="100%"
                                    fontSize="14px"
                                    style={{ height: "60vh", marginBottom: "1rem" }}
                                />
                                : <Typography>Loading...</Typography>
                            }
                        </div>
                        <Button variant="contained" disabled={saving} style={{ backgroundColor: "#1f9e2c" }} onClick={saveEdits}>Save</Button>
                        <Button variant="contained" disabled={saving} onClick={() => setEditState({ ...editState, open: false })}>Cancel</Button>       
                    </React.Fragment>
                }
            </Dialog>
        </React.Fragment>
    );
}
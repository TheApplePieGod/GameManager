import {
    Button,
    Paper,
    TextField,
    Typography,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Drawer,
    Fab,
    Tooltip,
    Dialog,
    DialogTitle
} from "@material-ui/core";
import React from "react";
import * as api from "../definitions/api";
import { ChatMessage, Message, MessageType } from "../definitions/types";
import * as theme from "../theme";
import DescriptionIcon from "@material-ui/icons/Description";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import { SnackbarStatus } from "./snackbar";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-tomorrow_night_bright";
import { ConfirmDialog } from "./confirmDialog";
const { ipcRenderer } = require("electron");

interface Props {
    openSnackbar: (status: SnackbarStatus, message: string, closeDelay: number) => void;
}

const BLOCKED_FILES = ["paper-docker.conf", ".bash_history", "server-restart-lock"];

export const FilesDialog = (props: Props) => {
    const [open, setOpen] = React.useState(false);
    const [fileToDelete, setFileToDelete] = React.useState("");
    const [editState, setEditState] = React.useState({
        open: false,
        fileName: "",
        path: "",
        data: ""
    });
    const [files, setFiles] = React.useState<string[]>([]);
    const [path, setPath] = React.useState("/paper/");
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [uploading, setUploading] = React.useState("");

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpen = () => {
        setOpen(true);
        setLoading(true);
        window.socket?.send(JSON.stringify({ type: MessageType.ListFiles, data: path }));
    };

    const updatePath = (newPath: string) => {
        setPath(newPath);
        setLoading(true);
        window.socket?.send(JSON.stringify({ type: MessageType.ListFiles, data: newPath }));
    };

    const refresh = () => {
        updatePath(path);
    };

    const edit = (editPath: string, fileName: string) => {
        if (fileName == "paper-docker.conf") {
            props.openSnackbar(SnackbarStatus.Warning, "This file is not editable", 4000);
            return;
        }

        setLoading(true);
        setEditState({ open: true, fileName: fileName, data: "", path: editPath });
        window.socket?.send(JSON.stringify({ type: MessageType.LoadFile, data: editPath }));
    };

    const stepBack = () => {
        let steps = path.slice(0, -1).split("/");
        steps.pop();
        const newPath = steps.join("/") + "/";
        setPath(newPath);
        setLoading(true);
        window.socket?.send(JSON.stringify({ type: MessageType.ListFiles, data: newPath }));
    };

    const goToRoot = () => {
        updatePath("/paper/");
    };

    const handleMessage = (msg: { data: any }) => {
        let jsonString = "";
        if (typeof msg.data == "string") jsonString = msg.data;
        else {
            console.log("data", msg.data);
            return;
        }

        const message = JSON.parse(jsonString);

        switch (message.type) {
            default:
                {
                }
                break;

            case MessageType.ListFiles:
                {
                    setLoading(false);
                    if (message.data.success) {
                        message.data.data = message.data.data.trim();
                        if (message.data.data != path) {
                            // this will happen if we try to ls a regular file
                            let newFiles = message.data.data.split("\n");
                            //newFiles.shift(); // remove first element as that is the 'total' row returned from ls
                            setFiles(newFiles);
                            break;
                        }
                    }

                    props.openSnackbar(SnackbarStatus.Error, "Failed to list files", 4000);
                    stepBack();
                }
                break;

            case MessageType.LoadFile:
                {
                    setLoading(false);
                    if (message.data.success) {
                        setEditState({ ...editState, data: message.data.data });
                    } else {
                        props.openSnackbar(SnackbarStatus.Error, message.data.message, 4000);
                        setEditState({ ...editState, open: false, data: "" });
                    }
                }
                break;

            case MessageType.SaveFile:
                {
                    setSaving(false);
                    if (message.data.success) {
                        setEditState({ open: false, fileName: "", path: "", data: "" });
                        props.openSnackbar(SnackbarStatus.Success, "Saved!", 4000);
                    } else {
                        props.openSnackbar(SnackbarStatus.Error, message.data.message, 4000);
                    }
                }
                break;

            case MessageType.DeleteFile:
                {
                    if (message.data.success) {
                        props.openSnackbar(SnackbarStatus.Success, "Deleted", 4000);
                        refresh();
                    } else {
                        props.openSnackbar(SnackbarStatus.Error, message.data.message, 4000);
                    }
                }
                break;

            case MessageType.StartUploadFile:
                {
                    if (message.data.success) {
                        api.uploadFile();
                    } else {
                        props.openSnackbar(SnackbarStatus.Error, message.data.message, 4000);
                        setUploading("");
                    }
                }
                break;

            case MessageType.StopUploadFile:
                {
                    setUploading("");
                    if (message.data.success) {
                        props.openSnackbar(
                            SnackbarStatus.Success,
                            "File upload successful! You may have to wait for it to complete unzipping. An upload will not replace existing files",
                            8000
                        );
                        if (path == uploading) updatePath(path);
                    } else {
                        props.openSnackbar(SnackbarStatus.Error, message.data.message, 4000);
                    }
                }
                break;
        }
    };

    const saveEdits = () => {
        setSaving(true);
        props.openSnackbar(SnackbarStatus.Info, "Saving...", 4000);
        window.socket?.send(
            JSON.stringify({
                type: MessageType.SaveFile,
                data: { path: editState.path, data: editState.data }
            })
        );
    };

    const deleteFile = (path: string) => {
        if (path.includes("paper-docker.conf")) {
            props.openSnackbar(SnackbarStatus.Warning, "This file cannot be deleted", 4000);
            return;
        }

        setFileToDelete("");
        window.socket?.send(JSON.stringify({ type: MessageType.DeleteFile, data: path }));
    };

    const uploadFile = (isFolder: boolean) => {
        api.prepareUploadFile(isFolder).then((result) => {
            if (result.success) {
                window.socket?.send(
                    JSON.stringify({
                        type: MessageType.StartUploadFile,
                        data: { path: path, size: result.size }
                    })
                );
            } else {
                if (!result.cancelled)
                    props.openSnackbar(
                        SnackbarStatus.Error,
                        "Failed to prepare file for upload",
                        4000
                    );
                setUploading("");
            }
        });
        setUploading(path);
    };

    const updateUploadProgress = (progress: number) => {
        props.openSnackbar(
            SnackbarStatus.Info,
            `Uploading: ${Math.round(
                progress * 100
            )}% Interrupting the connection will result in an incomplete upload`,
            4000
        );
    };

    const fileDataReceive = (event: any, data: any) => {
        window.socket?.send(JSON.stringify({ type: MessageType.FileDataReceive, data: data.data }));
        updateUploadProgress(data.progress);
    };

    const fileDataFinished = (event: any, data: any) => {
        if (!data.success)
            props.openSnackbar(SnackbarStatus.Error, "Upload failed partway through", 5000);
        window.socket?.send(
            JSON.stringify({ type: MessageType.StopUploadFile, data: data.success })
        );
    };

    const fileDataStarted = (event: any) => {
        updateUploadProgress(0);
    };

    const fileDataCancelled = (event: any) => {
        window.socket?.send(JSON.stringify({ type: MessageType.StopUploadFile, data: false }));
    };

    const zippingFile = (event: any) => {
        props.openSnackbar(SnackbarStatus.Info, "Zipping local file...", 4000);
    };

    React.useEffect(() => {
        window.socket?.addEventListener("message", handleMessage);

        return () => {
            window.socket?.removeEventListener("message", handleMessage);
        };
    }, [window.socket, path, editState.open, uploading]);

    React.useEffect(() => {
        ipcRenderer.on("fileDataReceive", fileDataReceive);
        ipcRenderer.on("fileDataFinished", fileDataFinished);
        ipcRenderer.on("fileDataStarted", fileDataStarted);
        ipcRenderer.on("fileDataCancelled", fileDataCancelled);
        ipcRenderer.on("zippingFile", zippingFile);

        return () => {
            ipcRenderer.off("fileDataReceive", fileDataReceive);
            ipcRenderer.off("fileDataFinished", fileDataFinished);
            ipcRenderer.off("fileDataStarted", fileDataStarted);
            ipcRenderer.off("fileDataCancelled", fileDataCancelled);
            ipcRenderer.off("zippingFile", zippingFile);
        };
    }, []);

    return (
        <React.Fragment>
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
                {open && (
                    <React.Fragment>
                        <DialogTitle>Manage Files</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "0.25rem",
                                    marginBottom: "-0.5rem",
                                    marginLeft: "1rem"
                                }}
                            >
                                <Button variant="outlined" disabled={loading} onClick={refresh}>
                                    Refresh
                                </Button>
                                <Button
                                    variant="outlined"
                                    disabled={loading || path == "/paper/"}
                                    onClick={stepBack}
                                >
                                    Step back
                                </Button>
                                <Button
                                    variant="outlined"
                                    disabled={loading || path == "/paper/"}
                                    onClick={goToRoot}
                                >
                                    Go to root
                                </Button>
                                <Button
                                    variant="outlined"
                                    disabled={loading || uploading != ""}
                                    onClick={() => uploadFile(false)}
                                >
                                    Upload file
                                </Button>
                                <Button
                                    variant="outlined"
                                    disabled={loading || uploading != ""}
                                    onClick={() => uploadFile(true)}
                                >
                                    Upload folder
                                </Button>
                            </div>
                            <div
                                id="filelist"
                                style={{
                                    width: "95%",
                                    fontFamily: "Source Code Pro",
                                    overflowY: "scroll",
                                    height: "calc(100vh - 300px)",
                                    margin: "1rem",
                                    padding: "1rem",
                                    backgroundColor: "#000",
                                    color: theme.PALETTE_WHITE
                                }}
                            >
                                <Typography style={{ marginBottom: "0.5rem" }}>
                                    <b>Path: {path}</b>
                                </Typography>
                                {files.map((f, i) => {
                                    if (f == "") return undefined;
                                    const split = f.trim().split("\t");
                                    const size = split[0];
                                    const name = split[1];
                                    if (BLOCKED_FILES.includes(name)) return undefined;
                                    if (name == "./" || name == "../") return undefined; // navigational folders
                                    const isDirectory = name.slice(-1) == "/";
                                    const filePath = path + name;
                                    // Dont allow the paper.jar to be deleted
                                    const canDelete = !(
                                        path == "/paper/" &&
                                        name.includes(".jar") &&
                                        name.includes("paper-")
                                    );
                                    // Anything editable is also deletable
                                    const canEdit =
                                        canDelete &&
                                        !isDirectory &&
                                        !size.includes("G") &&
                                        (!size.includes("M") ||
                                            parseInt(size.substring(0, size.length - 1)) < 10); // 10 MB max
                                    return (
                                        // we can assume a '.' indicates a file
                                        <div
                                            key={i}
                                            style={{ display: "flex", alignItems: "center" }}
                                        >
                                            <Typography
                                                style={{ color: isDirectory ? "#325bff" : "" }}
                                            >{`(${size}) ${name}`}</Typography>
                                            {isDirectory && (
                                                <Button
                                                    disabled={loading}
                                                    style={{ padding: 0, minWidth: "32px" }}
                                                    onClick={() => updatePath(filePath)}
                                                >
                                                    +
                                                </Button>
                                            )}
                                            {canEdit && (
                                                <Button
                                                    disabled={loading}
                                                    style={{ padding: 0, minWidth: "32px" }}
                                                    onClick={() => edit(filePath, name)}
                                                >
                                                    <EditIcon fontSize={"small"} />
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    disabled={loading}
                                                    style={{ padding: 0, minWidth: "32px" }}
                                                    onClick={() => setFileToDelete(filePath)}
                                                >
                                                    <DeleteIcon fontSize={"small"} />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <Button variant="contained" onClick={handleClose}>
                            Close
                        </Button>
                    </React.Fragment>
                )}
            </Dialog>
            <Tooltip arrow title="Server files">
                <Fab
                    color="secondary"
                    onClick={handleOpen}
                    style={{ position: "fixed", left: "4rem", bottom: 0, margin: "1rem" }}
                >
                    <DescriptionIcon />
                </Fab>
            </Tooltip>
            <Dialog
                open={editState.open}
                onClose={() => setEditState({ ...editState, open: false })}
                fullWidth
                maxWidth="lg"
            >
                {open && (
                    <React.Fragment>
                        <DialogTitle>{editState.fileName}</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            {!loading ? (
                                <AceEditor
                                    placeholder="The file is empty! Add some text here..."
                                    mode={
                                        editState.fileName.endsWith(".yml") ||
                                        editState.fileName.endsWith(".yaml")
                                            ? "yaml"
                                            : "json"
                                    }
                                    theme="tomorrow_night_bright"
                                    onChange={(text) => setEditState({ ...editState, data: text })}
                                    readOnly={saving}
                                    value={editState.data}
                                    tabSize={4}
                                    showPrintMargin={false}
                                    width="100%"
                                    fontSize="14px"
                                    setOptions={{ useWorker: false }}
                                    style={{ height: "60vh", marginBottom: "1rem" }}
                                />
                            ) : (
                                <Typography style={{ height: "60vh" }}>Loading...</Typography>
                            )}
                        </div>
                        <Button
                            variant="contained"
                            disabled={saving}
                            style={{ backgroundColor: "#1f9e2c" }}
                            onClick={saveEdits}
                        >
                            Save
                        </Button>
                        <Button
                            variant="contained"
                            disabled={saving}
                            onClick={() => setEditState({ ...editState, open: false })}
                        >
                            Cancel
                        </Button>
                    </React.Fragment>
                )}
            </Dialog>
            <ConfirmDialog
                open={fileToDelete != ""}
                onCancel={() => setFileToDelete("")}
                onConfirm={() => deleteFile(fileToDelete)}
                body={`Deleting file '${fileToDelete}' cannot be undone`}
            />
        </React.Fragment>
    );
};

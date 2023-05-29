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
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Table,
    Dialog,
    DialogTitle
} from "@material-ui/core";
import React from "react";
import { MessageType, Registration, RegistrationDefault } from "../definitions/types";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import * as theme from "../theme";
import { SnackbarStatus } from "./snackbar";
import { ConfirmDialog } from "./confirmDialog";

interface Props {
    openSnackbar: (status: SnackbarStatus, message: string, closeDelay: number) => void;
}

export const AdminPage = (props: Props) => {
    const [regs, setRegs] = React.useState<Registration[] | undefined>(undefined);
    const [editState, setEditState] = React.useState({ open: false, value: RegistrationDefault });
    const [saving, setSaving] = React.useState(false);
    const [regToDelete, setRegToDelete] = React.useState<Registration | undefined>(undefined);

    const handleMessage = (msg: { data: any }) => {
        let jsonString = "";
        if (typeof msg.data == "string") jsonString = msg.data;
        else {
            return;
        }

        const message = JSON.parse(jsonString);

        switch (message.type) {
            default:
                {
                }
                break;

            case MessageType.ListRegistrations:
                {
                    if (message.data.success) {
                        setRegs(message.data.data);
                    } else {
                        props.openSnackbar(
                            SnackbarStatus.Error,
                            "Failed to load registrations",
                            4000
                        );
                    }
                }
                break;

            case MessageType.SaveRegistration:
                {
                    setSaving(false);
                    if (message.data.success) {
                        setEditState({ open: false, value: RegistrationDefault });
                        props.openSnackbar(SnackbarStatus.Success, "Saved!", 4000);
                        loadRegistrations();
                    } else {
                        props.openSnackbar(SnackbarStatus.Error, message.data.message, 4000);
                    }
                }
                break;

            case MessageType.DeleteRegistration:
                {
                    if (message.data.success) {
                        props.openSnackbar(SnackbarStatus.Success, "Deleted!", 4000);
                        setRegToDelete(undefined);
                        loadRegistrations();
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
                type: MessageType.SaveRegistration,
                data: editState.value
            })
        );
    };

    const loadRegistrations = () => {
        setRegs(undefined);
        window.socket?.send(JSON.stringify({ type: MessageType.ListRegistrations }));
    };

    const generateKey = () => {
        const len = 64;
        const arr = new Uint8Array((len || 40) / 2);
        window.crypto.getRandomValues(arr);
        return Array.from(arr, (dec) => dec.toString(16).padStart(2, "0")).join("");
    };

    const createNew = () => {
        const newReg = { ...RegistrationDefault };
        newReg.apiKey = generateKey();
        newReg.supportKey = "{SUP}" + generateKey();
        setEditState({ open: true, value: newReg });
    };

    const editReg = (reg: Registration) => {
        setEditState({ open: true, value: { ...reg } });
    };

    const deleteReg = () => {
        props.openSnackbar(SnackbarStatus.Info, "Deleting...", 4000);
        window.socket?.send(
            JSON.stringify({
                type: MessageType.DeleteRegistration,
                data: regToDelete?.id
            })
        );
    };

    const disconnect = () => {
        if (window.socket) window.socket.close();
        window.socket = undefined;
    };

    React.useEffect(() => {
        window.socket?.addEventListener("message", handleMessage);

        return () => {
            window.socket?.removeEventListener("message", handleMessage);
        };
    }, [window.socket]);

    React.useEffect(() => {
        loadRegistrations();
    }, []);

    return (
        <React.Fragment>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {regs === undefined ? (
                    <Typography variant="h3">Loading...</Typography>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Id</TableCell>
                                    <TableCell>Key</TableCell>
                                    <TableCell>Support Key</TableCell>
                                    <TableCell>Workload</TableCell>
                                    <TableCell>Java Opts</TableCell>
                                    <TableCell>Active</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {regs.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell component="th" scope="row">
                                            {reg.id}
                                        </TableCell>
                                        <TableCell
                                            style={{ maxWidth: "20vw", overflowX: "scroll" }}
                                        >
                                            {reg.apiKey}
                                        </TableCell>
                                        <TableCell
                                            style={{ maxWidth: "20vw", overflowX: "scroll" }}
                                        >
                                            {reg.supportKey}
                                        </TableCell>
                                        <TableCell>{reg.workloadName}</TableCell>
                                        <TableCell>{reg.javaOpts}</TableCell>
                                        <TableCell>{reg.active ? "Yes" : "No"}</TableCell>
                                        <TableCell>
                                            <Button
                                                style={{ padding: 0, minWidth: "32px" }}
                                                onClick={() => editReg(reg)}
                                            >
                                                <EditIcon fontSize={"small"} />
                                            </Button>
                                            <Button
                                                style={{ padding: 0, minWidth: "32px" }}
                                                onClick={() => setRegToDelete(reg)}
                                            >
                                                <DeleteIcon fontSize={"small"} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <Button
                    style={{ marginTop: "1rem" }}
                    onClick={createNew}
                    variant="contained"
                    color="primary"
                >
                    New Registration
                </Button>
                <Button
                    variant="contained"
                    style={{ backgroundColor: theme.PALETTE_RED }}
                    onClick={disconnect}
                >
                    Disconnect
                </Button>
            </div>
            <Dialog
                open={editState.open}
                onClose={() => setEditState({ ...editState, open: false })}
                fullWidth
                maxWidth="lg"
            >
                <React.Fragment>
                    <DialogTitle>Editing Registration</DialogTitle>
                    <div style={{ padding: "1rem" }}>
                        <TextField
                            style={{ width: "100%", marginBottom: "0.5rem" }}
                            label="API Key"
                            variant="outlined"
                            value={editState.value.apiKey}
                            onChange={(e) =>
                                setEditState({
                                    ...editState,
                                    value: { ...editState.value, apiKey: e.target.value }
                                })
                            }
                        />
                        <TextField
                            style={{ width: "100%", marginBottom: "0.5rem" }}
                            label="Support Key"
                            variant="outlined"
                            value={editState.value.supportKey}
                            onChange={(e) =>
                                setEditState({
                                    ...editState,
                                    value: { ...editState.value, supportKey: e.target.value }
                                })
                            }
                        />
                        <TextField
                            style={{ width: "100%", marginBottom: "0.5rem" }}
                            label="Workload Name"
                            variant="outlined"
                            value={editState.value.workloadName}
                            onChange={(e) =>
                                setEditState({
                                    ...editState,
                                    value: { ...editState.value, workloadName: e.target.value }
                                })
                            }
                        />
                        <TextField
                            style={{ width: "100%", marginBottom: "0.5rem" }}
                            label="Java Options"
                            variant="outlined"
                            value={editState.value.javaOpts}
                            onChange={(e) =>
                                setEditState({
                                    ...editState,
                                    value: { ...editState.value, javaOpts: e.target.value }
                                })
                            }
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={editState.value.active}
                                    onChange={(e) =>
                                        setEditState({
                                            ...editState,
                                            value: { ...editState.value, active: e.target.checked }
                                        })
                                    }
                                />
                            }
                            label="Active"
                            style={{ marginBottom: "0.5rem", color: theme.PALETTE_WHITE }}
                        />
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
            </Dialog>
            <ConfirmDialog
                open={regToDelete !== undefined}
                onCancel={() => setRegToDelete(undefined)}
                onConfirm={() => deleteReg()}
                body={`Deleting registration (Id: ${regToDelete?.id}, Workload: '${regToDelete?.workloadName}') cannot be undone`}
            />
        </React.Fragment>
    );
};

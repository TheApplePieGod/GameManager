import React from 'react';
import { Button, Checkbox, Dialog, DialogTitle, FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField, Tooltip, Typography } from '@material-ui/core';

interface Props {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title?: string;
    body?: string;
    fullWidth?: boolean;
    maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmDialog = (props: Props) => {
    return (
        <Dialog
            open={props.open}
            onClose={props.onCancel}
            fullWidth={props.fullWidth ?? false}
            maxWidth={props.maxWidth ?? "md"}
        >
            {props.open &&
                <React.Fragment>
                    <DialogTitle>{props.title ?? "Are you sure?"}</DialogTitle>
                    <div style={{ padding: "1rem" }}>
                        <Typography>{props.body ?? ""}</Typography>
                    </div>
                    <Button variant="contained" style={{ backgroundColor: "#1f9e2c" }} onClick={props.onConfirm}>{props.confirmText ?? "Confirm"}</Button>
                    <Button variant="contained" onClick={props.onCancel}>{props.cancelText ?? "Cancel"}</Button>
                </React.Fragment>
            }
        </Dialog>
    );
}
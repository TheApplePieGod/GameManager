import { Snackbar } from "@material-ui/core";
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import * as React from "react";

export enum SnackbarStatus {
    Closed = 0,
    Error = 1,
    Success = 2,
    Warning = 3,
    Info = 4
}

export interface SnackbarState {
    status: SnackbarStatus;
    message: string;
    closeDelay: number;
}

const Alert = (props: AlertProps) => {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

interface Props {
    state: SnackbarState;
    onClose: () => void;
}

const _GlobalSnackbar = (props: Props) => {
    const handleClose = () => {
        props.onClose();
    }

    let severity: any = "info";
    switch (props.state.status) {
        case SnackbarStatus.Error:
            severity = "error";
            break;
        case SnackbarStatus.Warning:
            severity = "warning";
            break;
        case SnackbarStatus.Info:
            severity = "info";
            break;
        case SnackbarStatus.Success:
            severity = "success";
            break;
    }

    return (
        <Snackbar
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "center"
            }}
            open={props.state.status != SnackbarStatus.Closed}
            autoHideDuration={props.state.closeDelay}
            onClose={(event, reason) => { if (reason != "clickaway") handleClose(); }}
        >
            <Alert onClose={handleClose} severity={severity}>
                {props.state.message}
            </Alert>
        </Snackbar>
    );
}

export const GlobalSnackbar = React.memo(_GlobalSnackbar);
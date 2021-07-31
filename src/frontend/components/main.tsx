import React from 'react';
import * as api from '../definitions/api';
import * as theme from '../theme';
import '../css/global.css'
import { MinecraftDashboard } from './minecraftDashboard';
import { GlobalSnackbar, SnackbarState, SnackbarStatus } from './snackbar';

export const Main = () => {
    const [snackbarState, setSnackbarState] = React.useState<SnackbarState>({
        status: SnackbarStatus.Closed,
        message: "",
        closeDelay: 3000
    });

    const openSnackbar = (status: SnackbarStatus, message: string, closeDelay: number) => {
        setSnackbarState({
            status,
            message,
            closeDelay
        });
    }

    return (
        <div>
            <MinecraftDashboard openSnackbar={openSnackbar} />
            <GlobalSnackbar state={snackbarState} onClose={() => setSnackbarState({...snackbarState, status: SnackbarStatus.Closed})} />
        </div>
    );
}
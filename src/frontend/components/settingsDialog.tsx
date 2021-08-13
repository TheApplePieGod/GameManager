import { Button, Paper, TextField, Typography, Select, MenuItem, Checkbox, FormControlLabel, Drawer, Fab, Tooltip, Dialog, DialogTitle, FormControl, InputLabel } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import { ChatMessage, Message, MessageType, ServerSettings, ServerSettingsDefault } from '../definitions/types';
import * as theme from '../theme';
import DescriptionIcon from '@material-ui/icons/Description';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import { SnackbarStatus } from './snackbar';
import SettingsIcon from '@material-ui/icons/Settings';
import InfoIcon from '@material-ui/icons/Info';

interface Props {
    openSnackbar: (status: SnackbarStatus, message: string, closeDelay: number) => void;
}

export const SettingsDialog = (props: Props) => {
    const [open, setOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [loading, setLoading] =  React.useState(true);
    const [settings, setSettings] = React.useState(ServerSettingsDefault);

    const saveSettings = () => {
        setSaving(true);
        props.openSnackbar(SnackbarStatus.Info, "Saving...", 4000);
        window.socket?.send(JSON.stringify({ type: MessageType.SaveSettings, data: settings }));
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

            case MessageType.LoadSettings: {
                setLoading(false);
                if (message.data.success) {
                    const loadedSettings = message.data.data;
                    let newSettings: ServerSettings = {
                        worldName: loadedSettings.world_name,
                        maxBackups: parseInt(loadedSettings.max_backups),
                        backupTimeMin: parseInt(loadedSettings.backup_time_min),
                        backupLogging: loadedSettings.backup_logging == "true",
                        minecraftVersion: loadedSettings.minecraft_version,
                        paperBuild: loadedSettings.paper_build,
                    };

                    if (newSettings.maxBackups % 5 != 0)
                        newSettings.maxBackups = 5;

                    if (newSettings.backupTimeMin % 15 != 0)
                        newSettings.backupTimeMin = 30;

                    setSettings(newSettings);
                } else {
                    setOpen(false);
                    props.openSnackbar(SnackbarStatus.Error, "Failed to load settings", 4000);
                }
            } break;

            case MessageType.SaveSettings: {
                setSaving(false);
                if (message.data.success) {
                    props.openSnackbar(SnackbarStatus.Success, "Saved!", 4000);
                    setOpen(false);
                } else {
                    props.openSnackbar(SnackbarStatus.Error, "Failed to save settings", 4000);
                }
            } break;
        }
    }

    React.useEffect(() => {
        window.socket?.addEventListener('message', handleMessage);

        return (() => {
            window.socket?.removeEventListener('message', handleMessage);
        });
    }, [window.socket]);

    React.useEffect(() => {
        window.socket?.send(JSON.stringify({ type: MessageType.LoadSettings }));
        setLoading(true);
    }, [])

    return (
        <React.Fragment>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                {open &&
                    <React.Fragment>
                        <DialogTitle>Server Settings</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem" }}>
                                <TextField
                                    fullWidth
                                    label="World name"
                                    variant="outlined"
                                    value={settings.worldName}
                                    disabled={loading || saving}
                                    onChange={(e) => setSettings({ ...settings, worldName: e.target.value })}
                                />
                                <Tooltip title={<Typography>The name of the world to run the server with. It will look for the directory with the corresponding name in the /paper/Worlds folder and create a new world if it does not exist. Backups will also run for the world with this name</Typography>}>
                                    <InfoIcon />
                                </Tooltip>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem" }}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="maxbackups-label">Max backups</InputLabel>
                                    <Select
                                        labelId="maxbackups-label"
                                        label="Max backups"
                                        value={settings.maxBackups}
                                        disabled={loading || saving}
                                        onChange={(e) => setSettings({ ...settings, maxBackups: e.target.value as number })}
                                    >
                                        <MenuItem value={5}>5</MenuItem>
                                        <MenuItem value={10}>10</MenuItem>
                                        <MenuItem value={15}>15</MenuItem>
                                    </Select>
                                </FormControl>
                                <Tooltip title={<Typography>The maximum amount of backups that can exist at one time per world. The oldest of the backups will be deleted to meet this threshold</Typography>}>
                                    <InfoIcon />
                                </Tooltip>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem" }}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="maxbackups-label">Backup interval (min)</InputLabel>
                                    <Select
                                        labelId="backuptime-label"
                                        label="Backup interval (min)"
                                        value={settings.backupTimeMin}
                                        disabled={loading || saving}
                                        onChange={(e) => setSettings({ ...settings, backupTimeMin: e.target.value as number })}
                                    >
                                        <MenuItem value={0}>0</MenuItem>
                                        <MenuItem value={15}>15</MenuItem>
                                        <MenuItem value={30}>30</MenuItem>
                                        <MenuItem value={45}>45</MenuItem>
                                        <MenuItem value={60}>60</MenuItem>
                                    </Select>
                                </FormControl>
                                <Tooltip title={<Typography>The time in minutes between each backup. Set this value to zero to disable the backup task completely</Typography>}>
                                    <InfoIcon />
                                </Tooltip>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem" }}>
                                <TextField
                                    fullWidth
                                    label="Minecraft version"
                                    variant="outlined"
                                    value={settings.minecraftVersion}
                                    disabled={loading || saving}
                                    onChange={(e) => setSettings({ ...settings, minecraftVersion: e.target.value })}
                                />
                                <Tooltip title={<Typography>When installing the Paper server, use a specific version of minecraft (i.e. 1.17.1). This can also be set to latest to use the most recent version</Typography>}>
                                    <InfoIcon />
                                </Tooltip>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem" }}>
                                <TextField
                                    fullWidth
                                    label="Paper build"
                                    variant="outlined"
                                    value={settings.paperBuild}
                                    disabled={loading || saving}
                                    onChange={(e) => setSettings({ ...settings, paperBuild: e.target.value })}
                                />
                                <Tooltip title={<Typography>When installing the Paper server, use a specific build of Paper (i.e. 54). This can also be set to latest to use the most recent version</Typography>}>
                                    <InfoIcon />
                                </Tooltip>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FormControlLabel
                                    control={<Checkbox checked={settings.backupLogging} disabled={loading || saving} onChange={(e) => setSettings({ ...settings, backupLogging: e.target.checked })} />}
                                    label="Backup logging"
                                />
                                <Tooltip title={<Typography>Log status of backups to the server console</Typography>}>
                                    <InfoIcon />
                                </Tooltip>
                            </div>
                        </div>
                        <Button variant="contained" disabled={loading || saving} style={{ backgroundColor: "#1f9e2c" }} onClick={saveSettings}>Save (restart required)</Button>
                        <Button variant="contained" onClick={() => setOpen(false)}>Cancel</Button>       
                    </React.Fragment>
                }
            </Dialog>
            <Tooltip arrow title="Server settings">
                <Fab onClick={() => setOpen(true)} style={{ position: "fixed", left: "8rem", bottom: 0, margin: "1rem" }}><SettingsIcon /></Fab>
            </Tooltip>
        </React.Fragment>
    );
}
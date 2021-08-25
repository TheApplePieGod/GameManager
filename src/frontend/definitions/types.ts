declare global {
    interface Window {
        socket: WebSocket | undefined;
    }
}

export enum MessageType {
    Connect = "connect",
    Disconnect = "disconnect",
    Ping = "ping",
    StartMonitor = "startmonitor",
    StopMonitor = "stopmonitor",
    MonitorReceive = "monitorreceive",
    IssueCommand = "issuecommand",
    Restart = "restart",
    Stop = "stop",
    Start = "start",
    Restarted = "restarted",
    ChatReceive = "chatreceive",
    LoadChat = "loadchat",
    SendChat = "sendchat",
    ListFiles = "listfiles",
    LoadFile = "loadfile",
    SaveFile = "savefile",
    DeleteFile = "deletefile",
    StartUploadFile = "startuploadfile",
    StopUploadFile = "stopuploadfile",
    FileDataReceive = "filedatareceive",
    LoadSettings = "loadsettings",
    SaveSettings = "savesettings",
}

export interface Message {
    type: MessageType,
    data: any
}

export interface ChatMessage {
    message: string;
    support: boolean;
    timestamp: string;
}

export interface PrepareUploadResult {
    success: boolean;
    size: number;
}

export interface ServerSettings {
    worldName: string;
    maxBackups: number;
    backupTimeMin: number;
    backupLogging: boolean;
    minecraftVersion: string;
    paperBuild: string;
}
export const ServerSettingsDefault: ServerSettings = {
    worldName: "world",
    maxBackups: 5,
    backupTimeMin: 30,
    backupLogging: true,
    minecraftVersion: "latest",
    paperBuild: "latest"
}
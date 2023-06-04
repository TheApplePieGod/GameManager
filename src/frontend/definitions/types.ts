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
    ListRegistrations = "listregistrations",
    SaveRegistration = "saveregistration",
    DeleteRegistration = "deleteregistration"
}

export interface Message {
    type: MessageType;
    data: any;
}

export interface ChatMessage {
    message: string;
    support: boolean;
    timestamp: string;
}

export interface PrepareUploadResult {
    success: boolean;
    cancelled: boolean;
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
};

export interface Registration {
    id: number;
    apiKey: string;
    supportKey: string;
    workloadName: string;
    javaOpts: string;
    active: boolean;
}
export const RegistrationDefault: Registration = {
    id: 0,
    apiKey: "",
    supportKey: "",
    workloadName: "",
    javaOpts: "-Xms12G -Xmx12G",
    active: true
};

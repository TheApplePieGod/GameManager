declare global {
    interface Window {
        socket: WebSocket | undefined;
    }
}

export enum MessageType {
    Connect = "connect",
    Disconnect = "disconnect",
    StartMonitor = "startmonitor",
    StopMonitor = "stopmonitor",
    MonitorReceive = "monitorreceive",
    IssueCommand = "issuecommand",
    Restart = "restart",
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
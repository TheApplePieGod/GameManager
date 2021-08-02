export interface Window {

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
}

export interface Message {
    type: MessageType,
    data: any
}
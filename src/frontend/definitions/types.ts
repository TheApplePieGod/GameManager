export interface Window {

}

export enum MessageType {
    Connect = "connect",
    StartMonitor = "startmonitor",
    StopMonitor = "stopmonitor",
    MonitorReceive = "monitorreceive",
    IssueCommand = "issuecommand"
}

export interface Message {
    type: MessageType,
    data: any
}
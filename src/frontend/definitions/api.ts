const { ipcRenderer } = require("electron");
import * as types from './types';

export const uploadFile = async () => {
    ipcRenderer.invoke('uploadFile');
}
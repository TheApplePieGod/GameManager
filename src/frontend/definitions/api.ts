const { ipcRenderer } = require("electron");
import * as types from './types';

export const uploadFile = async () => {
    ipcRenderer.invoke('uploadFile');
}

export const prepareUploadFile = async () => {
    const result: types.PrepareUploadResult = await ipcRenderer.invoke('prepareUploadFile');
    return result;
}
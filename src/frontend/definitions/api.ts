const { ipcRenderer } = require("electron");
import * as types from './types';

export const uploadFile = async () => {
    ipcRenderer.invoke('uploadFile');
}

export const prepareUploadFile = async (isFolder: boolean) => {
    const result: types.PrepareUploadResult = await ipcRenderer.invoke('prepareUploadFile', isFolder);
    return result;
}
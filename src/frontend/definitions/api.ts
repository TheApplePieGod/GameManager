const { ipcRenderer } = require("electron");
import * as types from './types';

export const testFunction = async (param: string) => {
    const result: string = await ipcRenderer.invoke('testFunction', param);
    return result;
}
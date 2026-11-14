import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  isElectron: boolean;
  loadDatabase: () => Promise<unknown>;
  saveDatabase: (data: unknown) => Promise<boolean>;
  exportPdf: (htmlContent: string, title: string) => Promise<boolean>;
  saveFile: (content: string, defaultFilename: string, extensions: string[]) => Promise<boolean>;
  exportAllToFolder: (data: unknown) => Promise<boolean>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

const api: ElectronAPI = {
  isElectron: true,
  loadDatabase: () => ipcRenderer.invoke('notes:load-database'),
  saveDatabase: (data: unknown) => ipcRenderer.invoke('notes:save-database', data),
  exportPdf: (htmlContent: string, title: string) =>
    ipcRenderer.invoke('notes:export-pdf', htmlContent, title),
  saveFile: (content: string, defaultFilename: string, extensions: string[]) =>
    ipcRenderer.invoke('notes:save-file', content, defaultFilename, extensions),
  exportAllToFolder: (data: unknown) =>
    ipcRenderer.invoke('notes:export-all-to-folder', data),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('electronAPI', api);

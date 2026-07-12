import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import { checkForUpdates, downloadUpdate, quitAndInstall, isAutoUpdateSupported } from '../update/autoUpdate'

export function registerUpdateHandlers(): void {
  ipcMain.handle(IPC.updateIsSupported, () => isAutoUpdateSupported())
  ipcMain.handle(IPC.updateCheck, () => checkForUpdates())
  ipcMain.handle(IPC.updateDownload, () => downloadUpdate())
  ipcMain.handle(IPC.updateInstall, () => quitAndInstall())
}

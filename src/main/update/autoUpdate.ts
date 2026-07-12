import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IPC } from '@shared/ipcChannels'
import type { UpdateStatus } from '@shared/types'

let currentWindow: BrowserWindow | null = null

function send(status: UpdateStatus): void {
  currentWindow?.webContents.send(IPC.updateStatusPush, status)
}

export function initAutoUpdater(win: BrowserWindow): void {
  currentWindow = win
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => send({ state: 'checking' }))
  autoUpdater.on('update-available', (info) => send({ state: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => send({ state: 'not-available' }))
  autoUpdater.on('error', (err) => send({ state: 'error', message: err.message }))
  autoUpdater.on('download-progress', (progress) => send({ state: 'downloading', percent: Math.round(progress.percent) }))
  autoUpdater.on('update-downloaded', (info) => send({ state: 'downloaded', version: info.version }))
}

/** Auto-update only makes sense for a packaged, installed build — dev mode has nothing to update. */
export function isAutoUpdateSupported(): boolean {
  return app.isPackaged
}

export async function checkForUpdates(): Promise<void> {
  if (!isAutoUpdateSupported()) {
    send({ state: 'not-available' })
    return
  }
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    send({ state: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

export async function downloadUpdate(): Promise<void> {
  if (!isAutoUpdateSupported()) return
  try {
    await autoUpdater.downloadUpdate()
  } catch (err) {
    send({ state: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

export function quitAndInstall(): void {
  if (!isAutoUpdateSupported()) return
  autoUpdater.quitAndInstall()
}

import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { ProviderId } from '@shared/types'
import * as settingsRepo from '../db/repo/providerSettings'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.settingsListProviders, () => settingsRepo.listGlobalProviderSettings())
  ipcMain.handle(IPC.settingsSetApiKey, (_e, input: { provider: ProviderId; workspaceId: string | null; apiKey: string }) =>
    settingsRepo.setApiKey(input.provider, input.workspaceId, input.apiKey)
  )
  ipcMain.handle(IPC.settingsClearApiKey, (_e, input: { provider: ProviderId; workspaceId: string | null }) =>
    settingsRepo.clearApiKey(input.provider, input.workspaceId)
  )
  ipcMain.handle(IPC.settingsSetDefaultModel, (_e, input: { provider: ProviderId; workspaceId: string | null; model: string }) =>
    settingsRepo.setDefaultModel(input.provider, input.workspaceId, input.model)
  )
  ipcMain.handle(IPC.settingsIsEncryptionAvailable, () => settingsRepo.isEncryptionAvailable())
}

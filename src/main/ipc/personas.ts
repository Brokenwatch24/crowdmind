import { ipcMain, BrowserWindow, dialog } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { CsvColumnMapping, CsvPreview, PersonaDraft, ProviderId } from '@shared/types'
import * as personasRepo from '../db/repo/personas'
import { generatePersonasWithAi } from '../llm/useCases'
import { resolveCall } from '../llm/resolveCall'
import { readCsvPreview, parseCsvToPersonaDrafts } from '../csv/csvImport'

export function registerPersonaHandlers(): void {
  ipcMain.handle(IPC.personasList, (_e, panelId: string) => personasRepo.listPersonas(panelId))
  ipcMain.handle(IPC.personasGet, (_e, id: string) => personasRepo.getPersona(id))
  ipcMain.handle(IPC.personasCreate, (_e, panelId: string, draft: PersonaDraft) => personasRepo.createPersona(panelId, draft))
  ipcMain.handle(IPC.personasUpdate, (_e, id: string, draft: Partial<PersonaDraft>) => personasRepo.updatePersona(id, draft))
  ipcMain.handle(IPC.personasDelete, (_e, id: string) => personasRepo.deletePersona(id))

  ipcMain.handle(
    IPC.personasGeneratePreview,
    async (_e, input: { workspaceId: string; brief: string; count: number; provider: ProviderId; model?: string }) => {
      const call = resolveCall(input.workspaceId, input.provider, input.model)
      return generatePersonasWithAi(call, input.brief, input.count)
    }
  )
  ipcMain.handle(IPC.personasSaveBulk, (_e, panelId: string, drafts: PersonaDraft[]) =>
    personasRepo.createPersonasBulk(panelId, drafts)
  )

  ipcMain.handle(IPC.personasPickCsvFile, async (event): Promise<CsvPreview | null> => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const { canceled, filePaths } = await dialog.showOpenDialog(parentWindow as BrowserWindow, {
      title: 'Selecciona un CSV de encuesta',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return null
    return readCsvPreview(filePaths[0])
  })

  ipcMain.handle(
    IPC.personasImportCsvPreview,
    (_e, input: { filePath: string; mapeoColumnas: CsvColumnMapping; agruparSimilares: boolean }) =>
      parseCsvToPersonaDrafts(input.filePath, input.mapeoColumnas, input.agruparSimilares)
  )
}

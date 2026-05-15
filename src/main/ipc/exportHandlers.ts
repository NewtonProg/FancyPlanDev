import { ipcMain, dialog } from 'electron'
import { writeFileSync } from 'fs'

ipcMain.handle('export:csv', async (_e, csvString: string, defaultFilename: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: defaultFilename,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })
  if (canceled || !filePath) return { canceled: true }
  try {
    writeFileSync(filePath, '﻿' + csvString, 'utf8') // BOM für Excel
    return { ok: true, path: filePath }
  } catch (err) {
    return { error: String(err) }
  }
})

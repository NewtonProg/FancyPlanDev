import { ipcMain, dialog, BrowserWindow } from 'electron'
import { importFromAccess } from '../migration/importAccess'

ipcMain.handle('db:migrate:fromAccess', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)

  const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
    title: 'Access-Datenbank auswählen',
    filters: [{ name: 'Access Database', extensions: ['accdb', 'mdb'] }],
    properties: ['openFile']
  })

  if (canceled || filePaths.length === 0) return { canceled: true }

  return await importFromAccess(filePaths[0])
})

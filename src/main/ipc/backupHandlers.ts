import { ipcMain } from 'electron'
import { backupDb } from '../db/database'

ipcMain.handle('db:backup:create', () => backupDb())

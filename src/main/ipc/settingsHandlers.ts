import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import { getDb, getDbPath, writeConfig } from '../db/database'

function db() { return getDb() }

ipcMain.handle('settings:get', (_e, key: string) => {
  const row = db().prepare('SELECT value FROM TSettings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
})

ipcMain.handle('settings:set', (_e, key: string, value: string | null) => {
  if (value === null || value === undefined) {
    db().prepare('DELETE FROM TSettings WHERE key = ?').run(key)
  } else {
    db().prepare('INSERT OR REPLACE INTO TSettings (key, value) VALUES (?, ?)').run(key, value)
  }
  return { ok: true }
})

ipcMain.handle('settings:getAll', (_e, prefix?: string) => {
  const rows = prefix
    ? db().prepare('SELECT key, value FROM TSettings WHERE key LIKE ?').all(`${prefix}%`) as { key: string; value: string }[]
    : db().prepare('SELECT key, value FROM TSettings').all() as { key: string; value: string }[]
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
})

// ── DB-Pfad ────────────────────────────────────────────────────────────────

ipcMain.handle('app:db-path:get', () => getDbPath())

ipcMain.handle('app:db-path:browse', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'], title: 'Datenbankordner wählen' })
  if (result.canceled || !result.filePaths[0]) return null
  const path = await import('path')
  return path.join(result.filePaths[0], 'fancyplan.db')
})

ipcMain.handle('app:db-path:set', (_e, newPath: string) => {
  writeConfig({ dbPath: newPath })
  return { ok: true, needsRestart: true }
})

ipcMain.handle('app:db-path:copy-and-set', async (_e, newPath: string) => {
  try {
    const src = getDbPath()
    fs.mkdirSync(require('path').dirname(newPath), { recursive: true })
    fs.copyFileSync(src, newPath)
    writeConfig({ dbPath: newPath })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

ipcMain.handle('app:relaunch', () => {
  const { app } = require('electron')
  app.relaunch()
  app.exit(0)
})

// ── Backup exportieren ─────────────────────────────────────────────────────

ipcMain.handle('app:backup:export', async () => {
  const ts = new Date().toISOString().slice(0, 10)
  const result = await dialog.showSaveDialog({
    title: 'Backup speichern',
    defaultPath: `fancyplan_backup_${ts}.db`,
    filters: [{ name: 'SQLite Datenbank', extensions: ['db'] }]
  })
  if (result.canceled || !result.filePath) return { ok: false }
  fs.copyFileSync(getDbPath(), result.filePath)
  return { ok: true, path: result.filePath }
})

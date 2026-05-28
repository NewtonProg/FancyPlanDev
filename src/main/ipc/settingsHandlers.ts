import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { getDb, getDbPath, writeConfig, closeDb } from '../db/database'

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

// ── Branding ───────────────────────────────────────────────────────────────

ipcMain.handle('brand:logo:browse', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Logo auswählen',
    filters: [{ name: 'Bilder', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp'] }],
    properties: ['openFile']
  })
  if (result.canceled || !result.filePaths[0]) return null
  const data = fs.readFileSync(result.filePaths[0])
  const ext = path.extname(result.filePaths[0]).slice(1).toLowerCase()
  const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
  return `data:${mime};base64,${data.toString('base64')}`
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

ipcMain.handle('app:quit', () => {
  const { app } = require('electron')
  app.quit()
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

ipcMain.handle('app:backup:import', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Backup importieren',
    filters: [{ name: 'SQLite Datenbank', extensions: ['db'] }],
    properties: ['openFile']
  })
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true }
  try {
    const dest = getDbPath()
    closeDb()
    fs.copyFileSync(result.filePaths[0], dest)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

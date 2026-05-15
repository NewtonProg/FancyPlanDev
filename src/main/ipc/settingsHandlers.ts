import { ipcMain } from 'electron'
import { getDb } from '../db/database'

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

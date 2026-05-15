import { ipcMain, shell } from 'electron'
import { getDb } from '../db/database'
import { is } from '@electron-toolkit/utils'
import path from 'path'

const FCM_FORMS = ['FAct', 'FTreeEdit']

function db() { return getDb() }

function helpPath(filename: string): string {
  if (is.dev) {
    return path.resolve(__dirname, '../../..', 'FancyPlanDev', 'src', 'Help', filename)
  }
  return path.join(process.resourcesPath, 'help', filename)
}

// ── Profile ──────────────────────────────────────────────────────────────────

ipcMain.handle('fcm:profile:getAll', () =>
  db().prepare('SELECT * FROM TFCMProfile ORDER BY seq, profile_name').all()
)

ipcMain.handle('fcm:profile:create', (_e, profileName: string, seq: number) => {
  const result = db()
    .prepare('INSERT INTO TFCMProfile (profile_name, seq) VALUES (?, ?)')
    .run(profileName, seq ?? 0)
  return { id: result.lastInsertRowid }
})

ipcMain.handle('fcm:profile:update', (_e, id: number, data: Record<string, unknown>) => {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
  db().prepare(`UPDATE TFCMProfile SET ${fields} WHERE id = ?`).run(...Object.values(data), id)
  return { ok: true }
})

ipcMain.handle('fcm:profile:delete', (_e, id: number) => {
  db().prepare('DELETE FROM TFCMProfile WHERE id = ?').run(id)
  return { ok: true }
})

// ── Buttons ──────────────────────────────────────────────────────────────────

ipcMain.handle('fcm:btn:getForms', () => FCM_FORMS)

ipcMain.handle('fcm:btn:getAll', (_e, formName: string, profileName: string) =>
  db()
    .prepare('SELECT * FROM TFCMBtn WHERE form_name = ? AND profile_name = ? ORDER BY nr')
    .all(formName, profileName)
)

ipcMain.handle('fcm:btn:create', (_e, data: Record<string, unknown>) => {
  const keys = Object.keys(data)
  const result = db()
    .prepare(`INSERT INTO TFCMBtn (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
    .run(...Object.values(data))
  return { id: result.lastInsertRowid }
})

ipcMain.handle('fcm:btn:update', (_e, id: number, data: Record<string, unknown>) => {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
  db().prepare(`UPDATE TFCMBtn SET ${fields} WHERE id = ?`).run(...Object.values(data), id)
  return { ok: true }
})

ipcMain.handle('fcm:btn:delete', (_e, id: number) => {
  db().prepare('DELETE FROM TFCMBtn WHERE id = ?').run(id)
  return { ok: true }
})

// ── Hilfe ─────────────────────────────────────────────────────────────────────

ipcMain.handle('fcm:help:open', (_e, filename: string) => {
  shell.openPath(helpPath(filename))
  return { ok: true }
})

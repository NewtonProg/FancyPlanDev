import { ipcMain } from 'electron'
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto'
import { getDb } from '../db/database'

let sessionKey: Buffer | null = null

const SENTINEL = 'FancyPlan-MyData-v1'

function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM TSettings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO TSettings (key, value) VALUES (?, ?)').run(key, value)
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, 100_000, 32, 'sha256')
}

function encrypt(key: Buffer, plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

function decrypt(key: Buffer, encoded: string): string {
  const parts = encoded.split(':')
  if (parts.length !== 3) throw new Error('invalid format')
  const iv  = Buffer.from(parts[0], 'hex')
  const tag = Buffer.from(parts[1], 'hex')
  const enc = Buffer.from(parts[2], 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(enc).toString('utf-8') + decipher.final('utf-8')
}

// ── Setup / Unlock / Lock ──────────────────────────────────────────────────

ipcMain.handle('mydata:isSetup', () => !!getSetting('mydata_salt'))

ipcMain.handle('mydata:setup', (_e, password: string) => {
  const salt = randomBytes(32)
  setSetting('mydata_salt', salt.toString('hex'))
  const key = deriveKey(password, salt)
  setSetting('mydata_sentinel', encrypt(key, SENTINEL))
  sessionKey = key
  return { ok: true }
})

ipcMain.handle('mydata:unlock', (_e, password: string) => {
  const saltHex     = getSetting('mydata_salt')
  const sentinelEnc = getSetting('mydata_sentinel')
  if (!saltHex || !sentinelEnc) return { ok: false, error: 'not_setup' }
  try {
    const key = deriveKey(password, Buffer.from(saltHex, 'hex'))
    if (decrypt(key, sentinelEnc) !== SENTINEL) return { ok: false, error: 'wrong_password' }
    sessionKey = key
    return { ok: true }
  } catch {
    return { ok: false, error: 'wrong_password' }
  }
})

ipcMain.handle('mydata:lock',       () => { sessionKey = null; return { ok: true } })
ipcMain.handle('mydata:isUnlocked', () => !!sessionKey)

// ── CRUD ───────────────────────────────────────────────────────────────────

ipcMain.handle('mydata:getAll', () => {
  if (!sessionKey) return { ok: false, error: 'locked' }
  const rows = getDb()
    .prepare('SELECT * FROM TMyData ORDER BY category, sort_order, label')
    .all() as Record<string, unknown>[]
  return {
    ok: true,
    rows: rows.map((r) => {
      let fields: Record<string, string> = {}
      if (r.value_enc) {
        try { fields = JSON.parse(decrypt(sessionKey!, String(r.value_enc))) } catch { /* corrupt */ }
      }
      return { id: r.id, category: r.category, label: r.label, sort_order: r.sort_order,
               created_at: r.created_at, updated_at: r.updated_at, fields }
    })
  }
})

ipcMain.handle('mydata:create', (_e, data: { category: string; label: string; fields: Record<string, string> }) => {
  if (!sessionKey) return { ok: false, error: 'locked' }
  const value_enc = encrypt(sessionKey, JSON.stringify(data.fields))
  const r = getDb()
    .prepare('INSERT INTO TMyData (category, label, value_enc, sort_order) VALUES (?, ?, ?, 0)')
    .run(data.category, data.label, value_enc)
  return { ok: true, id: r.lastInsertRowid }
})

ipcMain.handle('mydata:update', (_e, id: number, data: { label?: string; category?: string; fields?: Record<string, string> }) => {
  if (!sessionKey) return { ok: false, error: 'locked' }
  const sets: string[] = ['updated_at = CURRENT_TIMESTAMP']
  const vals: unknown[] = []
  if (data.label    !== undefined) { sets.push('label = ?');    vals.push(data.label) }
  if (data.category !== undefined) { sets.push('category = ?'); vals.push(data.category) }
  if (data.fields   !== undefined) {
    sets.push('value_enc = ?')
    vals.push(encrypt(sessionKey, JSON.stringify(data.fields)))
  }
  vals.push(id)
  getDb().prepare(`UPDATE TMyData SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return { ok: true }
})

ipcMain.handle('mydata:delete', (_e, id: number) => {
  getDb().prepare('DELETE FROM TMyData WHERE id = ?').run(id)
  return { ok: true }
})

ipcMain.handle('mydata:reset', () => {
  sessionKey = null
  getDb().prepare('DELETE FROM TMyData').run()
  getDb().prepare("DELETE FROM TSettings WHERE key IN ('mydata_salt', 'mydata_sentinel')").run()
  return { ok: true }
})

ipcMain.handle('mydata:changePassword', (_e, oldPwd: string, newPwd: string) => {
  const saltHex     = getSetting('mydata_salt')
  const sentinelEnc = getSetting('mydata_sentinel')
  if (!saltHex || !sentinelEnc) return { ok: false, error: 'not_setup' }
  try {
    const oldKey = deriveKey(oldPwd, Buffer.from(saltHex, 'hex'))
    if (decrypt(oldKey, sentinelEnc) !== SENTINEL) return { ok: false, error: 'wrong_password' }

    const newSalt = randomBytes(32)
    const newKey  = deriveKey(newPwd, newSalt)

    const rows = getDb().prepare('SELECT id, value_enc FROM TMyData').all() as { id: number; value_enc: string }[]
    const update = getDb().prepare('UPDATE TMyData SET value_enc = ? WHERE id = ?')
    const tx = getDb().transaction(() => {
      for (const r of rows) {
        if (!r.value_enc) continue
        const plain = decrypt(oldKey, r.value_enc)
        update.run(encrypt(newKey, plain), r.id)
      }
    })
    tx()

    setSetting('mydata_salt', newSalt.toString('hex'))
    setSetting('mydata_sentinel', encrypt(newKey, SENTINEL))
    sessionKey = newKey
    return { ok: true }
  } catch {
    return { ok: false, error: 'wrong_password' }
  }
})

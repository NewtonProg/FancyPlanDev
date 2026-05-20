import { ipcMain, dialog } from 'electron'
import { writeFileSync, readFileSync } from 'fs'
import { getDb } from '../db/database'

const EXPORT_TABLES = [
  'TArea', 'TTheme', 'TCat', 'TAreaTheme',
  'TPrio1', 'TPrio2', 'TPrio3',
  'TStatus', 'TLand', 'TGroupValues',
  'TKostenstelle', 'TAuftrag', 'TProjekt',
  'TFCMStatus',
  'TTel', 'TTelEmail', 'TTelWeb',
  'TTree',
  'TLinks',
  'TPlanVariant', 'TPlanVariantItem',
  'TAct', 'TActTel',
  'TTermin', 'TRecurring'
]

ipcMain.handle('json:export', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: `FancyPlan_Export_${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePath) return { canceled: true }

  try {
    const db = getDb()
    const tables: Record<string, unknown[]> = {}
    for (const t of EXPORT_TABLES) {
      try {
        tables[t] = db.prepare(`SELECT * FROM ${t}`).all()
      } catch {
        tables[t] = []
      }
    }
    const payload = { version: 1, exported_at: new Date().toISOString(), tables }
    writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
    const total = Object.values(tables).reduce((s, r) => s + r.length, 0)
    return { ok: true, path: filePath, total }
  } catch (err) {
    return { error: String(err) }
  }
})

ipcMain.handle('json:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (canceled || !filePaths[0]) return { canceled: true }

  try {
    const raw = readFileSync(filePaths[0], 'utf8')
    const payload = JSON.parse(raw)
    if (payload.version !== 1 || !payload.tables) {
      return { error: 'Ungültiges FancyPlan-JSON-Format' }
    }

    const db = getDb()
    const counts: Record<string, number> = {}

    db.transaction(() => {
      for (const t of EXPORT_TABLES) {
        const rows: Record<string, unknown>[] = payload.tables[t] ?? []
        if (rows.length === 0) continue
        const cols = Object.keys(rows[0])
        const stmt = db.prepare(
          `INSERT OR REPLACE INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
        )
        for (const row of rows) {
          stmt.run(cols.map((c) => row[c]))
        }
        counts[t] = rows.length
      }
    })()

    return { ok: true, counts }
  } catch (err) {
    return { error: String(err) }
  }
})

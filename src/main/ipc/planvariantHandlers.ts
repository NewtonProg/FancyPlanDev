import { ipcMain } from 'electron'
import { dbAll, dbGet, dbRun } from '../db/database'

ipcMain.handle('db:planvariant:getAll', () =>
  dbAll('SELECT * FROM TPlanVariant ORDER BY created_at DESC')
)

ipcMain.handle('db:planvariant:save', (_event, name: string, actIds: number[]) => {
  const result = dbRun('INSERT INTO TPlanVariant (name) VALUES (?)', [name])
  const variantId = result.lastInsertRowid as number
  const insert = dbRun
  for (const id of actIds) {
    insert('INSERT INTO TPlanVariantItem (IDPlanVariant, IDTAct) VALUES (?, ?)', [variantId, id])
  }
  return { id: variantId, count: actIds.length }
})

ipcMain.handle('db:planvariant:load', (_event, variantId: number) => {
  const items = dbAll(
    'SELECT IDTAct FROM TPlanVariantItem WHERE IDPlanVariant = ?',
    [variantId]
  ) as { IDTAct: number }[]

  const ids = items.map((r) => r.IDTAct)
  if (ids.length === 0) return { loaded: 0 }

  const placeholders = ids.map(() => '?').join(', ')
  dbRun(`UPDATE TAct SET SToday = 1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`, ids)
  return { loaded: ids.length, actIds: ids }
})

ipcMain.handle('db:planvariant:delete', (_event, variantId: number) => {
  dbRun('DELETE FROM TPlanVariantItem WHERE IDPlanVariant = ?', [variantId])
  dbRun('DELETE FROM TPlanVariant WHERE id = ?', [variantId])
  return { ok: true }
})

ipcMain.handle('db:planvariant:getItems', (_event, variantId: number) =>
  dbAll(
    `SELECT pvi.IDTAct, a.Title, a.AreaName
     FROM TPlanVariantItem pvi
     JOIN TAct a ON a.id = pvi.IDTAct
     WHERE pvi.IDPlanVariant = ?`,
    [variantId]
  )
)

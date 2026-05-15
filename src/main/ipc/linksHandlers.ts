import { ipcMain, shell } from 'electron'
import { dbAll, dbRun } from '../db/database'

ipcMain.handle('db:links:getByEntity', (_e, entityType: string, entityId: number) =>
  dbAll(
    'SELECT * FROM TLinks WHERE entity_type = ? AND entity_id = ? ORDER BY seq ASC, id ASC',
    [entityType, entityId]
  )
)

ipcMain.handle('db:links:create', (_e, data: Record<string, unknown>) => {
  const { entity_type, entity_id, link_type, url, label } = data
  const maxSeq = (dbAll(
    'SELECT MAX(seq) as m FROM TLinks WHERE entity_type = ? AND entity_id = ?',
    [entity_type, entity_id]
  ) as { m: number | null }[])[0]?.m ?? -1
  const result = dbRun(
    'INSERT INTO TLinks (entity_type, entity_id, link_type, url, label, seq) VALUES (?, ?, ?, ?, ?, ?)',
    [entity_type, entity_id, link_type ?? 'web', url, label ?? null, maxSeq + 1]
  )
  return { id: result.lastInsertRowid }
})

ipcMain.handle('db:links:update', (_e, id: number, data: Record<string, unknown>) => {
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
  dbRun(`UPDATE TLinks SET ${fields} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})

ipcMain.handle('db:links:delete', (_e, id: number) => {
  dbRun('DELETE FROM TLinks WHERE id = ?', [id])
  return { ok: true }
})

ipcMain.handle('db:links:open', (_e, url: string, linkType: string) => {
  if (linkType === 'file' || linkType === 'network') {
    shell.openPath(url)
  } else if (linkType === 'mail') {
    shell.openExternal(`mailto:${url}`)
  } else {
    shell.openExternal(url)
  }
  return { ok: true }
})

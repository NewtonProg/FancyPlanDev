import { ipcMain } from 'electron'
import { dbAll, dbGet, dbRun } from '../db/database'

type TreeRow = { id: number; IDParent: number | null; name: string; level: number; seq: number; path: string; IDTreeRef: number | null }

// ── Alle Knoten laden ──────────────────────────────────────────────────────

ipcMain.handle('db:tree:getAll', () =>
  dbAll('SELECT * FROM TTree ORDER BY level ASC, seq ASC, name ASC')
)

// ── Knoten erstellen ───────────────────────────────────────────────────────

ipcMain.handle('db:tree:create', (_event, parentId: number | null, name: string) => {
  const parent = parentId ? dbGet('SELECT * FROM TTree WHERE id = ?', [parentId]) as TreeRow | undefined : undefined
  const level = parent ? parent.level + 1 : 0
  const siblings = dbAll(
    'SELECT MAX(seq) as maxSeq FROM TTree WHERE IDParent IS ?',
    [parentId ?? null]
  ) as { maxSeq: number | null }[]
  const seq = (siblings[0]?.maxSeq ?? -1) + 1

  const result = dbRun(
    'INSERT INTO TTree (IDParent, name, level, seq, path) VALUES (?, ?, ?, ?, ?)',
    [parentId ?? null, name, level, seq, '']
  )
  const newId = result.lastInsertRowid as number
  const parentPath = parent ? parent.path : ''
  const path = `${parentPath}/${newId}`
  dbRun('UPDATE TTree SET path = ? WHERE id = ?', [path, newId])
  return { id: newId, path }
})

// ── Knoten umbenennen ──────────────────────────────────────────────────────

ipcMain.handle('db:tree:rename', (_event, id: number, name: string) => {
  dbRun('UPDATE TTree SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, id])
  return { ok: true }
})

// ── Knoten löschen (inkl. Descendants) ────────────────────────────────────

ipcMain.handle('db:tree:delete', (_event, id: number) => {
  const node = dbGet('SELECT path FROM TTree WHERE id = ?', [id]) as TreeRow | undefined
  if (!node) return { ok: false }
  // Alle Descendants via path-Präfix löschen
  dbRun('DELETE FROM TTree WHERE path = ? OR path LIKE ?', [node.path, `${node.path}/%`])
  return { ok: true }
})

// ── Knoten verschieben ─────────────────────────────────────────────────────

ipcMain.handle('db:tree:move', (_event, id: number, newParentId: number | null) => {
  const node = dbGet('SELECT * FROM TTree WHERE id = ?', [id]) as TreeRow | undefined
  if (!node) return { ok: false }

  // Zirkuläre Verschiebung verhindern
  if (newParentId) {
    const target = dbGet('SELECT path FROM TTree WHERE id = ?', [newParentId]) as TreeRow | undefined
    if (target && target.path.startsWith(node.path)) return { ok: false, error: 'circular' }
  }

  const newParent = newParentId ? dbGet('SELECT * FROM TTree WHERE id = ?', [newParentId]) as TreeRow | undefined : undefined
  const newLevel = newParent ? newParent.level + 1 : 0
  const newParentPath = newParent ? newParent.path : ''
  const newPath = `${newParentPath}/${id}`
  const levelDiff = newLevel - node.level

  // Alle Descendants aktualisieren
  const descendants = dbAll('SELECT * FROM TTree WHERE path LIKE ?', [`${node.path}/%`]) as TreeRow[]
  for (const d of descendants) {
    const updatedPath = newPath + d.path.slice(node.path.length)
    dbRun('UPDATE TTree SET path = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedPath, d.level + levelDiff, d.id])
  }

  const siblings = dbAll('SELECT MAX(seq) as maxSeq FROM TTree WHERE IDParent IS ?', [newParentId ?? null]) as { maxSeq: number | null }[]
  const newSeq = (siblings[0]?.maxSeq ?? -1) + 1

  dbRun('UPDATE TTree SET IDParent = ?, level = ?, seq = ?, path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newParentId ?? null, newLevel, newSeq, newPath, id])
  return { ok: true }
})

// ── Cross-Tree-Referenz setzen ─────────────────────────────────────────────

ipcMain.handle('db:tree:setRef', (_event, id: number, refId: number | null) => {
  dbRun('UPDATE TTree SET IDTreeRef = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [refId, id])
  return { ok: true }
})

// ── Aktivitäten eines Knotens (via PSPName) ────────────────────────────────

ipcMain.handle('db:tree:getActivities', (_event, nodeName: string) =>
  dbAll(
    `SELECT id, Title, AreaName, ThemeName, Status, Prio1, Pl1Beg, Pl1End, Pl2Beg, Pl2End, Sdone, SinWork
     FROM TAct WHERE PSPName = ? AND Sdel = 0 ORDER BY COALESCE(Prio1, 9999) ASC, Pl1Beg ASC`,
    [nodeName]
  )
)

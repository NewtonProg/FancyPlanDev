import { ipcMain } from 'electron'
import { dbAll, dbGet, dbRun, getDb } from '../db/database'

type Row = Record<string, unknown>

// ── TAct ───────────────────────────────────────────────────────────────────

ipcMain.handle('db:act:getAll', (_event, filter: Partial<Row> = {}) => {
  let sql = 'SELECT * FROM TAct WHERE Sdel = 0'
  const params: unknown[] = []

  if (filter.AreaName) { sql += ' AND AreaName = ?'; params.push(filter.AreaName) }
  if (filter.ThemeName) { sql += ' AND ThemeName = ?'; params.push(filter.ThemeName) }
  if (filter.Status)   { sql += ' AND Status = ?';    params.push(filter.Status)    }
  if (filter.search) {
    const like = `%${filter.search}%`
    sql += ' AND (Title LIKE ? OR ThemeName LIKE ? OR AreaName LIKE ? OR Com LIKE ?)'
    params.push(like, like, like, like)
  }
  if (filter.SToday !== undefined) {
    if (filter.SToday === 1) {
      const d = filter.forDate ? `'${String(filter.forDate)}'` : `date('now')`
      sql += ` AND (SToday = 1 OR (Pl1Beg IS NOT NULL AND Pl1End IS NOT NULL AND date(Pl1Beg) <= ${d} AND date(Pl1End) >= ${d}))`
      sql += ` AND (ToDayShifted IS NULL OR date(ToDayShifted) != ${d})`
    } else {
      sql += ' AND SToday = ?'; params.push(filter.SToday)
    }
  }

  if (filter.Sdone !== undefined)  { sql += ' AND Sdone = ?';  params.push(filter.Sdone)  }
  if (filter.planFrom && filter.planTo) {
    sql += ' AND Pl1Beg IS NOT NULL AND Pl1End IS NOT NULL AND date(Pl1Beg) <= date(?) AND date(Pl1End) >= date(?)'
    params.push(filter.planTo, filter.planFrom)
  } else if (filter.planFrom) {
    sql += ' AND date(Pl1End) >= date(?)'; params.push(filter.planFrom)
  } else if (filter.planTo) {
    sql += ' AND date(Pl1End) <= date(?)'; params.push(filter.planTo)
  }
  if (filter.doneFrom) { sql += ' AND date(TodayDone) >= date(?)';    params.push(filter.doneFrom) }
  if (filter.doneTo)   { sql += ' AND date(TodayDone) <= date(?)';    params.push(filter.doneTo)   }
  if (filter.svFrom)   { sql += ' AND date(ToDayShifted) >= date(?)'; params.push(filter.svFrom)   }
  if (filter.svTo)     { sql += ' AND date(ToDayShifted) <= date(?)'; params.push(filter.svTo)     }
  if (filter.editedFrom || filter.editedTo) {
    sql += ' AND TodayEdited IS NOT NULL'
    if (filter.editedFrom) { sql += ' AND date(TodayEdited) >= date(?)'; params.push(filter.editedFrom) }
    if (filter.editedTo)   { sql += ' AND date(TodayEdited) <= date(?)'; params.push(filter.editedTo)   }
  }

  if (filter.sortByPrio) {
    sql += ' ORDER BY COALESCE(Prio1, 9999) ASC, COALESCE(Prio2, 9999) ASC, date(Pl1Beg) ASC'
  } else {
    sql += ' ORDER BY ActBeg ASC, Prio1 ASC'
  }
  return dbAll(sql, params)
})

ipcMain.handle('db:act:getById', (_event, id: number) =>
  dbGet('SELECT * FROM TAct WHERE id = ?', [id])
)

ipcMain.handle('db:act:create', (_event, data: Row) => {
  type ColInfo = { name: string; notnull: number; dflt_value: string | null }
  const colInfos = getDb().prepare('PRAGMA table_info(TAct)').all() as ColInfo[]
  const merged: Row = { ...data }
  for (const ci of colInfos) {
    if (ci.notnull && ci.dflt_value === null && !(ci.name in merged) && ci.name !== 'id') {
      merged[ci.name] = ''
    }
  }
  const cols = Object.keys(merged)
  const placeholders = cols.map(() => '?').join(', ')
  const sql = `INSERT INTO TAct (${cols.join(', ')}, dateCreated) VALUES (${placeholders}, CURRENT_TIMESTAMP)`
  const result = dbRun(sql, Object.values(merged))
  return { id: Number(result.lastInsertRowid) }
})

ipcMain.handle('db:act:update', (_event, id: number, data: Row) => {
  type ColInfo = { name: string }
  const validCols = new Set(
    (getDb().prepare('PRAGMA table_info(TAct)').all() as ColInfo[]).map((c) => c.name)
  )
  const filtered: Row = Object.fromEntries(
    Object.entries(data).filter(([k]) => validCols.has(k))
  )
  // Detail-Protokoll: wenn SDetailStat=1, Änderungen loggen
  const current = dbGet('SELECT * FROM TAct WHERE id = ?', [id]) as Row | undefined
  if (current && Number(current.SDetailStat) === 1) {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    for (const [field, newVal] of Object.entries(filtered)) {
      const oldVal = current[field]
      if (String(oldVal ?? '') !== String(newVal ?? '')) {
        dbRun(
          'INSERT INTO TAct_Log (IDTAct, changed_at, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
          [id, now, field, String(oldVal ?? ''), String(newVal ?? '')]
        )
      }
    }
  }
  const sets = Object.keys(filtered).map((k) => `${k} = ?`).join(', ')
  const sql = `UPDATE TAct SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  dbRun(sql, [...Object.values(filtered), id])
  return { ok: true }
})

ipcMain.handle('db:act:delete', (_event, id: number) => {
  dbRun('UPDATE TAct SET Sdel = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id])
  return { ok: true }
})

// Zuletzt bearbeitete Aktivitäten (neueste zuerst), für die „Letzte"-Ansicht
ipcMain.handle('db:act:recent', (_event, limit = 20) => {
  return dbAll(
    'SELECT * FROM TAct WHERE Sdel = 0 ORDER BY updated_at DESC, id DESC LIMIT ?',
    [Number(limit) || 20]
  )
})

// ── TTel ───────────────────────────────────────────────────────────────────

ipcMain.handle('db:tel:getAll', (_event, search = '') => {
  const like = `%${search}%`
  return dbAll(
    `SELECT * FROM TTel
     WHERE (SurName LIKE ? OR FirstName LIKE ? OR Company LIKE ? OR EMail1 LIKE ?)
     ORDER BY SurName ASC`,
    [like, like, like, like]
  )
})

ipcMain.handle('db:tel:getById', (_event, id: number) =>
  dbGet('SELECT * FROM TTel WHERE id = ?', [id])
)

ipcMain.handle('db:tel:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const placeholders = cols.map(() => '?').join(', ')
  const sql = `INSERT INTO TTel (${cols.join(', ')}) VALUES (${placeholders})`
  const result = dbRun(sql, Object.values(data))
  return { id: result.lastInsertRowid }
})

ipcMain.handle('db:tel:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ')
  dbRun(`UPDATE TTel SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
    ...Object.values(data),
    id
  ])
  return { ok: true }
})

ipcMain.handle('db:tel:delete', (_event, id: number) => {
  dbRun('DELETE FROM TTel WHERE id = ?', [id])
  return { ok: true }
})

ipcMain.handle('db:tel:getLetters', () =>
  dbAll("SELECT DISTINCT upper(substr(Company,1,1)) AS letter FROM TTel WHERE Company IS NOT NULL AND Company != '' ORDER BY letter")
)

ipcMain.handle('db:tel:getCompaniesByLetter', (_event, letter: string) =>
  dbAll("SELECT DISTINCT Company FROM TTel WHERE upper(substr(Company,1,1)) = ? ORDER BY Company", [letter.toUpperCase()])
)

ipcMain.handle('db:tel:getByCompany', (_event, company: string) =>
  dbAll("SELECT * FROM TTel WHERE Company = ? ORDER BY SurName ASC, FirstName ASC", [company])
)

ipcMain.handle('db:tel:getByCat', (_event, cat: string) => {
  const cats = String(cat).split(';').map(c => c.trim()).filter(Boolean)
  if (cats.length === 0) return []
  const conditions = cats.map(() => 'Cat LIKE ?').join(' OR ')
  const params = cats.map(c => `%${c}%`)
  return dbAll(
    `SELECT id, SurName, FirstName, Company, EMail1, TelNr1, Mobile1, Cat
     FROM TTel WHERE (${conditions}) ORDER BY SurName ASC, FirstName ASC`,
    params
  )
})

ipcMain.handle('db:tel:getEmailsByCompany', (_event, company: string) =>
  dbAll("SELECT EMail1, EMail2, EMail3 FROM TTel WHERE Company = ? AND (EMail1 IS NOT NULL AND EMail1 != '' OR EMail2 IS NOT NULL AND EMail2 != '' OR EMail3 IS NOT NULL AND EMail3 != '')", [company])
)

// ── TActTel — Aktivität ↔ Kontakt (m:n) ───────────────────────────────────

ipcMain.handle('db:acttel:getByAct', (_event, actId: number) =>
  dbAll(
    `SELECT t.*, at.id as acttel_id, at.Com as acttel_Com FROM TTel t
     INNER JOIN TActTel at ON at.IDTTel = t.id
     WHERE at.IDTAct = ?
     ORDER BY t.SurName ASC, t.FirstName ASC`,
    [actId]
  )
)

ipcMain.handle('db:acttel:getByTel', (_event, telId: number) =>
  dbAll(
    `SELECT a.id, a.Title, a.Status, a.AreaName, a.ThemeName, a.Pl1End, a.Sdone
     FROM TAct a
     INNER JOIN TActTel at ON at.IDTAct = a.id
     WHERE at.IDTTel = ? AND a.Sdel = 0
     ORDER BY a.ActBeg DESC`,
    [telId]
  )
)

ipcMain.handle('db:acttel:add', (_event, actId: number, telId: number) => {
  dbRun('INSERT OR IGNORE INTO TActTel (IDTAct, IDTTel) VALUES (?, ?)', [actId, telId])
  return { ok: true }
})

ipcMain.handle('db:acttel:remove', (_event, actId: number, telId: number) => {
  dbRun('DELETE FROM TActTel WHERE IDTAct = ? AND IDTTel = ?', [actId, telId])
  return { ok: true }
})

ipcMain.handle('db:acttel:updateCom', (_event, acttelId: number, com: string) => {
  dbRun('UPDATE TActTel SET Com = ? WHERE id = ?', [com, acttelId])
  return { ok: true }
})

// ── Reference tables ───────────────────────────────────────────────────────

ipcMain.handle('db:area:getAll', () =>
  dbAll('SELECT * FROM TArea ORDER BY seq1 ASC, AreaName ASC')
)
ipcMain.handle('db:area:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TArea (${cols.join(', ')}, created_at) VALUES (${cols.map(() => '?').join(', ')}, CURRENT_TIMESTAMP)`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:area:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  dbRun(`UPDATE TArea SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})
ipcMain.handle('db:area:delete', (_event, id: number) => {
  dbRun('DELETE FROM TArea WHERE id = ?', [id])
  return { ok: true }
})

ipcMain.handle('db:theme:getAll', () =>
  dbAll('SELECT t.*, a.AreaName AS _AreaName FROM TTheme t LEFT JOIN TArea a ON a.id = t.IDArea ORDER BY t.ThemeName ASC')
)
ipcMain.handle('db:theme:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TTheme (${cols.join(', ')}, created_at) VALUES (${cols.map(() => '?').join(', ')}, CURRENT_TIMESTAMP)`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:theme:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  dbRun(`UPDATE TTheme SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})
ipcMain.handle('db:theme:delete', (_event, id: number) => {
  dbRun('DELETE FROM TTheme WHERE id = ?', [id])
  return { ok: true }
})

ipcMain.handle('db:areatheme:getAll', () =>
  dbAll('SELECT at.id, at.IDArea, at.IDTheme, a.AreaName, t.ThemeName FROM TAreaTheme at LEFT JOIN TArea a ON a.id = at.IDArea LEFT JOIN TTheme t ON t.id = at.IDTheme ORDER BY a.AreaName, t.ThemeName')
)
ipcMain.handle('db:areatheme:create', (_event, idArea: number, idTheme: number) => {
  const r = dbRun('INSERT OR IGNORE INTO TAreaTheme (IDArea, IDTheme) VALUES (?, ?)', [idArea, idTheme])
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:areatheme:delete', (_event, id: number) => {
  dbRun('DELETE FROM TAreaTheme WHERE id = ?', [id])
  return { ok: true }
})

ipcMain.handle('db:cat:getAll', (_event, formName?: string) => {
  if (formName) return dbAll("SELECT * FROM TCat WHERE IDFormName = ? OR IDFormName = '*' OR IDFormName = '' OR IDFormName IS NULL ORDER BY Cat ASC", [formName])
  return dbAll('SELECT * FROM TCat ORDER BY Cat ASC')
})
ipcMain.handle('db:cat:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TCat (${cols.join(', ')}, CatCreated) VALUES (${cols.map(() => '?').join(', ')}, CURRENT_TIMESTAMP)`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:cat:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  dbRun(`UPDATE TCat SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})
ipcMain.handle('db:cat:delete', (_event, id: number) => {
  dbRun('DELETE FROM TCat WHERE id = ?', [id])
  return { ok: true }
})

ipcMain.handle('db:prio:getAll', (_event, level: 1 | 2 | 3 = 1, formName?: string) => {
  const table = `TPrio${level}`
  const col = `Prio${level}`
  if (formName) {
    return dbAll(
      `SELECT * FROM ${table} WHERE IDFormName = ?
       UNION ALL
       SELECT * FROM ${table} WHERE (IDFormName IS NULL OR IDFormName = '' OR IDFormName = '*')
         AND NOT EXISTS (SELECT 1 FROM ${table} WHERE IDFormName = ?)
       ORDER BY ${col} ASC`,
      [formName, formName]
    )
  }
  return dbAll(`SELECT * FROM ${table} ORDER BY ${col} ASC`)
})
ipcMain.handle('db:prio:create', (_event, level: 1 | 2 | 3, data: Row) => {
  const table = `TPrio${level}`
  const cols = Object.keys(data)
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:prio:update', (_event, level: 1 | 2 | 3, id: number, data: Row) => {
  const table = `TPrio${level}`
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  dbRun(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})
ipcMain.handle('db:prio:delete', (_event, level: 1 | 2 | 3, id: number) => {
  dbRun(`DELETE FROM TPrio${level} WHERE id = ?`, [id])
  return { ok: true }
})

ipcMain.handle('db:status:getAll', (_event, formName?: string) => {
  if (formName) return dbAll(
    "SELECT * FROM TStatus WHERE (IDFormName = ? OR IDFormName = '*' OR IDFormName = '' OR IDFormName IS NULL) AND binArchiv = 0 ORDER BY seq ASC, Status ASC",
    [formName]
  )
  return dbAll('SELECT * FROM TStatus WHERE binArchiv = 0 ORDER BY IDFormName ASC, seq ASC, Status ASC')
})
ipcMain.handle('db:status:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TStatus (${cols.join(', ')}, created_at) VALUES (${cols.map(() => '?').join(', ')}, CURRENT_TIMESTAMP)`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:status:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  dbRun(`UPDATE TStatus SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})
ipcMain.handle('db:status:delete', (_event, id: number) => {
  dbRun('DELETE FROM TStatus WHERE id = ?', [id])
  return { ok: true }
})

ipcMain.handle('db:land:getAll', () =>
  dbAll('SELECT * FROM TLand ORDER BY seq ASC, LandName ASC')
)
ipcMain.handle('db:land:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TLand (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:land:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  dbRun(`UPDATE TLand SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})
ipcMain.handle('db:land:delete', (_event, id: number) => {
  dbRun('DELETE FROM TLand WHERE id = ?', [id])
  return { ok: true }
})

ipcMain.handle('db:groupval:getAll', (_event, groupNr: number, formName?: string) => {
  if (formName && formName !== '*') {
    return dbAll(
      "SELECT * FROM TGroupValues WHERE group_nr = ? AND (IDFormName = ? OR IDFormName = '*' OR IDFormName = '' OR IDFormName IS NULL) ORDER BY seq ASC, grp_value ASC",
      [groupNr, formName]
    )
  }
  return dbAll('SELECT * FROM TGroupValues WHERE group_nr = ? ORDER BY seq ASC, grp_value ASC', [groupNr])
})
ipcMain.handle('db:groupval:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TGroupValues (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:groupval:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  dbRun(`UPDATE TGroupValues SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})
ipcMain.handle('db:groupval:delete', (_event, id: number) => {
  dbRun('DELETE FROM TGroupValues WHERE id = ?', [id])
  return { ok: true }
})

// ── TFCMStatus ─────────────────────────────────────────────────────────────

ipcMain.handle('db:fcmstatus:getAll', () =>
  dbAll('SELECT * FROM TFCMStatus ORDER BY SortNr ASC, Status ASC')
)
ipcMain.handle('db:fcmstatus:getByStatus', (_event, status: string) =>
  dbGet('SELECT * FROM TFCMStatus WHERE Status = ? LIMIT 1', [status])
)
ipcMain.handle('db:fcmstatus:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TFCMStatus (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})
ipcMain.handle('db:fcmstatus:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  dbRun(`UPDATE TFCMStatus SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})
ipcMain.handle('db:fcmstatus:delete', (_event, id: number) => {
  dbRun('DELETE FROM TFCMStatus WHERE id = ?', [id])
  return { ok: true }
})

// ── Kontierungsobjekte ─────────────────────────────────────────────────────

;(['kostenstelle', 'auftrag', 'projekt'] as const).forEach(entity => {
  const table  = entity === 'kostenstelle' ? 'TKostenstelle' : entity === 'auftrag' ? 'TAuftrag' : 'TProjekt'
  const nameCol = entity === 'kostenstelle' ? 'KSName' : entity === 'auftrag' ? 'AuftragName' : 'ProjektName'
  ipcMain.handle(`db:${entity}:getAll`, () =>
    dbAll(`SELECT * FROM ${table} ORDER BY seq ASC, ${nameCol} ASC`)
  )
  ipcMain.handle(`db:${entity}:create`, (_event, data: Row) => {
    const cols = Object.keys(data)
    const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    const r = dbRun(sql, Object.values(data))
    return { id: r.lastInsertRowid }
  })
  ipcMain.handle(`db:${entity}:update`, (_event, id: number, data: Row) => {
    const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
    dbRun(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...Object.values(data), id])
    return { ok: true }
  })
  ipcMain.handle(`db:${entity}:delete`, (_event, id: number) => {
    dbRun(`DELETE FROM ${table} WHERE id = ?`, [id])
    return { ok: true }
  })
})

// ── TTelEmail — E-Mail-Adressen (1:n) ─────────────────────────────────────

ipcMain.handle('db:ttelmail:getByTel', (_event, telId: number) =>
  dbAll('SELECT * FROM TTelEmail WHERE tel_id = ? ORDER BY sort_order ASC, id ASC', [telId])
)

ipcMain.handle('db:ttelmail:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TTelEmail (${cols.join(', ')}, created_at) VALUES (${cols.map(() => '?').join(', ')}, CURRENT_TIMESTAMP)`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})

ipcMain.handle('db:ttelmail:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ')
  dbRun(`UPDATE TTelEmail SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})

ipcMain.handle('db:ttelmail:delete', (_event, id: number) => {
  dbRun('DELETE FROM TTelEmail WHERE id = ?', [id])
  return { ok: true }
})

// ── TTelWeb — Web-Adressen (1:n) ──────────────────────────────────────────

ipcMain.handle('db:ttelweb:getByTel', (_event, telId: number) =>
  dbAll('SELECT * FROM TTelWeb WHERE tel_id = ? ORDER BY sort_order ASC, id ASC', [telId])
)

ipcMain.handle('db:ttelweb:create', (_event, data: Row) => {
  const cols = Object.keys(data)
  const sql = `INSERT INTO TTelWeb (${cols.join(', ')}, created_at) VALUES (${cols.map(() => '?').join(', ')}, CURRENT_TIMESTAMP)`
  const r = dbRun(sql, Object.values(data))
  return { id: r.lastInsertRowid }
})

ipcMain.handle('db:ttelweb:update', (_event, id: number, data: Row) => {
  const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ')
  dbRun(`UPDATE TTelWeb SET ${sets} WHERE id = ?`, [...Object.values(data), id])
  return { ok: true }
})

ipcMain.handle('db:ttelweb:delete', (_event, id: number) => {
  dbRun('DELETE FROM TTelWeb WHERE id = ?', [id])
  return { ok: true }
})

// ── TAct_Log ───────────────────────────────────────────────────────────────

ipcMain.handle('db:actlog:getByAct', (_event, idTAct: number) =>
  dbAll('SELECT * FROM TAct_Log WHERE IDTAct = ? ORDER BY changed_at DESC', [idTAct])
)

ipcMain.handle('db:actlog:deleteByAct', (_event, idTAct: number) => {
  dbRun('DELETE FROM TAct_Log WHERE IDTAct = ?', [idTAct])
  return { ok: true }
})

ipcMain.handle('db:actlog:deleteAll', () => {
  dbRun('DELETE FROM TAct_Log')
  return { ok: true }
})

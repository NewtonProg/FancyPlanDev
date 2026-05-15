import { ipcMain } from 'electron'
import { getDb } from '../db/database'

ipcMain.handle('termin:getByDate', (_e, date: string) =>
  getDb().prepare('SELECT * FROM TTermin WHERE termin_date = ? ORDER BY time_start ASC').all(date)
)

ipcMain.handle('termin:getByAct', (_e, actId: number) =>
  getDb().prepare('SELECT * FROM TTermin WHERE act_id = ? ORDER BY termin_date ASC, time_start ASC').all(actId)
)

ipcMain.handle('termin:create', (_e, data: Record<string, unknown>) => {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO TTermin (act_id, title, termin_date, time_start, time_end, location, notes, source, cal_uid)
    VALUES (@act_id, @title, @termin_date, @time_start, @time_end, @location, @notes, @source, @cal_uid)
  `)
  const res = stmt.run({
    act_id: data.act_id ?? null,
    title: data.title ?? '',
    termin_date: data.termin_date,
    time_start: data.time_start ?? null,
    time_end: data.time_end ?? null,
    location: data.location ?? null,
    notes: data.notes ?? null,
    source: data.source ?? 'manual',
    cal_uid: data.cal_uid ?? null
  })
  return db.prepare('SELECT * FROM TTermin WHERE id = ?').get(res.lastInsertRowid)
})

ipcMain.handle('termin:update', (_e, id: number, data: Record<string, unknown>) => {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ')
  getDb().prepare(`UPDATE TTermin SET ${fields} WHERE id = @id`).run({ ...data, id })
  return true
})

ipcMain.handle('termin:delete', (_e, id: number) => {
  getDb().prepare('DELETE FROM TTermin WHERE id = ?').run(id)
  return true
})

ipcMain.handle('termin:upsertFromSync', (_e, data: Record<string, unknown>) => {
  getDb().prepare(`
    INSERT INTO TTermin (act_id, title, termin_date, time_start, time_end, location, notes, source, cal_uid)
    VALUES (@act_id, @title, @termin_date, @time_start, @time_end, @location, @notes, @source, @cal_uid)
    ON CONFLICT(cal_uid) DO UPDATE SET
      title=excluded.title, termin_date=excluded.termin_date,
      time_start=excluded.time_start, time_end=excluded.time_end,
      location=excluded.location, notes=excluded.notes, source=excluded.source
  `).run({
    act_id: null,
    title: data.title ?? '',
    termin_date: data.termin_date,
    time_start: data.time_start ?? null,
    time_end: data.time_end ?? null,
    location: data.location ?? null,
    notes: data.notes ?? null,
    source: data.source ?? 'caldav',
    cal_uid: data.cal_uid ?? null
  })
  return true
})

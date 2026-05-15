import { ipcMain } from 'electron'
import { getDb } from '../db/database'

function isDueOnDate(row: Record<string, unknown>, date: Date): boolean {
  const freq = String(row.freq ?? 'daily')
  const interval = Number(row.interval_val ?? 1) || 1

  if (freq === 'daily') {
    const epoch = Math.floor(date.getTime() / 86400000)
    return epoch % interval === 0
  }
  if (freq === 'weekly') {
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    const byday = String(row.byday ?? days[date.getDay()])
    return byday.split(',').map((d) => d.trim()).includes(days[date.getDay()])
  }
  if (freq === 'monthly') {
    return date.getDate() === Number(row.bymonthday)
  }
  if (freq === 'yearly') {
    return date.getDate() === Number(row.bymonthday) && (date.getMonth() + 1) === Number(row.bymonth)
  }
  return false
}

ipcMain.handle('recurring:getAll', () =>
  getDb().prepare('SELECT * FROM TRecurring ORDER BY title ASC').all()
)

ipcMain.handle('recurring:isDueToday', (_e, dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00')
  const rows = getDb().prepare('SELECT * FROM TRecurring WHERE active = 1').all() as Record<string, unknown>[]
  return rows.filter((r) => isDueOnDate(r, date))
})

ipcMain.handle('recurring:create', (_e, data: Record<string, unknown>) => {
  const db = getDb()
  const res = db.prepare(`
    INSERT INTO TRecurring (act_id, title, freq, interval_val, byday, bymonthday, bymonth, time_start, notes, active)
    VALUES (@act_id, @title, @freq, @interval_val, @byday, @bymonthday, @bymonth, @time_start, @notes, @active)
  `).run({
    act_id: data.act_id ?? null,
    title: data.title ?? '',
    freq: data.freq ?? 'daily',
    interval_val: data.interval_val ?? 1,
    byday: data.byday ?? null,
    bymonthday: data.bymonthday ?? null,
    bymonth: data.bymonth ?? null,
    time_start: data.time_start ?? null,
    notes: data.notes ?? null,
    active: data.active ?? 1
  })
  return db.prepare('SELECT * FROM TRecurring WHERE id = ?').get(res.lastInsertRowid)
})

ipcMain.handle('recurring:update', (_e, id: number, data: Record<string, unknown>) => {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ')
  getDb().prepare(`UPDATE TRecurring SET ${fields} WHERE id = @id`).run({ ...data, id })
  return true
})

ipcMain.handle('recurring:delete', (_e, id: number) => {
  getDb().prepare('DELETE FROM TRecurring WHERE id = ?').run(id)
  return true
})

import { ipcMain } from 'electron'
import { getDb } from '../db/database'
import { createDAVClient } from 'tsdav'
import ical from 'node-ical'
import { randomUUID as uuidv4 } from 'crypto'

function getSetting(key: string): string {
  const row = getDb().prepare('SELECT value FROM TSettings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? ''
}

function davClient() {
  return createDAVClient({
    serverUrl: getSetting('cal_caldav_url'),
    credentials: { username: getSetting('cal_user'), password: getSetting('cal_password') },
    authMethod: 'Basic',
    defaultAccountType: 'caldav'
  })
}

// Auth/config status
ipcMain.handle('cal:auth:status', () => {
  const url = getSetting('cal_caldav_url')
  const user = getSetting('cal_user')
  const pass = getSetting('cal_password')
  return { configured: !!(url && user && pass), user }
})

// Sync from CalDAV
ipcMain.handle('cal:sync', async () => {
  const url = getSetting('cal_caldav_url')
  const user = getSetting('cal_user')
  const pass = getSetting('cal_password')
  if (!url || !user || !pass) return { error: 'Nicht konfiguriert', count: 0 }

  const db = getDb()
  try {
    const client = await davClient()
    const calendars = await client.fetchCalendars()
    if (!calendars.length) return { error: 'Keine Kalender gefunden', count: 0 }

    const calName = getSetting('cal_calendar_name')
    const calendar = calName
      ? calendars.find((c) => (c.displayName ?? '').includes(calName)) ?? calendars[0]
      : calendars[0]

    const objects = await client.fetchCalendarObjects({ calendar })

    const upsert = db.prepare(`
      INSERT INTO TCalendar (cal_uid, cal_url, summary, description, location, dtstart, dtend, all_day, rrule, status, organizer, raw_ical)
      VALUES (@cal_uid, @cal_url, @summary, @description, @location, @dtstart, @dtend, @all_day, @rrule, @status, @organizer, @raw_ical)
      ON CONFLICT(cal_uid) DO UPDATE SET
        summary=excluded.summary, description=excluded.description, location=excluded.location,
        dtstart=excluded.dtstart, dtend=excluded.dtend, all_day=excluded.all_day,
        rrule=excluded.rrule, status=excluded.status, organizer=excluded.organizer,
        raw_ical=excluded.raw_ical, synced_at=CURRENT_TIMESTAMP
    `)

    let count = 0
    for (const obj of objects) {
      if (!obj.data) continue
      try {
        const parsed = ical.parseICS(obj.data)
        for (const [, comp] of Object.entries(parsed)) {
          if (comp.type !== 'VEVENT') continue
          const ev = comp as ical.VEvent
          const start = ev.start instanceof Date ? ev.start : new Date(String(ev.start))
          const end = ev.end instanceof Date ? ev.end : new Date(String(ev.end ?? ev.start))
          const allDay = !!(ev.start as unknown as { dateOnly?: boolean })?.dateOnly

          const calUid = String(ev.uid ?? obj.url ?? uuidv4())
          upsert.run({
            cal_uid: calUid,
            cal_url: obj.url ?? null,
            summary: String(ev.summary ?? ''),
            description: String(ev.description ?? ''),
            location: String(ev.location ?? ''),
            dtstart: start.toISOString(),
            dtend: end.toISOString(),
            all_day: allDay ? 1 : 0,
            rrule: ev.rrule ? JSON.stringify(ev.rrule) : null,
            status: String(ev.status ?? ''),
            organizer: typeof ev.organizer === 'string' ? ev.organizer : (ev.organizer as Record<string, unknown>)?.val as string ?? '',
            raw_ical: obj.data
          })
          if (!allDay) {
            const pad2 = (n: number): string => String(n).padStart(2, '0')
            db.prepare(`
              INSERT INTO TTermin (act_id, title, termin_date, time_start, time_end, location, notes, source, cal_uid)
              VALUES (NULL, @title, @termin_date, @time_start, @time_end, @location, @notes, 'caldav', @cal_uid)
              ON CONFLICT(cal_uid) DO UPDATE SET
                title=excluded.title, termin_date=excluded.termin_date,
                time_start=excluded.time_start, time_end=excluded.time_end,
                location=excluded.location, notes=excluded.notes
            `).run({
              title: String(ev.summary ?? ''),
              termin_date: start.toISOString().slice(0, 10),
              time_start: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
              time_end: `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
              location: String(ev.location ?? '') || null,
              notes: String(ev.description ?? '') || null,
              cal_uid: calUid
            })
          }
          count++
        }
      } catch { /* skip malformed */ }
    }
    return { count }
  } catch (err) {
    return { error: String(err), count: 0 }
  }
})

// List events from local DB (optional date range)
ipcMain.handle('cal:list', (_e, filter?: { from?: string; to?: string }) => {
  const db = getDb()
  let sql = 'SELECT id, cal_uid, summary, description, location, dtstart, dtend, all_day, status, source FROM TCalendar'
  const conds: string[] = []
  const params: string[] = []

  if (filter?.from) { conds.push('dtend >= ?'); params.push(filter.from) }
  if (filter?.to) { conds.push('dtstart <= ?'); params.push(filter.to) }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ')
  sql += ' ORDER BY dtstart ASC LIMIT 500'

  return db.prepare(sql).all(...params)
})

// Create event locally + push to CalDAV
ipcMain.handle('cal:create', async (_e, data: { summary: string; dtstart: string; dtend: string; description?: string; location?: string; allDay?: boolean }) => {
  const uid = uuidv4()
  const fmtDate = (iso: string, allDay: boolean): string => {
    const d = new Date(iso)
    if (allDay) return d.toISOString().slice(0, 10).replace(/-/g, '')
    return d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  }

  const allDay = !!data.allDay
  const rawIcal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FancyPlan//DE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${data.summary}`,
    allDay ? `DTSTART;VALUE=DATE:${fmtDate(data.dtstart, true)}` : `DTSTART:${fmtDate(data.dtstart, false)}`,
    allDay ? `DTEND;VALUE=DATE:${fmtDate(data.dtend, true)}` : `DTEND:${fmtDate(data.dtend, false)}`,
    data.description ? `DESCRIPTION:${data.description}` : null,
    data.location ? `LOCATION:${data.location}` : null,
    `DTSTAMP:${fmtDate(new Date().toISOString(), false)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  const db = getDb()
  db.prepare(`
    INSERT OR IGNORE INTO TCalendar (cal_uid, summary, description, location, dtstart, dtend, all_day, raw_ical)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uid, data.summary, data.description ?? '', data.location ?? '', data.dtstart, data.dtend, allDay ? 1 : 0, rawIcal)

  const url = getSetting('cal_caldav_url')
  const user = getSetting('cal_user')
  const pass = getSetting('cal_password')
  if (url && user && pass) {
    try {
      const client = await davClient()
      const calendars = await client.fetchCalendars()
      if (calendars.length) {
        const calName = getSetting('cal_calendar_name')
        const calendar = calName
          ? calendars.find((c) => (c.displayName ?? '').includes(calName)) ?? calendars[0]
          : calendars[0]
        await client.createCalendarObject({ calendar, filename: `${uid}.ics`, iCalString: rawIcal })
      }
    } catch { /* offline — stored locally */ }
  }

  return { ok: true, uid }
})

// Delete event locally + from CalDAV
ipcMain.handle('cal:delete', async (_e, id: number) => {
  const db = getDb()
  const row = db.prepare('SELECT cal_url FROM TCalendar WHERE id = ?').get(id) as { cal_url: string } | undefined
  db.prepare('DELETE FROM TCalendar WHERE id = ?').run(id)

  if (row?.cal_url) {
    const url = getSetting('cal_caldav_url')
    const user = getSetting('cal_user')
    const pass = getSetting('cal_password')
    if (url && user && pass) {
      try {
        const client = await davClient()
        await client.deleteCalendarObject({ calendarObject: { url: row.cal_url, etag: '' } })
      } catch {}
    }
  }
  return { ok: true }
})

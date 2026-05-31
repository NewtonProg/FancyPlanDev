import { ipcMain } from 'electron'
import { google } from 'googleapis'
import { getDb } from '../db/database'
import { buildAuthedClient, isGcalConfigured } from './gcalClient'

ipcMain.handle('termin:getByDate', (_e, date: string) =>
  getDb().prepare('SELECT * FROM TTermin WHERE termin_date = ? ORDER BY time_start ASC').all(date)
)

ipcMain.handle('termin:getByDateRange', (_e, from: string, to: string) =>
  getDb().prepare('SELECT * FROM TTermin WHERE termin_date BETWEEN ? AND ? ORDER BY termin_date ASC, time_start ASC').all(from, to)
)

ipcMain.handle('termin:getByAct', (_e, actId: number) =>
  getDb().prepare('SELECT * FROM TTermin WHERE act_id = ? ORDER BY termin_date ASC, time_start ASC').all(actId)
)

ipcMain.handle('termin:create', (_e, data: Record<string, unknown>) => {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO TTermin (act_id, title, termin_date, time_start, time_end, location, notes, meet_url, meet_comment, meet_key, meet_phone, cat, source, cal_uid, is_owner)
    VALUES (@act_id, @title, @termin_date, @time_start, @time_end, @location, @notes, @meet_url, @meet_comment, @meet_key, @meet_phone, @cat, @source, @cal_uid, @is_owner)
  `)
  const res = stmt.run({
    act_id: data.act_id ?? null,
    title: data.title ?? '',
    termin_date: data.termin_date,
    time_start: data.time_start ?? null,
    time_end: data.time_end ?? null,
    location: data.location ?? null,
    notes: data.notes ?? null,
    meet_url: data.meet_url ?? null,
    meet_comment: data.meet_comment ?? null,
    meet_key: data.meet_key ?? null,
    meet_phone: data.meet_phone ?? null,
    cat: data.cat ?? null,
    source: data.source ?? 'manual',
    cal_uid: data.cal_uid ?? null,
    is_owner: 1
  })
  return db.prepare('SELECT * FROM TTermin WHERE id = ?').get(res.lastInsertRowid)
})

ipcMain.handle('termin:update', async (_e, id: number, data: Record<string, unknown>) => {
  const db = getDb()
  const row = db.prepare('SELECT cal_uid, source, is_owner FROM TTermin WHERE id = ?').get(id) as
    { cal_uid: string | null; source: string | null; is_owner: number | null } | undefined

  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE TTermin SET ${fields} WHERE id = @id`).run({ ...data, id })

  // Propagate to Google Calendar — only for owned gcal events (is_owner = 1)
  if (row?.source === 'gcal' && (row.is_owner ?? 1) === 1 && row.cal_uid?.startsWith('gcal:') && isGcalConfigured()) {
    try {
      const auth = buildAuthedClient()
      const calendar = google.calendar({ version: 'v3', auth })
      await calendar.events.patch({
        calendarId: 'primary',
        eventId: row.cal_uid.slice(5),
        requestBody: gcalPatchBody(data)
      })
    } catch {
      // Google patch failed — local change persists; next sync reconciles
    }
  }
  return true
})

// ── FancyPlan-interne Serientermine (Recurrence) ─────────────────────────────
type Recurrence = {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  endMode: 'count' | 'until'
  count: number
  until: string | null
}

function isoDayLocal(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Step a YYYY-MM-DD date forward by `steps` units of the given frequency
function stepDate(iso: string, freq: Recurrence['freq'], steps: number): string {
  const d = new Date(`${iso}T00:00:00`)
  if (freq === 'daily')   d.setDate(d.getDate() + steps)
  if (freq === 'weekly')  d.setDate(d.getDate() + steps * 7)
  if (freq === 'monthly') d.setMonth(d.getMonth() + steps)
  if (freq === 'yearly')  d.setFullYear(d.getFullYear() + steps)
  return isoDayLocal(d)
}

// Expand a recurrence into concrete occurrence dates, starting at `start` (YYYY-MM-DD)
function expandRecurrence(start: string, rec: Recurrence): string[] {
  const interval = Math.max(1, Math.floor(rec.interval || 1))
  const dates: string[] = []
  const HARD_CAP = 730 // safety: never materialise more than ~2 years of occurrences
  if (rec.endMode === 'count') {
    const count = Math.max(1, Math.min(HARD_CAP, Math.floor(rec.count || 1)))
    for (let i = 0; i < count; i++) dates.push(stepDate(start, rec.freq, i * interval))
  } else {
    const until = rec.until || start
    for (let i = 0; i < HARD_CAP; i++) {
      const d = stepDate(start, rec.freq, i * interval)
      if (d > until) break
      dates.push(d)
    }
    if (dates.length === 0) dates.push(start)
  }
  return dates
}

function newLocalMasterId(): string {
  return `local:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

// Creates a FancyPlan-internal recurring series — materialises one TTermin row per occurrence
ipcMain.handle('termin:createSeries', (_e, data: Record<string, unknown>, rec: Recurrence) => {
  const db = getDb()
  const recMaster = newLocalMasterId()
  const recRule = JSON.stringify(rec)
  const dates = expandRecurrence(String(data.termin_date), rec)
  const stmt = db.prepare(`
    INSERT INTO TTermin (act_id, title, termin_date, time_start, time_end, location, notes, meet_url, meet_comment, meet_key, meet_phone, cat, source, cal_uid, is_owner, rec_master, rec_rule)
    VALUES (@act_id, @title, @termin_date, @time_start, @time_end, @location, @notes, @meet_url, @meet_comment, @meet_key, @meet_phone, @cat, 'manual', NULL, 1, @rec_master, @rec_rule)
  `)
  const insertAll = db.transaction((days: string[]) => {
    for (const day of days) {
      stmt.run({
        act_id:       data.act_id ?? null,
        title:        data.title ?? '',
        termin_date:  day,
        time_start:   data.time_start ?? null,
        time_end:     data.time_end ?? null,
        location:     data.location ?? null,
        notes:        data.notes ?? null,
        meet_url:     data.meet_url ?? null,
        meet_comment: data.meet_comment ?? null,
        meet_key:     data.meet_key ?? null,
        meet_phone:   data.meet_phone ?? null,
        cat:          data.cat ?? null,
        rec_master:   recMaster,
        rec_rule:     recRule
      })
    }
  })
  insertAll(dates)
  return { master: recMaster, count: dates.length }
})

// Counts occurrences of a FancyPlan-internal series from a given date
ipcMain.handle('termin:countLocalSeriesFromDate', (_e, recMaster: string, fromDate: string) => {
  const row = getDb().prepare('SELECT COUNT(*) as cnt FROM TTermin WHERE rec_master = ? AND termin_date >= ?').get(recMaster, fromDate) as { cnt: number }
  return row.cnt
})

// Deletes occurrences of a FancyPlan-internal series from a given date (purely local — no Google)
ipcMain.handle('termin:deleteLocalSeriesFromDate', (_e, recMaster: string, fromDate: string) => {
  const r = getDb().prepare('DELETE FROM TTermin WHERE rec_master = ? AND termin_date >= ?').run(recMaster, fromDate)
  return { deleted: r.changes }
})

// Updates shared fields across a FancyPlan-internal series from a given date forward (keeps each occurrence's own date)
ipcMain.handle('termin:updateLocalSeriesFromDate', (_e, recMaster: string, fromDate: string, data: Record<string, unknown>) => {
  const keys = Object.keys(data).filter((k) => k !== 'termin_date' && k !== 'id')
  if (keys.length === 0) return true
  const fields = keys.map((k) => `${k} = @${k}`).join(', ')
  const params: Record<string, unknown> = { recMaster, fromDate }
  for (const k of keys) params[k] = data[k]
  getDb().prepare(`UPDATE TTermin SET ${fields} WHERE rec_master = @recMaster AND termin_date >= @fromDate`).run(params)
  return true
})

// ── Helpers ──────────────────────────────────────────────────────────────────
function gcalEventIdFromUid(calUid: string): string | null {
  if (!calUid.startsWith('gcal:')) return null
  return calUid.slice(5)
}

function nextDayIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + 1)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Builds a Google events.patch body from TTermin fields. `dayOverride` lets a series
// update keep the Google master's own date while applying new times.
function gcalPatchBody(data: Record<string, unknown>, dayOverride?: string): Record<string, unknown> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const body: Record<string, unknown> = {}
  if (data.title    !== undefined) body.summary     = (data.title as string) || '(Termin)'
  if (data.notes    !== undefined) body.description = (data.notes as string | null) ?? ''
  if (data.location !== undefined) body.location    = (data.location as string | null) ?? ''
  const day = dayOverride ?? (data.termin_date as string | undefined)
  if (day) {
    const timeStart = data.time_start as string | null | undefined
    if (timeStart) {
      const timeEnd = (data.time_end as string | null) ?? timeStart
      body.start = { dateTime: `${day}T${timeStart}:00`, timeZone: tz }
      body.end   = { dateTime: `${day}T${timeEnd}:00`,   timeZone: tz }
    } else if (data.time_start !== undefined) {
      // all-day: Google end.date is exclusive → next day
      body.start = { date: day }
      body.end   = { date: nextDayIso(day) }
    }
  }
  return body
}

function insertTombstone(opts: { cal_uid?: string | null; master_id?: string | null; title?: string | null; from_date?: string | null }): void {
  getDb().prepare(`
    INSERT INTO TGcalTombstone (cal_uid, master_id, title, from_date)
    VALUES (@cal_uid, @master_id, @title, @from_date)
  `).run({
    cal_uid:   opts.cal_uid   ?? null,
    master_id: opts.master_id ?? null,
    title:     opts.title     ?? null,
    from_date: opts.from_date ?? null
  })
}

// Format "YYYY-MM-DD" → "YYYYMMDDT000000Z" (UTC midnight), shifted by -1 day for UNTIL
function untilTokenBefore(fromDate: string): string {
  const d = new Date(`${fromDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  d.setUTCHours(23, 59, 59)
  const pad2 = (n: number): string => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
}

// Replace or append UNTIL=… inside the RRULE line (strips COUNT if present)
function setRruleUntil(rrule: string, untilToken: string): string {
  if (!/^RRULE:/i.test(rrule)) return rrule
  let body = rrule.replace(/^RRULE:/i, '')
  body = body.split(';').filter(p => p && !/^UNTIL=/i.test(p) && !/^COUNT=/i.test(p)).join(';')
  return `RRULE:${body};UNTIL=${untilToken}`
}

ipcMain.handle('termin:delete', async (_e, id: number) => {
  const db = getDb()
  const row = db.prepare('SELECT cal_uid, title, termin_date, is_owner, rec_master FROM TTermin WHERE id = ?').get(id) as
    { cal_uid: string | null; title: string | null; termin_date: string | null; is_owner: number | null; rec_master: string | null } | undefined
  const calUid = row?.cal_uid ?? null

  if (calUid?.startsWith('gcal:') && isGcalConfigured() && (row?.is_owner ?? 1) === 1) {
    try {
      const eventId = calUid.slice(5)
      const auth = buildAuthedClient()
      const calendar = google.calendar({ version: 'v3', auth })
      await calendar.events.delete({ calendarId: 'primary', eventId })
    } catch {
      // if GCal delete fails, still delete locally — tombstone prevents re-import
    }
  }

  if (calUid?.startsWith('gcal:')) {
    insertTombstone({
      cal_uid:   calUid,
      master_id: row?.rec_master ?? null,
      title:     row?.title ?? null,
      from_date: row?.termin_date ?? null
    })
  }

  db.prepare('DELETE FROM TTermin WHERE id = ?').run(id)
  db.prepare('DELETE FROM TCalendar WHERE cal_uid = ?').run(calUid)
  return true
})

// Counts all gcal events with a given title from a given date (fallback for events without series ID)
ipcMain.handle('termin:countByTitleFromDate', (_e, title: string, fromDate: string) => {
  const db = getDb()
  const row = db.prepare("SELECT COUNT(*) as cnt FROM TTermin WHERE source = 'gcal' AND title = ? AND termin_date >= ?").get(title, fromDate) as { cnt: number }
  return row.cnt
})

// Deletes all gcal events with a given title from a given date — propagates to Google for owned events
ipcMain.handle('termin:deleteByTitleFromDate', async (_e, title: string, fromDate: string) => {
  const db = getDb()
  const rows = db.prepare(
    "SELECT id, cal_uid, is_owner, rec_master FROM TTermin WHERE source = 'gcal' AND title = ? AND termin_date >= ?"
  ).all(title, fromDate) as { id: number; cal_uid: string | null; is_owner: number | null; rec_master: string | null }[]

  let gcalDeleted = 0
  const gcalErrors: string[] = []
  if (isGcalConfigured()) {
    const auth = buildAuthedClient()
    const calendar = google.calendar({ version: 'v3', auth })
    const deletedMasters = new Set<string>()
    for (const r of rows) {
      if ((r.is_owner ?? 1) !== 1) continue
      const eventId = r.cal_uid ? gcalEventIdFromUid(r.cal_uid) : null
      // For recurring instances, prefer deleting the master once to clean the whole series
      const target = r.rec_master ?? eventId
      if (!target || deletedMasters.has(target)) continue
      try {
        await calendar.events.delete({ calendarId: 'primary', eventId: target })
        deletedMasters.add(target)
        gcalDeleted++
      } catch (err) {
        gcalErrors.push((err as Error).message)
      }
    }
  }

  // Tombstone covers all matching rows regardless of GCal success
  insertTombstone({ title, from_date: fromDate })

  const r1 = db.prepare("DELETE FROM TTermin WHERE source = 'gcal' AND title = ? AND termin_date >= ?").run(title, fromDate)
  const r2 = db.prepare("DELETE FROM TCalendar WHERE source = 'gcal' AND summary = ? AND substr(dtstart,1,10) >= ?").run(title, fromDate)
  return { deleted: r1.changes + r2.changes, gcalDeleted, gcalErrors }
})

// Counts occurrences of a recurring series (LIKE pattern) from a given date
ipcMain.handle('termin:countSeriesFromDate', (_e, pattern: string, fromDate: string) => {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as cnt FROM TTermin WHERE cal_uid LIKE ? AND termin_date >= ?').get(pattern, fromDate) as { cnt: number }
  return row.cnt
})

// Deletes occurrences of a recurring series from a given date — propagates to Google for owned series
// Strategy: if fromDate <= series master start, delete master entirely; else PATCH RRULE with UNTIL
ipcMain.handle('termin:deleteSeriesFromDate', async (_e, pattern: string, fromDate: string) => {
  const db = getDb()
  const rows = db.prepare(
    "SELECT id, cal_uid, is_owner, rec_master, termin_date FROM TTermin WHERE cal_uid LIKE ? AND termin_date >= ?"
  ).all(pattern, fromDate) as { id: number; cal_uid: string | null; is_owner: number | null; rec_master: string | null; termin_date: string | null }[]

  // Derive master id: prefer rec_master from any row, fall back to parsing pattern "gcal:<master>_%"
  let masterId: string | null = rows.find(r => r.rec_master)?.rec_master ?? null
  if (!masterId) {
    const m = pattern.match(/^gcal:(.+)_%$/)
    if (m) masterId = m[1]
  }

  const anyOwned = rows.some(r => (r.is_owner ?? 1) === 1)
  let gcalAction: 'deleted' | 'truncated' | 'skipped' | 'failed' = 'skipped'
  let gcalError: string | null = null

  if (masterId && anyOwned && isGcalConfigured()) {
    try {
      const auth = buildAuthedClient()
      const calendar = google.calendar({ version: 'v3', auth })
      const master = await calendar.events.get({ calendarId: 'primary', eventId: masterId })
      const masterStartDay = (master.data.start?.dateTime ?? master.data.start?.date ?? '').slice(0, 10)

      if (!masterStartDay || fromDate <= masterStartDay) {
        await calendar.events.delete({ calendarId: 'primary', eventId: masterId })
        gcalAction = 'deleted'
      } else {
        const recurrence = master.data.recurrence ?? []
        const untilToken = untilTokenBefore(fromDate)
        const patched = recurrence.map(line => /^RRULE:/i.test(line) ? setRruleUntil(line, untilToken) : line)
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: masterId,
          requestBody: { recurrence: patched }
        })
        gcalAction = 'truncated'
      }
    } catch (err) {
      gcalAction = 'failed'
      gcalError = (err as Error).message
    }
  }

  // Tombstone covers the whole series from fromDate forward — survives a re-sync even if GCal call failed
  insertTombstone({ master_id: masterId, from_date: fromDate })
  // Tombstone each known cal_uid individually as well (covers events without recurringEventId)
  for (const r of rows) {
    if (r.cal_uid) insertTombstone({ cal_uid: r.cal_uid })
  }

  const r1 = db.prepare('DELETE FROM TTermin WHERE cal_uid LIKE ? AND termin_date >= ?').run(pattern, fromDate)
  const r2 = db.prepare("DELETE FROM TCalendar WHERE cal_uid LIKE ? AND substr(dtstart,1,10) >= ?").run(pattern, fromDate)
  return { deleted: r1.changes + r2.changes, gcalAction, gcalError }
})

// Updates a whole gcal series identified by rec_master — applies the edited fields to every
// local occurrence and propagates to Google (owner-only). Two shapes are handled:
//  • rec_master = "local:…"  → a FancyPlan series pushed to Google as individual standalone
//    events (no Google recurrence). Each owned occurrence is patched on its own event id.
//  • rec_master = <gcalId>   → a real Google recurring series. The master is patched once,
//    which covers all instances (incl. those beyond the sync window).
ipcMain.handle('termin:updateGcalSeries', async (_e, recMaster: string, data: Record<string, unknown>) => {
  const db = getDb()
  const rows = db.prepare(
    'SELECT id, cal_uid, is_owner, termin_date FROM TTermin WHERE rec_master = ?'
  ).all(recMaster) as { id: number; cal_uid: string | null; is_owner: number | null; termin_date: string | null }[]

  // Apply field changes to all local occurrences (date stays per occurrence)
  const keys = Object.keys(data).filter((k) => k !== 'termin_date' && k !== 'id' && k !== 'source')
  if (keys.length > 0) {
    const fields = keys.map((k) => `${k} = @${k}`).join(', ')
    const params: Record<string, unknown> = { recMaster }
    for (const k of keys) params[k] = data[k]
    db.prepare(`UPDATE TTermin SET ${fields} WHERE rec_master = @recMaster`).run(params)
  }

  let gcalAction: 'patched' | 'skipped' | 'failed' = 'skipped'
  let gcalError: string | null = null
  if (!isGcalConfigured()) return { ok: true, gcalAction, gcalError }

  const auth = buildAuthedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  if (recMaster.startsWith('local:')) {
    // Pushed FancyPlan series: patch each owned standalone event, keeping its own date
    const errs: string[] = []
    let patched = 0
    for (const r of rows) {
      if ((r.is_owner ?? 1) !== 1 || !r.cal_uid?.startsWith('gcal:')) continue
      try {
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: r.cal_uid.slice(5),
          requestBody: gcalPatchBody(data, r.termin_date ?? undefined)
        })
        patched++
      } catch (err) {
        errs.push((err as Error).message)
      }
    }
    gcalAction = patched > 0 ? 'patched' : 'skipped'
    if (errs.length > 0) { gcalAction = 'failed'; gcalError = errs.join(' | ') }
  } else {
    // Real Google recurring series: patch the master once
    const anyOwned = rows.some(r => (r.is_owner ?? 1) === 1)
    if (anyOwned) {
      try {
        const master = await calendar.events.get({ calendarId: 'primary', eventId: recMaster })
        const masterDay = (master.data.start?.dateTime ?? master.data.start?.date ?? '').slice(0, 10)
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: recMaster,
          requestBody: gcalPatchBody(data, masterDay || undefined)
        })
        gcalAction = 'patched'
      } catch (err) {
        gcalAction = 'failed'
        gcalError = (err as Error).message
      }
    }
  }

  return { ok: true, gcalAction, gcalError }
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

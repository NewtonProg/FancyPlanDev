import { ipcMain, shell } from 'electron'
import { google, calendar_v3 } from 'googleapis'
import * as http from 'http'
import { getDb } from '../db/database'
import { getSetting, setSetting, buildAuthedClient } from './gcalClient'

ipcMain.handle('gcal:auth:status', () => ({
  configured: !!(getSetting('gcal_client_id') && (getSetting('gcal_access_token') || getSetting('gcal_refresh_token'))),
  email: getSetting('gcal_email') ?? ''
}))

ipcMain.handle('gcal:auth:connect', () =>
  new Promise<{ ok?: boolean; email?: string; error?: string }>((resolve) => {
    const clientId = getSetting('gcal_client_id') || import.meta.env.MAIN_VITE_GCAL_CLIENT_ID
    const clientSecret = getSetting('gcal_client_secret') || import.meta.env.MAIN_VITE_GCAL_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return resolve({ error: 'Keine Google-Credentials konfiguriert' })
    }
    if (clientId)     setSetting('gcal_client_id',     clientId)
    if (clientSecret) setSetting('gcal_client_secret', clientSecret)

    const server = http.createServer()
    let resolved = false
    const done = (result: { ok?: boolean; email?: string; error?: string }): void => {
      if (resolved) return
      resolved = true
      server.close()
      resolve(result)
    }

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as { port: number }).port
      const redirectUri = `http://127.0.0.1:${port}/oauth2callback`
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'consent'
      })

      shell.openExternal(authUrl)

      const timeout = setTimeout(() => done({ error: 'Timeout — Autorisierung nicht abgeschlossen' }), 120_000)

      server.on('request', async (req, res) => {
        const url = new URL(req.url!, `http://127.0.0.1:${port}`)
        if (url.pathname !== '/oauth2callback') {
          res.writeHead(404); res.end(); return
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<html><body style="font-family:sans-serif;padding:2rem"><h2>FancyPlan — Autorisiert ✓</h2><p>Du kannst dieses Fenster jetzt schließen.</p></body></html>')

        clearTimeout(timeout)

        const error = url.searchParams.get('error')
        const code = url.searchParams.get('code')
        if (error || !code) return done({ error: error ?? 'Kein Autorisierungscode' })

        try {
          const { tokens } = await oauth2Client.getToken(code)
          if (!tokens.access_token && !tokens.refresh_token) {
            return done({ error: 'Kein Token erhalten — bitte erneut verbinden' })
          }
          if (tokens.access_token) setSetting('gcal_access_token', tokens.access_token)
          if (tokens.refresh_token) setSetting('gcal_refresh_token', tokens.refresh_token)
          if (tokens.expiry_date)   setSetting('gcal_token_expiry', String(tokens.expiry_date))

          oauth2Client.setCredentials(tokens)
          const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
          const userInfo = await oauth2.userinfo.get()
          const email = userInfo.data.email ?? ''
          setSetting('gcal_email', email || null)

          done({ ok: true, email })
        } catch (err: unknown) {
          done({ error: (err as Error).message })
        }
      })
    })
  })
)

ipcMain.handle('gcal:auth:disconnect', () => {
  for (const key of ['gcal_access_token', 'gcal_refresh_token', 'gcal_token_expiry', 'gcal_email']) {
    setSetting(key, null)
  }
  // Delete all GCal events from local cache and clear tombstones so a new account starts fresh
  const db = getDb()
  db.prepare("DELETE FROM TCalendar WHERE source = 'gcal'").run()
  db.prepare("DELETE FROM TTermin WHERE source = 'gcal'").run()
  db.prepare('DELETE FROM TGcalTombstone').run()
  return { ok: true }
})

ipcMain.handle('gcal:sync', async () => {
  if (!getSetting('gcal_client_id') || (!getSetting('gcal_access_token') && !getSetting('gcal_refresh_token'))) {
    return { error: 'Google Calendar nicht konfiguriert' }
  }

  try {
    const auth = buildAuthedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    // Push local manual appointments without a cal_uid to Google Calendar
    const db = getDb()
    const unpushed = db.prepare(
      `SELECT * FROM TTermin WHERE (source = 'manual' OR source IS NULL) AND (cal_uid IS NULL OR cal_uid = '') AND termin_date IS NOT NULL`
    ).all() as Array<Record<string, unknown>>

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    let pushed = 0
    const pushErrors: string[] = []
    for (const t of unpushed) {
      try {
        const startDate = t.termin_date as string
        const timeStart = (t.time_start as string | null) ?? '00:00'
        const timeEnd   = (t.time_end   as string | null) ?? timeStart

        const startIso = `${startDate}T${timeStart}:00`
        const endIso   = `${startDate}T${timeEnd}:00`

        const event = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary:     (t.title     as string) || '(Termin)',
            description: (t.notes     as string | null) ?? undefined,
            location:    (t.location  as string | null) ?? undefined,
            start: { dateTime: startIso, timeZone: tz },
            end:   { dateTime: endIso,   timeZone: tz }
          }
        })

        const gcalId = event.data.id
        if (gcalId) {
          const calUid = `gcal:${gcalId}`
          db.prepare(`UPDATE TTermin SET cal_uid = ?, source = 'gcal', is_owner = 1 WHERE id = ?`).run(calUid, t.id)
          pushed++
        }
      } catch (err: unknown) {
        pushErrors.push(`"${t.title}": ${(err as Error).message}`)
      }
    }
    if (pushErrors.length > 0) {
      return { error: `Push fehlgeschlagen: ${pushErrors.join(' | ')}`, pushed, count: 0 }
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    // List all calendars the user has access to (primary + subscribed/shared)
    const calListResp = await calendar.calendarList.list({})
    const calendars = (calListResp.data.items ?? []).filter(c => c.id)

    // Fetch events from every visible calendar; non-owner role → is_owner = 0
    const allEvents: Array<{ event: calendar_v3.Schema$Event; calendarAccessRole: string }> = []
    for (const cal of calendars) {
      if (!cal.id) continue
      try {
        const resp = await calendar.events.list({
          calendarId: cal.id,
          timeMin: startOfDay.toISOString(),
          timeMax: future.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 500
        })
        for (const ev of resp.data.items ?? []) {
          allEvents.push({ event: ev, calendarAccessRole: cal.accessRole ?? 'reader' })
        }
      } catch {
        // Skip calendars that fail to load (permission issues etc.) — don't abort whole sync
      }
    }
    const upsert = db.prepare(`
      INSERT INTO TCalendar (cal_uid, summary, description, location, dtstart, dtend, all_day, source)
      VALUES (@cal_uid, @summary, @description, @location, @dtstart, @dtend, @all_day, 'gcal')
      ON CONFLICT(cal_uid) DO UPDATE SET
        summary     = excluded.summary,
        description = excluded.description,
        location    = excluded.location,
        dtstart     = excluded.dtstart,
        dtend       = excluded.dtend,
        all_day     = excluded.all_day,
        synced_at   = CURRENT_TIMESTAMP
    `)

    const terminUpsert = db.prepare(`
      INSERT INTO TTermin (act_id, title, termin_date, time_start, time_end, location, notes, source, cal_uid, is_owner, rec_master)
      VALUES (NULL, @title, @termin_date, @time_start, @time_end, @location, @notes, 'gcal', @cal_uid, @is_owner, @rec_master)
      ON CONFLICT(cal_uid) DO UPDATE SET
        title=excluded.title, termin_date=excluded.termin_date,
        time_start=excluded.time_start, time_end=excluded.time_end,
        location=excluded.location, notes=excluded.notes,
        is_owner=excluded.is_owner, rec_master=excluded.rec_master
    `)

    // Tombstone lookups: skip events that the user explicitly deleted in FP
    const tombByUid    = db.prepare('SELECT 1 FROM TGcalTombstone WHERE cal_uid = ?')
    const tombByMaster = db.prepare('SELECT 1 FROM TGcalTombstone WHERE master_id = ? AND (from_date IS NULL OR ? >= from_date)')
    const tombByTitle  = db.prepare('SELECT 1 FROM TGcalTombstone WHERE title = ? AND (from_date IS NULL OR ? >= from_date)')

    let count = 0
    let skipped = 0
    for (const { event, calendarAccessRole } of allEvents) {
      if (!event.id) continue
      const allDay   = !event.start?.dateTime
      const calUid   = `gcal:${event.id}`
      const masterId = event.recurringEventId ?? null
      const summary  = event.summary ?? ''
      const startDay = (event.start?.dateTime ?? event.start?.date ?? '').slice(0, 10)
      // is_owner only true when the connected account is creator/organizer AND the calendar role is owner/writer
      const canEdit  = calendarAccessRole === 'owner' || calendarAccessRole === 'writer'
      const isOwner  = (canEdit && (event.creator?.self === true || event.organizer?.self === true)) ? 1 : 0

      // Honor tombstones — these events were intentionally deleted in FP
      if (
        tombByUid.get(calUid) ||
        (masterId && tombByMaster.get(masterId, startDay)) ||
        tombByTitle.get(summary, startDay)
      ) {
        skipped++
        continue
      }

      upsert.run({
        cal_uid:     calUid,
        summary,
        description: event.description ?? null,
        location:    event.location ?? null,
        dtstart:     event.start?.dateTime ?? event.start?.date ?? '',
        dtend:       event.end?.dateTime   ?? event.end?.date   ?? '',
        all_day:     allDay ? 1 : 0
      })
      if (!allDay && event.start?.dateTime) {
        const start = new Date(event.start.dateTime)
        const end   = event.end?.dateTime ? new Date(event.end.dateTime) : start
        const pad2  = (n: number): string => String(n).padStart(2, '0')
        terminUpsert.run({
          title:       summary,
          termin_date: start.toISOString().slice(0, 10),
          time_start:  `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
          time_end:    `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
          location:    event.location ?? null,
          notes:       event.description ?? null,
          cal_uid:     calUid,
          is_owner:    isOwner,
          rec_master:  masterId
        })
      }
      count++
    }

    return { count, pushed, skipped }
  } catch (err: unknown) {
    return { error: (err as Error).message }
  }
})

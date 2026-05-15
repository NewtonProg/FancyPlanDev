import { ipcMain, shell } from 'electron'
import { google } from 'googleapis'
import * as http from 'http'
import { getDb } from '../db/database'

function getSetting(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM TSettings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

function setSetting(key: string, value: string | null): void {
  const db = getDb()
  if (value === null) {
    db.prepare('DELETE FROM TSettings WHERE key = ?').run(key)
  } else {
    db.prepare('INSERT OR REPLACE INTO TSettings (key, value) VALUES (?, ?)').run(key, value)
  }
}

function makeOAuth2Client(redirectUri = 'http://127.0.0.1') {
  const clientId = getSetting('gcal_client_id') ?? ''
  const clientSecret = getSetting('gcal_client_secret') ?? ''
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

function buildAuthedClient() {
  const client = makeOAuth2Client()
  client.setCredentials({
    access_token: getSetting('gcal_access_token') ?? undefined,
    refresh_token: getSetting('gcal_refresh_token') ?? undefined,
    expiry_date: getSetting('gcal_token_expiry') ? parseInt(getSetting('gcal_token_expiry')!) : undefined
  })
  client.on('tokens', (tokens) => {
    if (tokens.access_token) setSetting('gcal_access_token', tokens.access_token)
    if (tokens.refresh_token) setSetting('gcal_refresh_token', tokens.refresh_token)
    if (tokens.expiry_date) setSetting('gcal_token_expiry', String(tokens.expiry_date))
  })
  return client
}

ipcMain.handle('gcal:auth:status', () => ({
  configured: !!(getSetting('gcal_client_id') && getSetting('gcal_access_token')),
  email: getSetting('gcal_email') ?? ''
}))

ipcMain.handle('gcal:auth:connect', () =>
  new Promise<{ ok?: boolean; email?: string; error?: string }>((resolve) => {
    const clientId = getSetting('gcal_client_id')
    const clientSecret = getSetting('gcal_client_secret')
    if (!clientId || !clientSecret) {
      return resolve({ error: 'Client ID und Client Secret zuerst speichern' })
    }

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
          'https://www.googleapis.com/auth/calendar.readonly',
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
          setSetting('gcal_access_token', tokens.access_token ?? null)
          setSetting('gcal_refresh_token', tokens.refresh_token ?? null)
          setSetting('gcal_token_expiry', tokens.expiry_date ? String(tokens.expiry_date) : null)

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
  // Delete all GCal events from local cache
  getDb().prepare("DELETE FROM TCalendar WHERE source = 'gcal'").run()
  return { ok: true }
})

ipcMain.handle('gcal:sync', async () => {
  if (!getSetting('gcal_client_id') || !getSetting('gcal_access_token')) {
    return { error: 'Google Calendar nicht konfiguriert' }
  }

  try {
    const auth = buildAuthedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const now = new Date()
    const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 500
    })

    const events = response.data.items ?? []
    const db = getDb()
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

    let count = 0
    for (const event of events) {
      if (!event.id) continue
      const allDay = !event.start?.dateTime
      upsert.run({
        cal_uid:     `gcal:${event.id}`,
        summary:     event.summary ?? '',
        description: event.description ?? null,
        location:    event.location ?? null,
        dtstart:     event.start?.dateTime ?? event.start?.date ?? '',
        dtend:       event.end?.dateTime   ?? event.end?.date   ?? '',
        all_day:     allDay ? 1 : 0
      })
      count++
    }

    return { count }
  } catch (err: unknown) {
    return { error: (err as Error).message }
  }
})

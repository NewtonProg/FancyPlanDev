import { google } from 'googleapis'
import { getDb } from '../db/database'

export function getSetting(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM TSettings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string | null): void {
  const db = getDb()
  if (value === null) {
    db.prepare('DELETE FROM TSettings WHERE key = ?').run(key)
  } else {
    db.prepare('INSERT OR REPLACE INTO TSettings (key, value) VALUES (?, ?)').run(key, value)
  }
}

export function buildAuthedClient() {
  const clientId = getSetting('gcal_client_id') ?? ''
  const clientSecret = getSetting('gcal_client_secret') ?? ''
  const client = new google.auth.OAuth2(clientId, clientSecret, 'http://127.0.0.1')
  client.setCredentials({
    access_token:  getSetting('gcal_access_token')  ?? undefined,
    refresh_token: getSetting('gcal_refresh_token') ?? undefined,
    expiry_date:   getSetting('gcal_token_expiry')  ? parseInt(getSetting('gcal_token_expiry')!) : undefined
  })
  client.on('tokens', (tokens) => {
    if (tokens.access_token)  setSetting('gcal_access_token',  tokens.access_token)
    if (tokens.refresh_token) setSetting('gcal_refresh_token', tokens.refresh_token)
    if (tokens.expiry_date)   setSetting('gcal_token_expiry',  String(tokens.expiry_date))
  })
  return client
}

export function isGcalConfigured(): boolean {
  return !!(getSetting('gcal_client_id') && (getSetting('gcal_access_token') || getSetting('gcal_refresh_token')))
}

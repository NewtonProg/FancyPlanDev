import { ipcMain } from 'electron'
import { dbAll, dbGet, dbRun, getDb } from '../db/database'
import { getSetting, setSetting } from './gcalClient'

// ── FancyPlan Cloud bridge (optional, additive) ──────────────────────────────
// The desktop stays fully offline; this only runs when the user has configured
// Firebase and logged in. It mirrors local activities to FancyPlanCloud (PC is the
// leading system) and pulls back mobile changes. See ../../FancyPlanCloud.

type Row = Record<string, unknown>

// Activity fields mirrored to the cloud — must match FancyPlanCloud ACTIVITY_FIELDS.
const ACTIVITY_FIELDS = [
  'Title', 'Com', 'Ltxt1', 'Ltxt2',
  'Prio1', 'Prio2', 'Prio3',
  'AreaName', 'ThemeName', 'Cat', 'Status',
  'Sdone', 'SToday', 'SinWork', 'SInfo', 'Sdel',
  'Pl1Beg', 'Pl1End', 'ActBeg', 'ActEnd', 'dateEnd',
  'TodayDone', 'TodayEdited', 'ToDayShifted',
  'IDActLink'
] as const

// FCM rule columns mirrored to the cloud — must match FancyPlanCloud FcmStatusRule.
const FCM_FIELDS = [
  'Status', 'katFind', 'katReplace',
  'p1LtVal', 'p1LtSet', 'p1LtNoop', 'p1EqVal', 'p1EqSet', 'p1EqNoop', 'p1GtVal', 'p1GtSet', 'p1GtNoop',
  'p2LtVal', 'p2LtSet', 'p2LtNoop', 'p2EqVal', 'p2EqSet', 'p2EqNoop', 'p2GtVal', 'p2GtSet', 'p2GtNoop',
  'p3LtVal', 'p3LtSet', 'p3LtNoop', 'p3EqVal', 'p3EqSet', 'p3EqNoop', 'p3GtVal', 'p3GtSet', 'p3GtNoop',
  'setIstVon', 'setIstBis', 'setPlanVon', 'setPlanBis', 'setInfo',
  'setLtxt1Date', 'setLtxt2Date', 'setErledigt', 'text1', 'text2'
] as const

function pick(row: Row, fields: readonly string[]): Row {
  const out: Row = {}
  for (const f of fields) if (f in row) out[f] = row[f]
  return out
}

// ── Config / auth helpers ────────────────────────────────────────────────────

function cfg() {
  return {
    apiKey: getSetting('firebase_api_key') || '',
    projectId: getSetting('firebase_project_id') || '',
    region: getSetting('cloud_region') || 'europe-west3'
  }
}

function fnUrl(name: string): string {
  const { region, projectId } = cfg()
  return `https://${region}-${projectId}.cloudfunctions.net/${name}`
}

async function getIdToken(): Promise<string> {
  const exp = Number(getSetting('cloud_token_exp') || 0)
  const token = getSetting('cloud_id_token')
  if (token && exp - 60_000 > Date.now()) return token

  const refresh = getSetting('cloud_refresh_token')
  const { apiKey } = cfg()
  if (!refresh || !apiKey) throw new Error('not-logged-in')

  const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }).toString()
  })
  const data = await res.json() as any
  if (!res.ok || !data.id_token) throw new Error(data?.error?.message || 'token-refresh-failed')

  setSetting('cloud_id_token', data.id_token)
  setSetting('cloud_refresh_token', data.refresh_token)
  setSetting('cloud_token_exp', String(Date.now() + Number(data.expires_in || 3600) * 1000))
  return data.id_token
}

async function callFn(name: string, body: Row): Promise<any> {
  const token = await getIdToken()
  const res = await fetch(fnUrl(name), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.message || data?.error || `HTTP ${res.status}`)
  }
  return data
}

// ── Auth handlers ────────────────────────────────────────────────────────────

ipcMain.handle('cloud:auth:status', () => {
  const { apiKey, projectId } = cfg()
  return {
    configured: !!(apiKey && projectId),
    loggedIn: !!getSetting('cloud_refresh_token'),
    email: getSetting('cloud_email') ?? ''
  }
})

ipcMain.handle('cloud:auth:login', async (_e, email: string, password: string) => {
  try {
    const { apiKey } = cfg()
    if (!apiKey) return { error: 'Keine Firebase-API-Key/Projekt-ID konfiguriert' }
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    })
    const data = await res.json() as any
    if (!res.ok || !data.idToken) return { error: data?.error?.message || 'Login fehlgeschlagen' }
    setSetting('cloud_id_token', data.idToken)
    setSetting('cloud_refresh_token', data.refreshToken)
    setSetting('cloud_token_exp', String(Date.now() + Number(data.expiresIn || 3600) * 1000))
    setSetting('cloud_email', data.email || email)
    return { ok: true, email: data.email || email }
  } catch (e) {
    return { error: String(e) }
  }
})

ipcMain.handle('cloud:auth:logout', () => {
  setSetting('cloud_id_token', null)
  setSetting('cloud_refresh_token', null)
  setSetting('cloud_token_exp', null)
  setSetting('cloud_email', null)
  return { ok: true }
})

// ── Push: reference data ─────────────────────────────────────────────────────

function buildRefData(): Row {
  const safe = (fn: () => Row[]): Row[] => { try { return fn() } catch { return [] } }
  const areas = safe(() => dbAll('SELECT AreaName FROM TArea ORDER BY seq1 ASC, AreaName ASC') as Row[])
  const themes = safe(() => dbAll('SELECT ThemeName, IDArea FROM TTheme ORDER BY ThemeName ASC') as Row[])
  const cats = safe(() => dbAll('SELECT Cat, CatGrp FROM TCat ORDER BY Cat ASC') as Row[])
  const status = safe(() => dbAll(
    "SELECT DISTINCT Status FROM TStatus WHERE binArchiv = 0 AND (IDFormName = 'FAct' OR IDFormName = '*') ORDER BY Status ASC"
  ) as Row[])
  const prio = (level: 1 | 2 | 3): Row[] => safe(() => {
    const rows = dbAll(`SELECT * FROM TPrio${level} ORDER BY Prio${level} ASC`) as Row[]
    // Dedup by value — imported tables can hold duplicate rows per priority.
    // Prefer the entry that carries real label text over a bare-number fallback.
    const byValue = new Map<unknown, Row>()
    for (const r of rows) {
      const value = r[`Prio${level}`]
      const txt = r[`Prio${level}Txt`] ?? r.Bez ?? r.Txt ?? r.Description ?? r.Name
      const label = String(txt ?? value ?? '')
      const existing = byValue.get(value)
      if (!existing || (existing.label === String(value) && label !== String(value))) {
        byValue.set(value, { value, label })
      }
    }
    return [...byValue.values()]
  })
  return { areas, themes, cats, status, prio1: prio(1), prio2: prio(2), prio3: prio(3) }
}

ipcMain.handle('cloud:sync:pushRefData', async () => {
  try {
    await callFn('syncReferenceData', { refData: buildRefData() })
    return { ok: true }
  } catch (e) { return { ok: false, error: String(e) } }
})

// ── Push: FCM rules ──────────────────────────────────────────────────────────

ipcMain.handle('cloud:sync:pushFcmRules', async () => {
  try {
    const rows = dbAll('SELECT * FROM TFCMStatus') as Row[]
    const rules = rows.map((r) => pick(r, FCM_FIELDS))
    await callFn('syncFcmRules', { rules, replaceAll: true })
    return { ok: true, count: rules.length }
  } catch (e) { return { ok: false, error: String(e) } }
})

// ── Push: activities (incremental by updated_at) ─────────────────────────────

function changedSince(row: Row, since: number): boolean {
  if (!since) return true
  const marker = String(row.updated_at ?? row.dateCreated ?? '')
  if (!marker) return true
  const t = new Date(marker.replace(' ', 'T')).getTime()
  return isNaN(t) ? true : t > since
}

ipcMain.handle('cloud:sync:pushActivities', async () => {
  try {
    const since = Number(getSetting('cloud_last_push') || 0)
    const rows = dbAll('SELECT * FROM TAct') as Row[]
    const activities = rows
      .filter((r) => changedSince(r, since))
      .map((r) => ({ localId: r.id, ...pick(r, ACTIVITY_FIELDS) }))

    if (activities.length === 0) return { ok: true, pushed: 0 }

    const result = await callFn('syncActivities', { activities })
    setSetting('cloud_last_push', String(Date.now()))
    return { ok: true, pushed: activities.length, created: result.created, updated: result.updated }
  } catch (e) { return { ok: false, error: String(e) } }
})

// ── Pull: mobile changes → TAct, then acknowledge ────────────────────────────

function insertLocalAct(fields: Row): number {
  type ColInfo = { name: string; notnull: number; dflt_value: string | null }
  const colInfos = getDb().prepare('PRAGMA table_info(TAct)').all() as ColInfo[]
  const valid = new Set(colInfos.map((c) => c.name))
  const merged: Row = {}
  for (const [k, v] of Object.entries(fields)) if (valid.has(k)) merged[k] = v
  for (const ci of colInfos) {
    if (ci.notnull && ci.dflt_value === null && !(ci.name in merged) && ci.name !== 'id') merged[ci.name] = ''
  }
  const cols = Object.keys(merged)
  const sql = `INSERT INTO TAct (${cols.join(', ')}, dateCreated) VALUES (${cols.map(() => '?').join(', ')}, CURRENT_TIMESTAMP)`
  const r = dbRun(sql, Object.values(merged))
  return Number(r.lastInsertRowid)
}

function updateLocalAct(id: number, fields: Row): void {
  const valid = new Set((getDb().prepare('PRAGMA table_info(TAct)').all() as { name: string }[]).map((c) => c.name))
  const filtered = Object.fromEntries(Object.entries(fields).filter(([k]) => valid.has(k)))
  const sets = Object.keys(filtered).map((k) => `${k} = ?`).join(', ')
  if (!sets) return
  dbRun(`UPDATE TAct SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...Object.values(filtered), id])
}

ipcMain.handle('cloud:sync:pull', async () => {
  try {
    const res = await callFn('pullActivityUpdates', {})
    const acts = (res.activities ?? []) as Row[]
    const acks: { id: string; localId?: number }[] = []
    let imported = 0, created = 0

    for (const a of acts) {
      const cloudId = String(a.id)
      const fields = pick(a, ACTIVITY_FIELDS)
      const localId = a.localId

      if (typeof localId === 'number') {
        const exists = dbGet('SELECT id FROM TAct WHERE id = ?', [localId]) as Row | undefined
        if (exists) { updateLocalAct(localId, fields); imported++ }
        else { const newId = insertLocalAct(fields); acks.push({ id: cloudId, localId: newId }); created++; continue }
        acks.push({ id: cloudId })
      } else {
        // Mobile-created activity → create locally and report the new TAct id back.
        const newId = insertLocalAct(fields)
        acks.push({ id: cloudId, localId: newId })
        created++
      }
    }

    if (acks.length > 0) await callFn('acknowledgePull', { acks })
    return { ok: true, imported, created }
  } catch (e) { return { ok: false, error: String(e) } }
})

// ── Convenience: full sync (push everything, then pull) ───────────────────────

ipcMain.handle('cloud:sync:all', async () => {
  const out: Row = {}
  try {
    out.refData = await callFn('syncReferenceData', { refData: buildRefData() }).then(() => true).catch((e) => String(e))

    const fcmRows = (dbAll('SELECT * FROM TFCMStatus') as Row[]).map((r) => pick(r, FCM_FIELDS))
    out.fcmRules = await callFn('syncFcmRules', { rules: fcmRows, replaceAll: true }).then((r) => r.written).catch((e) => String(e))

    const since = Number(getSetting('cloud_last_push') || 0)
    const activities = (dbAll('SELECT * FROM TAct') as Row[])
      .filter((r) => changedSince(r, since))
      .map((r) => ({ localId: r.id, ...pick(r, ACTIVITY_FIELDS) }))
    if (activities.length > 0) {
      const r = await callFn('syncActivities', { activities })
      setSetting('cloud_last_push', String(Date.now()))
      out.pushed = activities.length; out.created = r.created; out.updated = r.updated
    } else {
      out.pushed = 0
    }

    // Pull mobile changes.
    const pullRes = await callFn('pullActivityUpdates', {})
    const acts = (pullRes.activities ?? []) as Row[]
    const acks: { id: string; localId?: number }[] = []
    let pulled = 0
    for (const a of acts) {
      const cloudId = String(a.id)
      const fields = pick(a, ACTIVITY_FIELDS)
      const localId = a.localId
      if (typeof localId === 'number') {
        const exists = dbGet('SELECT id FROM TAct WHERE id = ?', [localId]) as Row | undefined
        if (exists) { updateLocalAct(localId, fields); acks.push({ id: cloudId }) }
        else { acks.push({ id: cloudId, localId: insertLocalAct(fields) }) }
      } else {
        acks.push({ id: cloudId, localId: insertLocalAct(fields) })
      }
      pulled++
    }
    if (acks.length > 0) await callFn('acknowledgePull', { acks })
    out.pulled = pulled
    out.ok = true
    return out
  } catch (e) {
    return { ok: false, error: String(e), ...out }
  }
})

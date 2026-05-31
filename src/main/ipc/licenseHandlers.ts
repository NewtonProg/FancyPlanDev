import { ipcMain, app } from 'electron'
import { getDb } from '../db/database'
import https from 'https'
import { URLSearchParams } from 'url'
import crypto from 'crypto'

const VIP_VARIANT_IDS = (import.meta.env.MAIN_VITE_LS_VIP_VARIANT_IDS || '')
  .split(',').map((s: string) => s.trim()).filter(Boolean)

const TEST_VARIANT_IDS = (import.meta.env.MAIN_VITE_LS_TEST_VARIANT_IDS || '')
  .split(',').map((s: string) => s.trim()).filter(Boolean)

function getSetting(key: string): string {
  const row = getDb().prepare('SELECT value FROM TSettings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? ''
}

function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO TSettings (key, value) VALUES (?, ?)').run(key, value)
}

function delSetting(key: string): void {
  getDb().prepare('DELETE FROM TSettings WHERE key = ?').run(key)
}

function lsPost(path: string, body: Record<string, string>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams(body).toString()
    const req = https.request({
      hostname: 'api.lemonsqueezy.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(params),
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { reject(new Error(data)) }
      })
    })
    req.on('error', reject)
    req.write(params)
    req.end()
  })
}

function tierFromVariantId(_variantId: unknown): 'vip' {
  // Every activated license grants VIP access — no Standard/VIP distinction
  return 'vip'
}

// Get current license status (initializes trial on first call)
ipcMain.handle('license:get', () => {
  let trialStart = getSetting('trial_start')
  if (!trialStart) {
    trialStart = new Date().toISOString()
    setSetting('trial_start', trialStart)
  }

  const key = getSetting('license_key')
  const validatedAt = getSetting('license_validated_at')

  const trialDays = Math.floor((Date.now() - new Date(trialStart).getTime()) / (1000 * 60 * 60 * 24))
  const trialExpired = !key && trialDays >= 60

  // Dev mode: unpackaged app always gets VIP (developer access without key)
  const tier = !app.isPackaged ? 'vip' : (getSetting('license_tier') || 'free')

  const maskedKey = key ? key.replace(/^(.{4})(.+)(.{4})$/, (_, a, m, z) => a + m.replace(/./g, '*') + z) : null

  return { key: maskedKey, tier, trialDays, trialExpired, validatedAt }
})

// Activate license key via Lemon Squeezy
ipcMain.handle('license:activate', async (_e, licenseKey: string) => {
  try {
    const instanceName = `FancyPlan-${crypto.randomBytes(4).toString('hex')}`
    const res = await lsPost('/v1/licenses/activate', {
      license_key: licenseKey.trim(),
      instance_name: instanceName
    })

    if (!res.activated) {
      return { ok: false, error: (res.error as string) ?? 'Aktivierung fehlgeschlagen' }
    }

    const meta = res.meta as Record<string, unknown> | undefined
    const instance = res.instance as Record<string, unknown> | undefined
    const variantId = meta?.variant_id
    const tier = tierFromVariantId(variantId)
    const instanceId = String(instance?.id ?? '')

    setSetting('license_key', licenseKey.trim())
    setSetting('license_instance_id', instanceId)
    setSetting('license_tier', tier)
    setSetting('license_validated_at', new Date().toISOString())
    setSetting('license_variant_id', String(variantId ?? ''))

    return { ok: true, tier, instanceId }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

// Silent background re-validation (called on app start)
ipcMain.handle('license:validate', async () => {
  const key = getSetting('license_key')
  const instanceId = getSetting('license_instance_id')
  if (!key || !instanceId) return { ok: false, reason: 'no-license' }

  try {
    const res = await lsPost('/v1/licenses/validate', {
      license_key: key,
      instance_id: instanceId
    })

    if (res.valid) {
      const meta = res.meta as Record<string, unknown> | undefined
      const tier = tierFromVariantId(meta?.variant_id)
      setSetting('license_tier', tier)
      setSetting('license_validated_at', new Date().toISOString())
      return { ok: true, tier }
    }
    return { ok: false, reason: 'invalid' }
  } catch {
    return { ok: false, reason: 'network-error' }
  }
})

// Reset license (for support / testing)
ipcMain.handle('license:reset', () => {
  for (const k of ['license_key', 'license_instance_id', 'license_tier', 'license_validated_at', 'license_variant_id']) {
    delSetting(k)
  }
  return { ok: true }
})

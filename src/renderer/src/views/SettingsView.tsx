import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLicense } from '../hooks/useLicense'

const inp = 'w-full text-sm border border-outline-variant rounded-lg px-3 py-1.5 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/40'
const lbl = 'text-xs text-on-surface-variant/60 mb-1 block'

type MailCfg = {
  mail_imap_host: string; mail_imap_port: string; mail_imap_user: string
  mail_imap_password: string; mail_imap_tls: string
  mail_smtp_host: string; mail_smtp_port: string
  mail_smtp_user: string; mail_smtp_password: string; mail_from_name: string
}
type CalCfg = {
  cal_caldav_url: string; cal_user: string; cal_password: string; cal_calendar_name: string
}
type GCalCfg = { gcal_client_id: string; gcal_client_secret: string }
type FirebaseCfg = { firebase_project_id: string; firebase_api_key: string; firebase_app_id: string }
type ImportResult = {
  canceled?: boolean; success?: boolean; counts?: Record<string, number>; errors?: string[]
  catMatched?: number; catUnmatched?: number
}

const TABLE_LABELS: Record<string, string> = {
  TArea:   'Bereiche',
  TTheme:  'Themen',
  TCat:    'Kategorien',
  TGroup1: 'Gruppen',
  TPrio1:  'Prioritäten 1',
  TPrio2:  'Prioritäten 2',
  TPrio3:  'Prioritäten 3',
  TTel:    'Kontakte',
  TAct:    'Aktivitäten',
}
type ImportState = 'idle' | 'running' | 'done' | 'error'
type JsonState = 'idle' | 'running' | 'done' | 'error'

const GMAIL_MAIL: MailCfg = {
  mail_imap_host: 'imap.gmail.com', mail_imap_port: '993', mail_imap_tls: '1',
  mail_imap_user: '', mail_imap_password: '',
  mail_smtp_host: 'smtp.gmail.com', mail_smtp_port: '587',
  mail_smtp_user: '', mail_smtp_password: '', mail_from_name: ''
}
const OUTLOOK_MAIL: MailCfg = {
  mail_imap_host: 'outlook.office365.com', mail_imap_port: '993', mail_imap_tls: '1',
  mail_imap_user: '', mail_imap_password: '',
  mail_smtp_host: 'smtp.office365.com', mail_smtp_port: '587',
  mail_smtp_user: '', mail_smtp_password: '', mail_from_name: ''
}
const ICLOUD_CAL: Partial<CalCfg> = { cal_caldav_url: 'https://caldav.icloud.com' }
const NEXTCLOUD_CAL: Partial<CalCfg> = { cal_caldav_url: 'https://DEINE-NEXTCLOUD/remote.php/dav/calendars/USER/' }

const BRAND_ICONS = [
  { key: 'fp-taskbar-1',      label: 'Standard' },
  { key: 'fp-taskbar-2',      label: 'Variante 2' },
  { key: 'fp-taskbar-bw',     label: 'S/W' },
  { key: 'fp-no-text-tr',     label: 'Kein Text' },
  { key: 'fp-text-bottom',    label: 'Text unten' },
  { key: 'fp-text-middle',    label: 'Text Mitte' },
  { key: 'fp-fp-bottom-tr',   label: '"FP" unten' },
  { key: 'fp-full-bottom-tr', label: '"FancyPlan" unten' },
  { key: 'fp-full-bottom-bw', label: '"FancyPlan" S/W' },
  { key: 'fp-no-border',      label: 'Ohne Rand' },
  { key: 'fp-gr-bg-bw',       label: 'Grau S/W' },
  { key: 'fp-fp-bottom-bw',   label: '"FP" S/W' },
]

// Zentrale Kontakt-/Vorschlagsadresse.
const SUGGEST_EMAIL = 'account@inprime.net'

// Was sich anpassen lässt (für die Werbe-Sektion).
const CUSTOMIZE_ITEMS = [
  { icon: 'category', text: 'Bereiche, Themen & Kategorien frei strukturieren' },
  { icon: 'flag',     text: 'Status & Prioritäten nach eigenem Workflow definieren' },
  { icon: 'palette',  text: 'Erscheinungsbild & Branding anpassen' },
  { icon: 'tune',     text: 'Seiten auf die eigene Arbeitsweise zuschneiden — und Ihre Seiten ergänzen' },
  { icon: 'devices',  text: 'Kommunikation und Datenaustausch mit Anwendungen (z. B. Handy) erstellen' },
  { icon: 'business', text: 'Anpassung an Ihre Firma' },
]

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }): JSX.Element {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 glass-card rounded-xl text-left mb-2 hover:bg-surface-container-high transition-colors"
    >
      <span className="text-sm font-semibold text-on-surface uppercase tracking-wide">{label}</span>
      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
        {open ? 'expand_less' : 'expand_more'}
      </span>
    </button>
  )
}

type Props = { onLicense: () => void }

export default function SettingsView({ onLicense }: Props): JSX.Element {
  const { t } = useTranslation()
  const { isVip } = useLicense()

  const [mail, setMail] = useState<MailCfg>({
    mail_imap_host: '', mail_imap_port: '993', mail_imap_user: '',
    mail_imap_password: '', mail_imap_tls: '1',
    mail_smtp_host: '', mail_smtp_port: '587',
    mail_smtp_user: '', mail_smtp_password: '', mail_from_name: ''
  })
  const [cal, setCal] = useState<CalCfg>({ cal_caldav_url: '', cal_user: '', cal_password: '', cal_calendar_name: '' })
  const [gcal, setGcal] = useState<GCalCfg>({ gcal_client_id: '', gcal_client_secret: '' })
  const [firebase, setFirebase] = useState<FirebaseCfg>({ firebase_project_id: '', firebase_api_key: '', firebase_app_id: '' })
  const [dbPath, setDbPath] = useState('')
  const [pendingDbPath, setPendingDbPath] = useState('')
  const [dbMsg, setDbMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [dbConfirm, setDbConfirm] = useState(false)
  const [dbCopying, setDbCopying] = useState(false)
  const [dbDone, setDbDone] = useState(false)
  const [backupMsg, setBackupMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [importConfirm, setImportConfirm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [savingMail, setSavingMail] = useState(false)
  const [testingMail, setTestingMail] = useState(false)
  const [mailStatus, setMailStatus] = useState<{ configured: boolean; email: string } | null>(null)
  const [mailMsg, setMailMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [mailOpen, setMailOpen] = useState(false)
  const [savingCal, setSavingCal] = useState(false)
  const [savingFirebase, setSavingFirebase] = useState(false)
  const [testingCal, setTestingCal] = useState(false)
  const [connectingGcal, setConnectingGcal] = useState(false)
  const [updateEvt, setUpdateEvt] = useState<UpdateEvent>({ status: 'idle' })
  const [calStatus, setCalStatus] = useState<{ configured: boolean; user: string } | null>(null)
  const [gcalStatus, setGcalStatus] = useState<{ configured: boolean; email: string } | null>(null)
  const [calMsg, setCalMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [gcalMsg, setGcalMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [firebaseMsg, setFirebaseMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // FancyPlan Cloud (Login + Sync)
  const [cloudEmail, setCloudEmail] = useState('')
  const [cloudPassword, setCloudPassword] = useState('')
  const [cloudStatus, setCloudStatus] = useState<{ configured: boolean; loggedIn: boolean; email: string } | null>(null)
  const [cloudOpen, setCloudOpen] = useState(false)
  const [cloudLoggingIn, setCloudLoggingIn] = useState(false)
  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [cloudMsg, setCloudMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const [brandLogoKey,  setBrandLogoKey]  = useState('fp-taskbar-1')
  const [brandLogoData, setBrandLogoData] = useState('')
  const [brandAppName,  setBrandAppName]  = useState('')
  const [brandOpen,     setBrandOpen]     = useState(false)
  const [savingBrand,   setSavingBrand]   = useState(false)
  const [brandMsg,      setBrandMsg]      = useState<{ text: string; ok: boolean } | null>(null)

  // SubForm open/close
  const [suggestOpen, setSuggestOpen] = useState(true)
  const [emailCopied, setEmailCopied] = useState(false)
  const [calOpen, setCalOpen] = useState(false)
  const [licenseOpen, setLicenseOpen] = useState(false)
  const [dbOpen, setDbOpen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [firebaseOpen, setFirebaseOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)

  // Import states
  const [importState, setImportState] = useState<ImportState>('idle')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [jsonExState, setJsonExState] = useState<JsonState>('idle')
  const [jsonExMsg, setJsonExMsg] = useState<string | null>(null)
  const [jsonImState, setJsonImState] = useState<JsonState>('idle')
  const [jsonImCounts, setJsonImCounts] = useState<Record<string, number> | null>(null)
  const [jsonImError, setJsonImError] = useState<string | null>(null)

  const loadDbPath = useCallback(() => {
    window.db.dbConfig.getPath().then((p) => { setDbPath(p); setPendingDbPath(p) })
  }, [])

  useEffect(() => {
    Promise.all([
      window.db.settings.getAll('mail_'),
      window.db.settings.getAll('cal_'),
      window.db.settings.getAll('gcal_'),
      window.db.settings.getAll('firebase_'),
      window.db.settings.getAll('brand_')
    ]).then(([m, c, g, f, b]) => {
      setMail((p) => ({ ...p, ...m }))
      setCal((p) => ({ ...p, ...c }))
      setGcal((p) => ({ ...p, gcal_client_id: g.gcal_client_id ?? '', gcal_client_secret: g.gcal_client_secret ?? '' }))
      setFirebase((p) => ({ ...p, firebase_project_id: f.firebase_project_id ?? '', firebase_api_key: f.firebase_api_key ?? '', firebase_app_id: f.firebase_app_id ?? '' }))
      setBrandLogoKey((b['brand_logo_key'] as string) || 'fp-taskbar-1')
      setBrandLogoData((b['brand_logo_data'] as string) || '')
      setBrandAppName((b['brand_app_name'] as string) || '')
    })
    window.db.mail.authStatus().then(setMailStatus)
    window.db.cal.authStatus().then(setCalStatus)
    window.db.gcal.authStatus().then(setGcalStatus)
    window.db.cloud.authStatus().then((s) => { setCloudStatus(s); if (s.email) setCloudEmail(s.email) })
    loadDbPath()
  }, [loadDbPath])

  useEffect(() => {
    window.db.update.status().then(setUpdateEvt)
    const unsub = window.db.update.onEvent(setUpdateEvt)
    return unsub
  }, [])

  const setM = (k: keyof MailCfg, v: string): void => setMail((p) => ({ ...p, [k]: v }))
  const setC = (k: keyof CalCfg, v: string): void => setCal((p) => ({ ...p, [k]: v }))
  const setG = (k: keyof GCalCfg, v: string): void => setGcal((p) => ({ ...p, [k]: v }))
  const setF = (k: keyof FirebaseCfg, v: string): void => setFirebase((p) => ({ ...p, [k]: v }))

  const handleSaveBrand = async (): Promise<void> => {
    setSavingBrand(true)
    await window.db.settings.set('brand_logo_key', brandLogoKey)
    await window.db.settings.set('brand_logo_data', brandLogoData || null)
    await window.db.settings.set('brand_app_name', brandAppName || null)
    setSavingBrand(false)
    window.dispatchEvent(new Event('fp:brand-updated'))
    setBrandMsg({ text: t('settings.saved'), ok: true })
    setTimeout(() => setBrandMsg(null), 3000)
  }

  const handleBrowseCustomLogo = async (): Promise<void> => {
    const data = await window.db.brand.browseLogo()
    if (data) setBrandLogoData(data)
  }

  const applyMailPreset = (preset: MailCfg): void =>
    setMail((p) => ({ ...preset, mail_imap_user: p.mail_imap_user, mail_imap_password: p.mail_imap_password, mail_smtp_user: p.mail_imap_user, mail_smtp_password: p.mail_imap_password, mail_from_name: p.mail_from_name }))

  const handleSaveMail = async (): Promise<void> => {
    setSavingMail(true)
    for (const [k, v] of Object.entries(mail)) await window.db.settings.set(k, (v as string) || null)
    setSavingMail(false)
    window.db.mail.authStatus().then(setMailStatus)
    setMailMsg({ text: t('settings.saved'), ok: true })
    setTimeout(() => setMailMsg(null), 3000)
  }

  const handleTestMail = async (): Promise<void> => {
    setTestingMail(true); setMailMsg(null)
    const r = await window.db.mail.configTest()
    setTestingMail(false)
    setMailMsg(r.ok
      ? { text: t('settings.connected'), ok: true }
      : { text: t('common.error', { msg: r.error }), ok: false })
  }

  const handleBrowseDbPath = async (): Promise<void> => {
    const picked = await window.db.dbConfig.browsePath()
    if (picked) setPendingDbPath(picked)
  }

  const handleSetDbPath = (): void => {
    if (!pendingDbPath || pendingDbPath === dbPath) return
    setDbConfirm(true)
    setDbDone(false)
    setDbMsg(null)
  }

  const handleConfirmCopy = async (): Promise<void> => {
    setDbCopying(true)
    const r = await window.db.dbConfig.copyAndSet(pendingDbPath)
    setDbCopying(false)
    if (r.ok) {
      setDbPath(pendingDbPath)
      setDbConfirm(false)
      setDbDone(true)
    } else {
      setDbMsg({ text: `Fehler: ${r.error}`, ok: false })
      setDbConfirm(false)
    }
  }

  const handleBackupExport = async (): Promise<void> => {
    const r = await window.db.backup.export()
    if (r.ok) {
      setBackupMsg({ text: `✓ Backup gespeichert: ${r.path}`, ok: true })
    } else {
      setBackupMsg({ text: 'Abgebrochen', ok: false })
    }
    setTimeout(() => setBackupMsg(null), 5000)
  }

  const handleImportConfirm = async (): Promise<void> => {
    setImporting(true)
    const r = await window.db.backup.import()
    setImporting(false)
    setImportConfirm(false)
    if (r.canceled) return
    if (r.ok) {
      setImportDone(true)
    } else {
      setBackupMsg({ text: `Fehler: ${r.error}`, ok: false })
      setTimeout(() => setBackupMsg(null), 5000)
    }
  }

  const handleSaveCal = async (): Promise<void> => {
    setSavingCal(true)
    for (const [k, v] of Object.entries({ ...cal, ...gcal })) await window.db.settings.set(k, (v as string) || null)
    setSavingCal(false)
    window.db.cal.authStatus().then(setCalStatus)
    window.db.gcal.authStatus().then(setGcalStatus)
    setCalMsg({ text: t('settings.saved'), ok: true })
    setTimeout(() => setCalMsg(null), 3000)
  }

  const handleSaveFirebase = async (): Promise<void> => {
    setSavingFirebase(true)
    for (const [k, v] of Object.entries(firebase)) await window.db.settings.set(k, (v as string) || null)
    setSavingFirebase(false)
    setFirebaseMsg({ text: t('settings.saved'), ok: true })
    setTimeout(() => setFirebaseMsg(null), 3000)
  }

  const handleCloudLogin = async (): Promise<void> => {
    setCloudLoggingIn(true); setCloudMsg(null)
    const r = await window.db.cloud.login(cloudEmail.trim(), cloudPassword)
    setCloudLoggingIn(false)
    if (r.ok) {
      setCloudPassword('')
      setCloudMsg({ text: `✓ Angemeldet als ${r.email}`, ok: true })
      window.db.cloud.authStatus().then(setCloudStatus)
    } else {
      setCloudMsg({ text: `Fehler: ${r.error}`, ok: false })
    }
  }

  const handleCloudLogout = async (): Promise<void> => {
    await window.db.cloud.logout()
    setCloudPassword('')
    window.db.cloud.authStatus().then(setCloudStatus)
    setCloudMsg({ text: 'Abgemeldet', ok: true })
    setTimeout(() => setCloudMsg(null), 2000)
  }

  const handleCloudSync = async (): Promise<void> => {
    setCloudSyncing(true); setCloudMsg(null)
    const r = await window.db.cloud.syncAll()
    setCloudSyncing(false)
    if (r.ok) {
      setCloudMsg({ text: `✓ Synchronisiert — ${r.pushed ?? 0} gesendet, ${r.pulled ?? 0} empfangen`, ok: true })
    } else {
      setCloudMsg({ text: `Fehler: ${r.error}`, ok: false })
    }
  }

  const handleGcalConnect = async (): Promise<void> => {
    await window.db.settings.set('gcal_client_id', gcal.gcal_client_id || null)
    await window.db.settings.set('gcal_client_secret', gcal.gcal_client_secret || null)
    setConnectingGcal(true); setGcalMsg(null)
    const r = await window.db.gcal.connect()
    setConnectingGcal(false)
    if (r.ok) {
      setGcalMsg({ text: t('settings.gcalConnected', { email: r.email }), ok: true })
      window.db.gcal.authStatus().then(setGcalStatus)
      window.db.gcal.sync()
    } else {
      setGcalMsg({ text: t('common.error', { msg: r.error }), ok: false })
    }
  }

  const handleGcalDisconnect = async (): Promise<void> => {
    await window.db.gcal.disconnect()
    window.db.gcal.authStatus().then(setGcalStatus)
    setGcalMsg({ text: t('settings.disconnected'), ok: true })
    setTimeout(() => setGcalMsg(null), 2000)
  }

  const handleGcalSync = async (): Promise<void> => {
    setConnectingGcal(true); setGcalMsg(null)
    const r = await window.db.gcal.sync()
    setConnectingGcal(false)
    setGcalMsg(r.error
      ? { text: t('common.error', { msg: r.error }), ok: false }
      : { text: `✓ ${r.count} Termine geladen`, ok: true })
  }

  const handleTestCal = async (): Promise<void> => {
    setTestingCal(true); setCalMsg(null)
    const r = await window.db.cal.sync()
    setTestingCal(false)
    setCalMsg(r.error
      ? { text: t('common.error', { msg: r.error }), ok: false }
      : { text: `✓ Verbunden — ${r.count} Termine geladen`, ok: true })
    window.db.cal.authStatus().then(setCalStatus)
  }

  const handleImport = async (): Promise<void> => {
    setImportState('running'); setImportResult(null)
    try {
      const res = await window.db.migrate.fromAccess()
      if (res.canceled) { setImportState('idle'); return }
      setImportResult(res)
      setImportState(res.success ? 'done' : 'error')
    } catch (e) {
      setImportResult({ errors: [String(e)] })
      setImportState('error')
    }
  }

  const importTotal = importResult?.counts ? Object.values(importResult.counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-on-surface mb-6">{t('settings.title')}</h2>

        {/* ── Anpassung & Vorschläge ────────────────────────────────────── */}
        <SectionHeader
          label="Kontakt zu uns — Hilfe — Anpassung — Vorschläge"
          open={suggestOpen}
          onToggle={() => setSuggestOpen((o) => !o)}
        />
        {suggestOpen && (
          <div className="mb-2">
            {/* Werbung: Anpassbarkeit */}
            <div className="glass-card rounded-xl p-5 mb-3">
              <div className="flex items-start gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-[26px] leading-none mt-0.5">auto_fix_high</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Ganz auf Sie zugeschnitten</p>
                  <p className="text-xs text-on-surface-variant/80 mt-1 leading-relaxed">
                    FancyPlan wächst mit Ihren Anforderungen: Struktur, Workflow und Erscheinungsbild
                    bestimmen Sie selbst — damit die App genau so arbeitet, wie Sie es sich wünschen.
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-2 pl-1">
                {CUSTOMIZE_ITEMS.map((it) => (
                  <li key={it.icon} className="flex items-center gap-2.5 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary-fixed-dim text-[18px] leading-none">{it.icon}</span>
                    {it.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vorschläge per Mail */}
            <div className="glass-card rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-[26px] leading-none mt-0.5">lightbulb</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Ihre Idee fehlt noch?</p>
                  <p className="text-xs text-on-surface-variant/80 mt-1 leading-relaxed">
                    Wir entwickeln FancyPlan stetig weiter. Schreiben Sie uns, was Sie sich wünschen —
                    jeder Vorschlag wird gelesen.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => window.db.links.open(
                    `${SUGGEST_EMAIL}?subject=${encodeURIComponent('FancyPlan – Vorschlag')}`,
                    'mail'
                  )}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px] leading-none">mail</span>
                  Vorschlag senden
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SUGGEST_EMAIL)
                    setEmailCopied(true)
                    setTimeout(() => setEmailCopied(false), 1800)
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px] leading-none">{emailCopied ? 'check' : 'content_copy'}</span>
                  {emailCopied ? 'Kopiert' : SUGGEST_EMAIL}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── App-Update ────────────────────────────────────────────────── */}
        <SectionHeader
          label="App-Update"
          open={updateOpen}
          onToggle={() => setUpdateOpen((o) => !o)}
        />
        {updateOpen && (
          <div className="mb-2">
            <div className="glass-card rounded-xl p-4 mb-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant/70">Version <strong className="text-on-surface">1.0.0</strong></span>
                {updateEvt.status === 'idle' || updateEvt.status === 'not-available' ? (
                  <button
                    onClick={() => window.db.update.check()}
                    className="px-3 py-1 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">
                    Auf Updates prüfen
                  </button>
                ) : updateEvt.status === 'downloaded' ? (
                  <button
                    onClick={() => window.db.update.install()}
                    className="px-3 py-1 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600">
                    Jetzt installieren &amp; neu starten
                  </button>
                ) : null}
              </div>
              {updateEvt.status === 'checking' && <p className="text-xs text-on-surface-variant/60">Prüfe auf Updates…</p>}
              {updateEvt.status === 'available' && <p className="text-xs text-secondary-fixed-dim">Version {updateEvt.version} verfügbar — wird heruntergeladen…</p>}
              {updateEvt.status === 'downloading' && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-on-surface-variant/60">Download: {updateEvt.progress ?? 0} %</p>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${updateEvt.progress ?? 0}%` }} />
                  </div>
                </div>
              )}
              {updateEvt.status === 'downloaded' && <p className="text-xs text-secondary-fixed-dim">Version {updateEvt.version} bereit — App neu starten zum Installieren.</p>}
              {updateEvt.status === 'not-available' && <p className="text-xs text-on-surface-variant/50">App ist aktuell.</p>}
              {updateEvt.status === 'error' && <p className="text-xs text-error">{updateEvt.message ?? 'Update-Fehler'}</p>}
            </div>
            <div className="px-4 py-2.5 bg-primary/5 rounded-xl text-xs text-primary mb-6">
              Updates werden automatisch 5 Sekunden nach App-Start im Hintergrund geprüft und heruntergeladen.
            </div>
          </div>
        )}

        {/* ── Daten importieren ─────────────────────────────────────────── */}
        <SectionHeader
          label={t('import.title')}
          open={importOpen}
          onToggle={() => setImportOpen((o) => !o)}
        />
        {importOpen && (
          <div className="mb-2">
            <p className="text-sm text-on-surface-variant/60 mb-4">{t('import.description')}</p>

            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">{t('import.tables')}</p>
              <button
                onClick={handleImport}
                disabled={importState === 'running'}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {importState === 'running' ? t('import.importing') : t('import.selectFile')}
              </button>
              {importState === 'done' && importResult && (
                <div className="mt-4 border border-secondary-container/30 bg-secondary-container/10 rounded-lg p-4">
                  <p className="text-sm font-medium text-secondary-fixed-dim mb-2">
                    Import abgeschlossen — {importTotal.toLocaleString('de')} Datensätze
                  </p>
                  <table className="w-full text-xs mb-2">
                    <tbody>
                      {Object.entries(importResult.counts ?? {}).map(([tbl, cnt]) => (
                        <tr key={tbl} className="border-t border-secondary-container/20">
                          <td className="py-0.5 text-secondary-fixed-dim">{TABLE_LABELS[tbl] ?? tbl}</td>
                          <td className="py-0.5 text-right text-secondary-fixed-dim">{cnt.toLocaleString('de')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(importResult.catUnmatched ?? 0) > 0 && (
                    <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                      <p className="text-xs text-amber-400 font-medium mb-0.5">
                        {importResult.catMatched ?? 0} von {(importResult.counts?.['TCat'] ?? 0).toLocaleString('de')} Kategorien einem Thema zugeordnet
                      </p>
                      <p className="text-xs text-on-surface-variant/70">
                        {importResult.catUnmatched} Kategorien ohne Zuordnung — in Werte-Liste → Kategorien korrigierbar.
                      </p>
                    </div>
                  )}
                  {(importResult.catUnmatched ?? 0) === 0 && (importResult.catMatched ?? 0) > 0 && (
                    <p className="text-xs text-secondary-fixed-dim/70 mt-1">
                      Alle {importResult.catMatched} Kategorien einem Thema zugeordnet.
                    </p>
                  )}
                  {(importResult.errors?.length ?? 0) > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-tertiary mb-1">{t('import.notes')}</p>
                      {importResult.errors!.map((e, i) => <p key={i} className="text-xs text-tertiary">• {e}</p>)}
                    </div>
                  )}
                </div>
              )}
              {importState === 'error' && importResult && (
                <div className="mt-4 border border-red-200 bg-error-container/10 rounded-lg p-4">
                  <p className="text-sm font-medium text-error mb-2">{t('import.error')}</p>
                  {importResult.errors?.map((e, i) => <p key={i} className="text-xs text-error">• {e}</p>)}
                </div>
              )}
            </div>

            <div className="glass-card rounded-xl p-4 mb-3">
              <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-1">JSON-Export</p>
              <p className="text-xs text-on-surface-variant/60 mb-3">Alle Daten als JSON-Datei speichern (Vollsicherung, lesbar, versioniert).</p>
              <button
                onClick={async () => {
                  setJsonExState('running'); setJsonExMsg(null)
                  const r = await window.db.export.jsonExport()
                  if (r.canceled) { setJsonExState('idle'); return }
                  if (r.ok) { setJsonExState('done'); setJsonExMsg(`${r.total?.toLocaleString('de')} Datensätze exportiert → ${r.path}`) }
                  else { setJsonExState('error'); setJsonExMsg(r.error ?? 'Fehler') }
                }}
                disabled={jsonExState === 'running'}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {jsonExState === 'running' ? 'Exportiert…' : '↓ JSON exportieren'}
              </button>
              {jsonExMsg && <p className={`text-xs mt-3 ${jsonExState === 'error' ? 'text-error' : 'text-secondary-fixed-dim'}`}>{jsonExMsg}</p>}
            </div>

            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-1">JSON-Import</p>
              <p className="text-xs text-on-surface-variant/60 mb-1">Zuvor exportierte JSON-Datei einlesen. Bestehende Datensätze werden überschrieben (INSERT OR REPLACE).</p>
              <p className="text-xs text-error/80 mb-3">⚠ Vorher eine Sicherung erstellen.</p>
              <button
                onClick={async () => {
                  setJsonImState('running'); setJsonImCounts(null); setJsonImError(null)
                  const r = await window.db.export.jsonImport()
                  if (r.canceled) { setJsonImState('idle'); return }
                  if (r.ok) { setJsonImState('done'); setJsonImCounts(r.counts ?? {}) }
                  else { setJsonImState('error'); setJsonImError(r.error ?? 'Fehler') }
                }}
                disabled={jsonImState === 'running'}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {jsonImState === 'running' ? 'Importiert…' : '↑ JSON importieren'}
              </button>
              {jsonImState === 'done' && jsonImCounts && (
                <div className="mt-4 border border-secondary-container/30 bg-secondary-container/10 rounded-lg p-4">
                  <p className="text-sm font-medium text-secondary-fixed-dim mb-2">
                    Import abgeschlossen — {Object.values(jsonImCounts).reduce((a, b) => a + b, 0).toLocaleString('de')} Datensätze
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      {Object.entries(jsonImCounts).map(([tbl, cnt]) => (
                        <tr key={tbl} className="border-t border-secondary-container/20">
                          <td className="py-0.5 text-secondary-fixed-dim">{tbl}</td>
                          <td className="py-0.5 text-right text-secondary-fixed-dim">{cnt.toLocaleString('de')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {jsonImState === 'error' && <p className="text-xs text-error mt-3">{jsonImError}</p>}
            </div>
          </div>
        )}

        {/* ── Datenbank ─────────────────────────────────────────────────── */}
        <SectionHeader
          label="Datenbank"
          open={dbOpen}
          onToggle={() => setDbOpen((o) => !o)}
        />
        {dbOpen && (
          <div className="mb-2">
            <div className="glass-card rounded-xl p-4 mb-3 flex flex-col gap-3">
              <div>
                <label className={lbl}>Datenbankpfad</label>
                <div className="flex gap-2">
                  <input className={`${inp} flex-1 font-mono text-xs`} value={pendingDbPath}
                    onChange={(e) => { setPendingDbPath(e.target.value); setDbDone(false) }} />
                  <button onClick={handleBrowseDbPath}
                    className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high whitespace-nowrap">
                    Ordner...
                  </button>
                </div>
              </div>

              {/* Bestätigungsdialog */}
              {dbConfirm && (
                <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 flex flex-col gap-2">
                  <p className="text-sm text-on-surface font-medium">Datenbank in neuen Pfad kopieren?</p>
                  <p className="text-xs text-on-surface-variant">Die bestehende Datenbank wird in den neuen Ordner kopiert. Danach muss die App neu gestartet werden.</p>
                  <div className="flex gap-2 mt-1">
                    <button onClick={handleConfirmCopy} disabled={dbCopying}
                      className="px-4 py-1.5 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-50">
                      {dbCopying ? 'Kopiere…' : 'Ja, kopieren'}
                    </button>
                    <button onClick={() => { setDbConfirm(false); setPendingDbPath(dbPath) }}
                      className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {/* Erfolgsmeldung + Neustart */}
              {dbDone && (
                <div className="rounded-xl bg-secondary-container/20 border border-secondary-fixed-dim/30 px-4 py-3 flex flex-col gap-2">
                  <p className="text-sm text-secondary-fixed-dim font-medium">✓ Datenbank erfolgreich kopiert</p>
                  <p className="text-xs text-on-surface-variant">Bitte die App jetzt neu starten, damit der neue Pfad aktiv wird.</p>
                  <button onClick={() => window.db.dbConfig.relaunch()}
                    className="self-start mt-1 px-4 py-1.5 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600">
                    Jetzt neu starten
                  </button>
                </div>
              )}

              {importConfirm && (
                <div className="rounded-xl bg-error/10 border border-error/30 px-4 py-3 flex flex-col gap-2">
                  <p className="text-sm text-on-surface font-medium">Datenbank wirklich überschreiben?</p>
                  <p className="text-xs text-on-surface-variant">Die aktuelle Datenbank wird durch das Backup ersetzt. Danach muss die App neu gestartet werden.</p>
                  <div className="flex gap-2 mt-1">
                    <button onClick={handleImportConfirm} disabled={importing}
                      className="px-4 py-1.5 text-sm rounded-lg bg-error text-on-error hover:opacity-90 disabled:opacity-50">
                      {importing ? 'Importiere…' : 'Ja, importieren'}
                    </button>
                    <button onClick={() => setImportConfirm(false)}
                      className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {importDone && (
                <div className="rounded-xl bg-secondary-container/20 border border-secondary-fixed-dim/30 px-4 py-3 flex flex-col gap-2">
                  <p className="text-sm text-secondary-fixed-dim font-medium">✓ Backup erfolgreich importiert</p>
                  <p className="text-xs text-on-surface-variant">Bitte die App jetzt beenden und manuell neu starten.</p>
                  <button onClick={() => window.db.dbConfig.quit()}
                    className="self-start mt-1 px-4 py-1.5 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600">
                    App beenden
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={handleSetDbPath} disabled={!pendingDbPath || pendingDbPath === dbPath || dbDone}
                  className="px-4 py-1.5 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                  Pfad übernehmen
                </button>
                <button onClick={handleBackupExport}
                  className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">
                  Backup exportieren…
                </button>
                <button onClick={() => setImportConfirm(true)} disabled={importConfirm}
                  className="px-4 py-1.5 text-sm rounded-lg border border-error/50 text-error hover:bg-error/10 disabled:opacity-40">
                  Backup importieren…
                </button>
                {dbMsg && <p className={`text-xs ${dbMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{dbMsg.text}</p>}
                {backupMsg && <p className={`text-xs ${backupMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{backupMsg.text}</p>}
              </div>
            </div>
            {/* Reset / Alte Daten löschen */}
            <div className="glass-card rounded-xl p-4 mb-3 border border-error/20">
              <p className="text-xs font-semibold text-error uppercase tracking-wide mb-1">Alte Daten löschen</p>
              <p className="text-xs text-on-surface-variant/70 mb-3">
                Löscht die komplette Datenbank — inklusive aller Kontakte und Aktivitäten — und startet die App neu mit einer leeren Datenbank.
              </p>
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="px-4 py-1.5 text-sm rounded-lg border border-error/50 text-error hover:bg-error/10"
                >
                  Alte Daten löschen…
                </button>
              ) : (
                <div className="rounded-xl bg-error/10 border border-error/40 px-4 py-3 flex flex-col gap-2">
                  <p className="text-sm text-on-surface font-semibold">Datenbank wirklich löschen?</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Die gesamte Datenbank wird unwiderruflich gelöscht — alle Kontakte, Aktivitäten, Termine und Einstellungen gehen verloren. Die App startet danach neu mit einer leeren Datenbank.
                  </p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={async () => {
                        setResetting(true)
                        await window.db.dbConfig.reset()
                      }}
                      disabled={resetting}
                      className="px-4 py-1.5 text-sm rounded-lg bg-error text-on-error hover:opacity-90 disabled:opacity-50"
                    >
                      {resetting ? 'Löschen…' : 'Ja, alles löschen'}
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-primary/5 rounded-xl text-xs text-primary mb-4">
              Automatisches Backup beim App-Start: <strong>userData/backups/</strong> (letzte 7 Versionen)
            </div>
          </div>
        )}

        {/* ── FancyPlan Cloud (Login & Synchronisierung) ─────────────────── */}
        <SectionHeader
          label="FancyPlan Cloud — Synchronisierung"
          open={cloudOpen}
          onToggle={() => setCloudOpen((o) => !o)}
        />
        {cloudOpen && (
          <div className="mb-2">
            {cloudStatus && !cloudStatus.configured && (
              <div className="mb-3 px-4 py-2 rounded-xl text-sm bg-surface-container-low text-on-surface-variant">
                Firebase ist noch nicht konfiguriert. Bitte zuerst unter „Firebase / Cloud Functions" Projekt-ID und Web API Key speichern.
              </div>
            )}
            {cloudStatus && (
              <div className={`mb-3 px-4 py-2 rounded-xl text-sm ${cloudStatus.loggedIn ? 'bg-secondary-container/10 text-secondary-fixed-dim' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {cloudStatus.loggedIn ? `Angemeldet als ${cloudStatus.email}` : 'Nicht angemeldet'}
              </div>
            )}

            <div className="glass-card rounded-xl p-4 mb-3 flex flex-col gap-3">
              <div><label className={lbl}>E-Mail</label>
                <input className={inp} type="email" autoComplete="username" value={cloudEmail}
                  onChange={(e) => setCloudEmail(e.target.value)}
                  placeholder="nutzer@example.com" />
              </div>
              <div><label className={lbl}>Passwort</label>
                <input className={inp} type="password" autoComplete="current-password" value={cloudPassword}
                  onChange={(e) => setCloudPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && cloudEmail && cloudPassword) handleCloudLogin() }}
                  placeholder="••••••••" />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {cloudStatus?.loggedIn ? (
                  <>
                    <button onClick={handleCloudSync} disabled={cloudSyncing}
                      className="px-5 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] leading-none">sync</span>
                      {cloudSyncing ? 'Synchronisiere…' : 'Jetzt synchronisieren'}
                    </button>
                    <button onClick={handleCloudLogout} disabled={cloudSyncing}
                      className="px-4 py-2 text-sm rounded-lg border border-error/40 text-error hover:bg-error-container/10 disabled:opacity-40">
                      Abmelden
                    </button>
                  </>
                ) : (
                  <button onClick={handleCloudLogin} disabled={cloudLoggingIn || !cloudEmail || !cloudPassword}
                    className="px-5 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                    {cloudLoggingIn ? 'Anmelden…' : 'Anmelden'}
                  </button>
                )}
                {cloudMsg && <p className={`text-xs ${cloudMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{cloudMsg.text}</p>}
              </div>
            </div>

            <div className="px-4 py-2.5 bg-primary/5 rounded-xl text-xs text-primary mb-4">
              Aktivitäten, FCM-Regeln und Stammdaten werden mit FancyPlan Cloud abgeglichen (PC ist führend). Änderungen vom Handy werden dabei zurückgeholt.
            </div>
          </div>
        )}

        {/* ── Firebase / Cloud Functions ─────────────────────────────────── */}
        <SectionHeader
          label="Firebase / Cloud Functions"
          open={firebaseOpen}
          onToggle={() => setFirebaseOpen((o) => !o)}
        />
        {firebaseOpen && (
          <div className="mb-2">
            <div className="glass-card rounded-xl p-4 mb-3 flex flex-col gap-3">
              <div><label className={lbl}>Project ID</label>
                <input className={inp} value={firebase.firebase_project_id}
                  onChange={(e) => setF('firebase_project_id', e.target.value)}
                  placeholder="fancyplan-xxxxx" />
              </div>
              <div><label className={lbl}>Web API Key</label>
                <input className={inp} value={firebase.firebase_api_key}
                  onChange={(e) => setF('firebase_api_key', e.target.value)}
                  placeholder="AIzaSy…" />
              </div>
              <div><label className={lbl}>App ID</label>
                <input className={inp} value={firebase.firebase_app_id}
                  onChange={(e) => setF('firebase_app_id', e.target.value)}
                  placeholder="1:123456789:web:abc…" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSaveFirebase} disabled={savingFirebase}
                  className="px-4 py-1.5 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                  {savingFirebase ? t('settings.saving') : t('settings.saveAll')}
                </button>
                {firebaseMsg && <p className={`text-xs ${firebaseMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{firebaseMsg.text}</p>}
              </div>
            </div>
            <div className="px-4 py-2.5 bg-primary/5 rounded-xl text-xs text-primary mb-4">
              <strong>Vorbereitung für L11-06/07:</strong> Aktivitäten und Mails über Firebase Cloud Functions versenden und empfangen.
              Konfiguration jetzt speichern — Integration folgt in einer späteren Phase.
            </div>
          </div>
        )}

        {/* ── Mail — IMAP / SMTP ────────────────────────────────────────── */}
        <SectionHeader
          label={t('settings.mail')}
          open={mailOpen}
          onToggle={() => setMailOpen((o) => !o)}
        />
        {mailOpen && (
          <div className="mb-2">
            {mailStatus && (
              <div className={`mb-3 px-4 py-2 rounded-xl text-sm ${mailStatus.configured ? 'bg-secondary-container/10 text-secondary-fixed-dim' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {mailStatus.configured ? t('settings.mailConfigured', { email: mailStatus.email }) : t('settings.mailNotConfigured')}
              </div>
            )}
            <div className="flex gap-2 mb-3">
              <span className="text-xs text-on-surface-variant/60 self-center">{t('common.preset')}</span>
              <button onClick={() => applyMailPreset(GMAIL_MAIL)} className="px-3 py-1 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">Gmail</button>
              <button onClick={() => applyMailPreset(OUTLOOK_MAIL)} className="px-3 py-1 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">Outlook / M365</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-3">{t('settings.imap')}</p>
                <div className="flex flex-col gap-2.5">
                  <div><label className={lbl}>{t('common.server')}</label><input className={inp} value={mail.mail_imap_host} onChange={(e) => setM('mail_imap_host', e.target.value)} placeholder="imap.gmail.com" /></div>
                  <div><label className={lbl}>{t('common.port')}</label><input className={inp} value={mail.mail_imap_port} onChange={(e) => setM('mail_imap_port', e.target.value)} placeholder="993" /></div>
                  <div><label className={lbl}>{t('common.username')}</label><input className={inp} value={mail.mail_imap_user} onChange={(e) => setM('mail_imap_user', e.target.value)} placeholder="nutzer@gmail.com" /></div>
                  <div><label className={lbl}>{t('common.password')}</label><input type="password" className={inp} value={mail.mail_imap_password} onChange={(e) => setM('mail_imap_password', e.target.value)} placeholder="xxxx xxxx xxxx xxxx" /></div>
                  <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
                    <input type="checkbox" checked={mail.mail_imap_tls !== '0'} onChange={(e) => setM('mail_imap_tls', e.target.checked ? '1' : '0')} />
                    {t('settings.ssl')}
                  </label>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-3">{t('settings.smtp')}</p>
                <div className="flex flex-col gap-2.5">
                  <div><label className={lbl}>{t('common.server')}</label><input className={inp} value={mail.mail_smtp_host} onChange={(e) => setM('mail_smtp_host', e.target.value)} placeholder="smtp.gmail.com" /></div>
                  <div><label className={lbl}>{t('common.port')}</label><input className={inp} value={mail.mail_smtp_port} onChange={(e) => setM('mail_smtp_port', e.target.value)} placeholder="587" /></div>
                  <div><label className={lbl}>{t('common.username')}</label><input className={inp} value={mail.mail_smtp_user} onChange={(e) => setM('mail_smtp_user', e.target.value)} placeholder="nutzer@gmail.com" /></div>
                  <div><label className={lbl}>{t('common.password')}</label><input type="password" className={inp} value={mail.mail_smtp_password} onChange={(e) => setM('mail_smtp_password', e.target.value)} placeholder="xxxx xxxx xxxx xxxx" /></div>
                  <div><label className={lbl}>{t('settings.senderName')}</label><input className={inp} value={mail.mail_from_name} onChange={(e) => setM('mail_from_name', e.target.value)} placeholder="Max Mustermann" /></div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 bg-primary/5 rounded-xl text-xs text-primary mb-4">
              <strong>Gmail App-Passwort:</strong> {t('settings.gmailHint')}
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button onClick={handleSaveMail} disabled={savingMail}
                className="px-5 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                {savingMail ? t('settings.saving') : t('settings.saveAll')}
              </button>
              <button onClick={handleTestMail} disabled={testingMail}
                className="px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high disabled:opacity-40">
                {testingMail ? t('settings.testing') : t('settings.testMail')}
              </button>
              {mailMsg && <p className={`text-xs ${mailMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{mailMsg.text}</p>}
            </div>
          </div>
        )}

        {/* ── Kalender ──────────────────────────────────────────────────── */}
        <SectionHeader
          label={t('settings.calendar')}
          open={calOpen}
          onToggle={() => setCalOpen((o) => !o)}
        />
        {calOpen && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">CalDAV</p>
            {calStatus && (
              <div className={`mb-3 px-4 py-2 rounded-xl text-sm ${calStatus.configured ? 'bg-secondary-container/10 text-secondary-fixed-dim' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {calStatus.configured ? t('settings.calConfigured', { user: calStatus.user }) : t('settings.calNotConfigured')}
              </div>
            )}
            <div className="flex gap-2 mb-3">
              <span className="text-xs text-on-surface-variant/60 self-center">{t('common.preset')}</span>
              <button onClick={() => setCal((p) => ({ ...p, ...ICLOUD_CAL }))} className="px-3 py-1 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">iCloud</button>
              <button onClick={() => setCal((p) => ({ ...p, ...NEXTCLOUD_CAL }))} className="px-3 py-1 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">Nextcloud</button>
            </div>
            <div className="glass-card rounded-xl p-4 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className={lbl}>{t('settings.caldavUrl')}</label><input className={inp} value={cal.cal_caldav_url} onChange={(e) => setC('cal_caldav_url', e.target.value)} placeholder="https://caldav.icloud.com" /></div>
                <div><label className={lbl}>{t('common.username')}</label><input className={inp} value={cal.cal_user} onChange={(e) => setC('cal_user', e.target.value)} placeholder="nutzer@icloud.com" /></div>
                <div><label className={lbl}>{t('common.password')}</label><input type="password" className={inp} value={cal.cal_password} onChange={(e) => setC('cal_password', e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" /></div>
                <div><label className={lbl}>{t('settings.calendarName')}</label><input className={inp} value={cal.cal_calendar_name} onChange={(e) => setC('cal_calendar_name', e.target.value)} placeholder={t('settings.calendarNamePh')} /></div>
              </div>
            </div>
            <div className="px-4 py-2.5 bg-primary/5 rounded-xl text-xs text-primary mb-5">
              <strong>iCloud:</strong> {t('settings.icloudHint')}
            </div>

            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">{t('settings.gcal')}</p>
            {gcalStatus && (
              <div className={`mb-3 px-4 py-2 rounded-xl text-sm ${gcalStatus.configured ? 'bg-secondary-container/10 text-secondary-fixed-dim' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {gcalStatus.configured ? t('settings.gcalConnected', { email: gcalStatus.email }) : t('settings.gcalNotConnected')}
              </div>
            )}
            <div className="glass-card rounded-xl p-4 mb-3">
              <div className="flex flex-col gap-3">
                <div><label className={lbl}>{t('settings.clientId')}</label>
                  <input className={inp} value={gcal.gcal_client_id}
                    onChange={(e) => setG('gcal_client_id', e.target.value)}
                    placeholder="123456789-abc.apps.googleusercontent.com" />
                </div>
                <div><label className={lbl}>{t('settings.clientSecret')}</label>
                  <input type="password" className={inp} value={gcal.gcal_client_secret}
                    onChange={(e) => setG('gcal_client_secret', e.target.value)}
                    placeholder="GOCSPX-…" />
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 bg-primary/5 rounded-xl text-xs text-primary mb-3">
              <strong>{t('settings.gcalHint1')}</strong> → Anmeldedaten → OAuth 2.0-Client-IDs → Anwendungstyp: <strong>{t('settings.gcalHintDesktop')}</strong> {t('settings.gcalHint2')}
              <br/><strong>{t('settings.gcalTestingMode')}</strong> {t('settings.gcalTestingHint')}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {gcalStatus?.configured ? (
                <>
                  <button onClick={handleGcalSync} disabled={connectingGcal}
                    className="px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high disabled:opacity-40">
                    {connectingGcal ? t('settings.syncing') : t('settings.sync')}
                  </button>
                  <button onClick={handleGcalDisconnect}
                    className="px-4 py-2 text-sm rounded-lg border border-error/40 text-error hover:bg-error-container/10">
                    {t('settings.disconnect')}
                  </button>
                </>
              ) : (
                <button onClick={handleGcalConnect} disabled={connectingGcal || !gcal.gcal_client_id || !gcal.gcal_client_secret}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                  {connectingGcal ? t('settings.waitBrowser') : t('settings.connectGcal')}
                </button>
              )}
              {gcalMsg && <p className={`text-xs ${gcalMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{gcalMsg.text}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button onClick={handleSaveCal} disabled={savingCal}
                className="px-5 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                {savingCal ? t('settings.saving') : t('settings.saveAll')}
              </button>
              <button onClick={handleTestCal} disabled={testingCal}
                className="px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high disabled:opacity-40">
                {testingCal ? t('settings.testing') : t('settings.testCal')}
              </button>
              {calMsg && <p className={`text-xs ${calMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{calMsg.text}</p>}
            </div>
          </div>
        )}

        {/* ── Branding ──────────────────────────────────────────────────── */}
        <SectionHeader
          label={t('settings.branding')}
          open={brandOpen}
          onToggle={() => setBrandOpen((o) => !o)}
        />
        {brandOpen && (
          <div className="mb-2">
            {!isVip && (
              <div className="mb-3 px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface-variant">
                {t('settings.brandingVipHint')}
              </div>
            )}
            <div className={`${!isVip ? 'opacity-50 pointer-events-none select-none' : ''}`}>
              <div className="glass-card rounded-xl p-4 mb-3">
                <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-3">{t('settings.brandingAppName')}</p>
                <input
                  className={inp}
                  value={brandAppName}
                  onChange={(e) => setBrandAppName(e.target.value)}
                  placeholder="FancyPlan"
                />
              </div>

              <div className="glass-card rounded-xl p-4 mb-3">
                <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-3">{t('settings.brandingLogo')}</p>

                <div className="grid grid-cols-6 gap-2 mb-4">
                  {BRAND_ICONS.map((ic) => (
                    <button
                      key={ic.key}
                      onClick={() => { setBrandLogoKey(ic.key); setBrandLogoData('') }}
                      title={ic.label}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${!brandLogoData && brandLogoKey === ic.key ? 'border-primary bg-primary/10' : 'border-outline-variant/40 hover:bg-surface-container-high'}`}
                    >
                      <img src={`${import.meta.env.BASE_URL}brand-icons/${ic.key}.png`} alt={ic.label} className="h-10 w-10 object-contain" draggable={false} />
                      <span className="text-[9px] text-on-surface-variant leading-tight text-center">{ic.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={handleBrowseCustomLogo}
                    className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">
                    {t('settings.brandingCustom')}
                  </button>
                  {brandLogoData && (
                    <>
                      <img src={brandLogoData} alt="custom" className="h-10 w-10 object-contain rounded border border-primary" />
                      <button onClick={() => setBrandLogoData('')}
                        className="px-3 py-1.5 text-xs rounded-lg border border-error/50 text-error hover:bg-error/10">
                        {t('settings.brandingRemoveCustom')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button onClick={handleSaveBrand} disabled={savingBrand}
                  className="px-5 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                  {savingBrand ? t('settings.saving') : t('settings.saveAll')}
                </button>
                {brandMsg && <p className={`text-xs ${brandMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{brandMsg.text}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Lizenz ────────────────────────────────────────────────────── */}
        <SectionHeader
          label="Lizenz"
          open={licenseOpen}
          onToggle={() => setLicenseOpen((o) => !o)}
        />
        {licenseOpen && (
          <div className="mb-2">
            <div className="glass-card rounded-xl p-4 flex items-center justify-between mb-4">
              <p className="text-sm text-on-surface-variant">Lizenz aktivieren oder Lizenzstatus prüfen</p>
              <button
                onClick={onLicense}
                className="px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high"
              >
                Lizenz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

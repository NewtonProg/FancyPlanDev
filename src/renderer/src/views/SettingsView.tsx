import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const inp = 'w-full text-sm border border-outline-variant rounded-lg px-3 py-1.5 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/40'
const lbl = 'text-xs text-on-surface-variant/60 mb-1 block'

type CalCfg = {
  cal_caldav_url: string; cal_user: string; cal_password: string; cal_calendar_name: string
}
type GCalCfg = { gcal_client_id: string; gcal_client_secret: string }
type FirebaseCfg = { firebase_project_id: string; firebase_api_key: string; firebase_app_id: string }
type ImportResult = { canceled?: boolean; success?: boolean; counts?: Record<string, number>; errors?: string[] }
type ImportState = 'idle' | 'running' | 'done' | 'error'
type JsonState = 'idle' | 'running' | 'done' | 'error'

const ICLOUD_CAL: Partial<CalCfg> = { cal_caldav_url: 'https://caldav.icloud.com' }
const NEXTCLOUD_CAL: Partial<CalCfg> = { cal_caldav_url: 'https://DEINE-NEXTCLOUD/remote.php/dav/calendars/USER/' }

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

  // SubForm open/close
  const [calOpen, setCalOpen] = useState(false)
  const [licenseOpen, setLicenseOpen] = useState(false)
  const [dbOpen, setDbOpen] = useState(false)
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
      window.db.settings.getAll('cal_'),
      window.db.settings.getAll('gcal_'),
      window.db.settings.getAll('firebase_')
    ]).then(([c, g, f]) => {
      setCal((p) => ({ ...p, ...c }))
      setGcal((p) => ({ ...p, gcal_client_id: g.gcal_client_id ?? '', gcal_client_secret: g.gcal_client_secret ?? '' }))
      setFirebase((p) => ({ ...p, firebase_project_id: f.firebase_project_id ?? '', firebase_api_key: f.firebase_api_key ?? '', firebase_app_id: f.firebase_app_id ?? '' }))
    })
    window.db.cal.authStatus().then(setCalStatus)
    window.db.gcal.authStatus().then(setGcalStatus)
    loadDbPath()
  }, [loadDbPath])

  useEffect(() => {
    window.db.update.status().then(setUpdateEvt)
    const unsub = window.db.update.onEvent(setUpdateEvt)
    return unsub
  }, [])

  const setC = (k: keyof CalCfg, v: string): void => setCal((p) => ({ ...p, [k]: v }))
  const setG = (k: keyof GCalCfg, v: string): void => setGcal((p) => ({ ...p, [k]: v }))
  const setF = (k: keyof FirebaseCfg, v: string): void => setFirebase((p) => ({ ...p, [k]: v }))

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

              <div className="flex items-center gap-3">
                <button onClick={handleSetDbPath} disabled={!pendingDbPath || pendingDbPath === dbPath || dbDone}
                  className="px-4 py-1.5 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                  Pfad übernehmen
                </button>
                <button onClick={handleBackupExport}
                  className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">
                  Backup exportieren…
                </button>
                {dbMsg && <p className={`text-xs ${dbMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{dbMsg.text}</p>}
                {backupMsg && <p className={`text-xs ${backupMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{backupMsg.text}</p>}
              </div>
            </div>
            <div className="px-4 py-2.5 bg-primary/5 rounded-xl text-xs text-primary mb-4">
              Automatisches Backup beim App-Start: <strong>userData/backups/</strong> (letzte 7 Versionen)
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
                    {t('import.completed', { count: importTotal.toLocaleString('de') })}
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      {Object.entries(importResult.counts ?? {}).map(([tbl, cnt]) => (
                        <tr key={tbl} className="border-t border-secondary-container/20">
                          <td className="py-0.5 text-secondary-fixed-dim">{tbl}</td>
                          <td className="py-0.5 text-right text-secondary-fixed-dim">{cnt.toLocaleString('de')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <span className="text-xs text-on-surface-variant/70">Version <strong className="text-on-surface">0.1.0</strong></span>
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
      </div>
    </div>
  )
}

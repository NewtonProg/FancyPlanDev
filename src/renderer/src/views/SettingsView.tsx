import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const inp = 'w-full text-sm border border-outline-variant rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40'
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

export default function SettingsView(): JSX.Element {
  const { t } = useTranslation()
  const [mail, setMail] = useState<MailCfg>({
    mail_imap_host: '', mail_imap_port: '993', mail_imap_user: '',
    mail_imap_password: '', mail_imap_tls: '1',
    mail_smtp_host: '', mail_smtp_port: '587',
    mail_smtp_user: '', mail_smtp_password: '', mail_from_name: ''
  })
  const [cal, setCal] = useState<CalCfg>({ cal_caldav_url: '', cal_user: '', cal_password: '', cal_calendar_name: '' })
  const [gcal, setGcal] = useState<GCalCfg>({ gcal_client_id: '', gcal_client_secret: '' })
  const [saving, setSaving] = useState(false)
  const [testingMail, setTestingMail] = useState(false)
  const [testingCal, setTestingCal] = useState(false)
  const [connectingGcal, setConnectingGcal] = useState(false)
  const [mailStatus, setMailStatus] = useState<{ configured: boolean; email: string } | null>(null)
  const [calStatus, setCalStatus] = useState<{ configured: boolean; user: string } | null>(null)
  const [gcalStatus, setGcalStatus] = useState<{ configured: boolean; email: string } | null>(null)
  const [mailMsg, setMailMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [calMsg, setCalMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [gcalMsg, setGcalMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    Promise.all([
      window.db.settings.getAll('mail_'),
      window.db.settings.getAll('cal_'),
      window.db.settings.getAll('gcal_')
    ]).then(([m, c, g]) => {
      setMail((p) => ({ ...p, ...m }))
      setCal((p) => ({ ...p, ...c }))
      setGcal((p) => ({ ...p, gcal_client_id: g.gcal_client_id ?? '', gcal_client_secret: g.gcal_client_secret ?? '' }))
    })
    window.db.mail.authStatus().then(setMailStatus)
    window.db.cal.authStatus().then(setCalStatus)
    window.db.gcal.authStatus().then(setGcalStatus)
  }, [])

  const setM = (k: keyof MailCfg, v: string): void => setMail((p) => ({ ...p, [k]: v }))
  const setC = (k: keyof CalCfg, v: string): void => setCal((p) => ({ ...p, [k]: v }))
  const setG = (k: keyof GCalCfg, v: string): void => setGcal((p) => ({ ...p, [k]: v }))

  const applyMailPreset = (preset: MailCfg): void =>
    setMail((p) => ({ ...preset, mail_imap_user: p.mail_imap_user, mail_imap_password: p.mail_imap_password, mail_smtp_user: p.mail_imap_user, mail_smtp_password: p.mail_imap_password, mail_from_name: p.mail_from_name }))

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    for (const [k, v] of Object.entries({ ...mail, ...cal, ...gcal })) {
      await window.db.settings.set(k, (v as string) || null)
    }
    setSaving(false)
    window.db.mail.authStatus().then(setMailStatus)
    window.db.cal.authStatus().then(setCalStatus)
    window.db.gcal.authStatus().then(setGcalStatus)
    setMailMsg({ text: t('settings.saved'), ok: true })
    setTimeout(() => setMailMsg(null), 3000)
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

  const handleTestMail = async (): Promise<void> => {
    setTestingMail(true); setMailMsg(null)
    const r = await window.db.mail.configTest()
    setTestingMail(false)
    setMailMsg(r.ok
      ? { text: t('settings.connected'), ok: true }
      : { text: t('common.error', { msg: r.error }), ok: false })
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

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 overflow-y-auto h-full">
      <h2 className="text-xl font-semibold text-on-surface mb-6">{t('settings.title')}</h2>

      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">{t('settings.mail')}</p>

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

      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2 mt-6">{t('settings.calendar')}</p>

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

      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2 mt-6">{t('settings.gcal')}</p>

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
      <div className="flex flex-wrap items-center gap-2 mb-6">
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

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
          {saving ? t('settings.saving') : t('settings.saveAll')}
        </button>
        <button onClick={handleTestMail} disabled={testingMail}
          className="px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high disabled:opacity-40">
          {testingMail ? t('settings.testing') : t('settings.testMail')}
        </button>
        <button onClick={handleTestCal} disabled={testingCal}
          className="px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high disabled:opacity-40">
          {testingCal ? t('settings.testing') : t('settings.testCal')}
        </button>
        <div className="flex flex-col gap-0.5">
          {mailMsg && <p className={`text-xs ${mailMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{mailMsg.text}</p>}
          {calMsg && <p className={`text-xs ${calMsg.ok ? 'text-secondary-fixed-dim' : 'text-error'}`}>{calMsg.text}</p>}
        </div>
      </div>
    </div>
  )
}

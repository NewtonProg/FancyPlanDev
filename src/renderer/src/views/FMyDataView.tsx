import { useEffect, useState, useCallback } from 'react'
import LinkPanel from '../components/LinkPanel'

type MyDataRow = {
  id: number
  category: string
  label: string
  fields: Record<string, string>
  sort_order: number
}

const CATEGORIES: Record<string, { label: string; fields: string[] }> = {
  password:     { label: 'Passwort / Login',      fields: ['Benutzername', 'E-Mail', 'Passwort', 'Login-URL', '2FA-Secret', 'Backup-Codes', 'Recovery-Mail', 'Telefonnummer', 'OAuth-Typ', 'Notizen'] },
  banking:      { label: 'Bankkonto',             fields: ['Bankname', 'Kontoinhaber', 'IBAN', 'BIC', 'Kontonummer', 'BLZ', 'Land', 'Online-Banking-URL', 'PIN', 'TAN-Verfahren', 'Hotline', 'Notizen'] },
  credit_card:  { label: 'Kreditkarte',           fields: ['Kartenanbieter', 'Kartenname', 'Kartennummer', 'Ablaufdatum', 'CVC', 'Karteninhaber', 'PIN', 'Bank', 'Limit', 'Notizen'] },
  license:      { label: 'Lizenz / Software-Key', fields: ['Produktname', 'Hersteller', 'Lizenzschlüssel', 'Lizenztyp', 'Ablaufdatum', 'Download-Link', 'Kundenkonto', 'Rechnungsnummer', 'Notizen'] },
  api:          { label: 'API / Developer',       fields: ['Anbieter', 'API-Key', 'Secret', 'Client-ID', 'Client-Secret', 'Tenant-ID', 'Project-ID', 'Endpoint', 'Region', 'OAuth-URL', 'Webhook-URL', 'Environment', 'Notizen'] },
  server:       { label: 'Server / Hosting',      fields: ['Hostname', 'IP-Adresse', 'SSH-Port', 'Benutzername', 'Passwort', 'SSH-Key', 'Provider', 'Domain', 'cPanel-URL', 'Notizen'] },
  domain:       { label: 'Domain / DNS',          fields: ['Domainname', 'Registrar', 'Nameserver', 'Ablaufdatum', 'Transfer-Code', 'SSL-Zertifikat', 'WHOIS-Mail', 'Notizen'] },
  email_account:{ label: 'E-Mail-Konto',          fields: ['E-Mail-Adresse', 'SMTP-Server', 'IMAP-Server', 'POP3-Server', 'Ports', 'Benutzername', 'Passwort', 'Alias-Adressen', 'Recovery-Mail', 'Notizen'] },
  social:       { label: 'Social Media',          fields: ['Plattform', 'Handle', 'Profil-URL', 'Benutzername', 'Passwort', 'Verknüpfte Mail', 'Verknüpfte Tel.', 'Creator-ID', 'Notizen'] },
  identity:     { label: 'Dokumente / Identität', fields: ['Dokumenttyp', 'Nummer', 'Ausstellungsdatum', 'Ablaufdatum', 'Land', 'Behörde', 'PIN', 'Notfallkontakt', 'Notizen'] },
  crypto:       { label: 'Krypto / Wallet',       fields: ['Wallet-Typ', 'Public-Address', 'Seed-Phrase', 'Privater-Schlüssel', 'Netzwerk', 'Börse', 'Hardware-Wallet', 'Notizen'] },
  wifi:         { label: 'WLAN / Netzwerk',       fields: ['SSID', 'Passwort', 'Verschlüsselung', 'Router-IP', 'Admin-Login', 'Admin-Passwort', 'Provider', 'Notizen'] },
  note:         { label: 'Secure Notes',          fields: ['Notizen'] },
  link:         { label: 'Links',                 fields: ['Bezeichnung'] },
  other:        { label: 'Sonstiges',             fields: ['Bezeichnung', 'Wert', 'Notizen'] },
}

const SECRET_FIELDS = new Set([
  'Passwort', 'PIN', 'CVV', 'CVC', 'Lizenzschlüssel', 'IBAN',
  '2FA-Secret', 'Backup-Codes', 'API-Key', 'Secret', 'Client-Secret',
  'SSH-Key', 'Privater-Schlüssel', 'Seed-Phrase', 'Kartennummer',
  'Transfer-Code', 'Admin-Passwort',
])
const NOTES_FIELDS  = new Set(['Notizen', 'Notizen2'])

const inp = 'w-full text-sm border border-outline-variant rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 bg-surface-container text-on-surface'
const lbl = 'text-xs text-on-surface-variant/60 mb-0.5 block'

function catLabel(cat: string): string {
  return CATEGORIES[cat]?.label ?? cat
}

// ── Auto-wachsende Textarea ────────────────────────────────────────────────

function AutoTextarea({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}): JSX.Element {
  function adjust(el: HTMLTextAreaElement): void {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  return (
    <textarea
      value={value}
      rows={2}
      placeholder={placeholder}
      className={`${className} resize-none overflow-hidden`}
      onChange={(e) => { onChange(e.target.value); adjust(e.currentTarget) }}
      onFocus={(e) => adjust(e.currentTarget)}
    />
  )
}

// ── Passwort-Eingabe (Setup / Unlock) ─────────────────────────────────────

function LockScreen({ isSetup, onDone, onReset }: { isSetup: boolean; onDone: () => void; onReset: () => void }): JSX.Element {
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  async function handleSubmit(): Promise<void> {
    setErr('')
    if (!pwd) { setErr('Bitte Passwort eingeben'); return }
    if (!isSetup && pwd.length < 6) { setErr('Mindestens 6 Zeichen'); return }
    if (!isSetup && pwd !== pwd2) { setErr('Passwörter stimmen nicht überein'); return }
    setBusy(true)
    const r = isSetup
      ? await window.db.mydata.unlock(pwd)
      : await window.db.mydata.setup(pwd)
    setBusy(false)
    if (r.ok) { onDone() }
    else { setErr('Falsches Passwort') }
  }

  async function handleReset(): Promise<void> {
    await window.db.mydata.reset()
    onReset()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="glass-card rounded-2xl p-10 w-96 flex flex-col gap-5">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-semibold text-on-surface">
            {isSetup ? 'Meine Daten entsperren' : 'Masterpasswort festlegen'}
          </h2>
          <p className="text-sm text-on-surface-variant/60 mt-1">
            {isSetup
              ? 'Passwort eingeben um fortzufahren'
              : 'Dieses Passwort verschlüsselt alle sensiblen Daten. Nicht verlierbar!'}
          </p>
        </div>

        {!showResetConfirm ? (
          <>
            <div className="flex flex-col gap-2">
              <input
                type="password" value={pwd} autoFocus
                onChange={(e) => setPwd(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Masterpasswort"
                className={inp}
              />
              {!isSetup && (
                <input
                  type="password" value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Passwort wiederholen"
                  className={inp}
                />
              )}
            </div>
            {err && <p className="text-sm text-error">{err}</p>}
            <button onClick={handleSubmit} disabled={busy}
              className="w-full py-2.5 rounded-lg bg-primary text-on-primary text-base hover:bg-blue-600 disabled:opacity-40">
              {busy ? '…' : isSetup ? 'Entsperren' : 'Passwort festlegen'}
            </button>
            {isSetup && (
              <button onClick={() => setShowResetConfirm(true)}
                className="text-sm text-on-surface-variant/50 hover:text-error underline underline-offset-2 text-center">
                Passwort vergessen?
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-error/10 border border-error/30 p-4 text-sm text-on-surface">
              <p className="font-semibold text-error mb-1">⚠️ Achtung — Datenverlust!</p>
              <p className="text-on-surface-variant/80">
                Das Masterpasswort kann nicht zurückgesetzt werden. Wenn du fortfährst, werden
                <span className="font-semibold text-error"> alle gespeicherten Einträge unwiderruflich gelöscht</span>.
                Danach kannst du ein neues Passwort festlegen.
              </p>
            </div>
            <button onClick={handleReset}
              className="w-full py-2.5 rounded-lg bg-error text-white text-base hover:bg-red-700">
              Alle Daten löschen & neu starten
            </button>
            <button onClick={() => setShowResetConfirm(false)}
              className="w-full py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm hover:bg-surface-container-high">
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Eintrag-Formular ───────────────────────────────────────────────────────

function EntryForm({
  initial, onSave, onCancel, onTestMail, testingMail, mailMsg
}: {
  initial?: { id?: number; category: string; label: string; fields: Record<string, string> }
  onSave: (data: { category: string; label: string; fields: Record<string, string> }) => void
  onCancel: () => void
  onTestMail?: () => void
  testingMail?: boolean
  mailMsg?: { ok: boolean; text: string } | null
}): JSX.Element {
  const [category, setCategory] = useState(initial?.category ?? 'password')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [fields, setFields] = useState<Record<string, string>>(initial?.fields ?? {})
  const [reveal, setReveal] = useState<Set<string>>(new Set())

  const fieldList = CATEGORIES[category]?.fields ?? ['Wert', 'Notizen', 'Notizen2']
  const isLink = category === 'link'

  function setField(name: string, val: string): void {
    setFields((p) => ({ ...p, [name]: val }))
  }

  function toggleReveal(name: string): void {
    setReveal((p) => { const s = new Set(p); s.has(name) ? s.delete(name) : s.add(name); return s })
  }

  const rendered = new Set<string>()

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={lbl}>Kategorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inp} cursor-pointer`}>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className={lbl}>{isLink ? 'Name / Bezeichnung' : 'Bezeichnung'}</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z.B. Gmail" className={inp} autoFocus />
        </div>
      </div>

      {isLink ? (
        <p className="text-xs text-on-surface-variant/50 italic">
          Nach dem Speichern können Links direkt in der Liste hinzugefügt werden.
        </p>
      ) : (
        fieldList.map((name) => {
          if (rendered.has(name)) return null
          rendered.add(name)

          if (name === 'Notizen') {
            const hasNotizen2 = fieldList.includes('Notizen2')
            if (hasNotizen2) rendered.add('Notizen2')
            return hasNotizen2 ? (
              <div key="notizen-pair" className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Notizen 1</label>
                  <AutoTextarea value={fields['Notizen'] ?? ''} onChange={(v) => setField('Notizen', v)} placeholder="Notizen 1" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Notizen 2</label>
                  <AutoTextarea value={fields['Notizen2'] ?? ''} onChange={(v) => setField('Notizen2', v)} placeholder="Notizen 2" className={inp} />
                </div>
              </div>
            ) : (
              <div key="notizen">
                <label className={lbl}>Notizen</label>
                <AutoTextarea value={fields['Notizen'] ?? ''} onChange={(v) => setField('Notizen', v)} placeholder="Notizen" className={inp} />
              </div>
            )
          }

          if (NOTES_FIELDS.has(name)) return null

          return (
            <div key={name}>
              <label className={lbl}>{name}</label>
              <div className="flex gap-1">
                <input
                  type={SECRET_FIELDS.has(name) && !reveal.has(name) ? 'password' : 'text'}
                  value={fields[name] ?? ''}
                  onChange={(e) => setField(name, e.target.value)}
                  placeholder={name}
                  className={`${inp} flex-1`}
                />
                {SECRET_FIELDS.has(name) && (
                  <button onClick={() => toggleReveal(name)}
                    className="px-2 text-xs text-on-surface-variant/50 hover:text-on-surface border border-outline-variant rounded-lg">
                    {reveal.has(name) ? '🙈' : '👁'}
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}

      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => onSave({ category, label, fields })} disabled={!label.trim()}
          className="px-4 py-1.5 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
          Speichern
        </button>
        <button onClick={onCancel}
          className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high">
          Abbrechen
        </button>
        {category === 'email_account' && onTestMail && (
          <button onClick={onTestMail} disabled={testingMail}
            className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40">
            {testingMail ? 'Teste…' : 'Mail Einstellungen testen'}
          </button>
        )}
        {category === 'email_account' && mailMsg && (
          <span className={`text-xs ${mailMsg.ok ? 'text-green-400' : 'text-error'}`}>
            {mailMsg.ok ? '✓' : '✗'} {mailMsg.text}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Passwort ändern ────────────────────────────────────────────────────────

function ChangePwdForm({ onDone }: { onDone: () => void }): JSX.Element {
  const [old, setOld] = useState('')
  const [nw, setNw]   = useState('')
  const [nw2, setNw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(): Promise<void> {
    setErr('')
    if (!old || !nw) { setErr('Alle Felder ausfüllen'); return }
    if (nw.length < 6) { setErr('Mindestens 6 Zeichen'); return }
    if (nw !== nw2) { setErr('Passwörter stimmen nicht überein'); return }
    setBusy(true)
    const r = await window.db.mydata.changePassword(old, nw)
    setBusy(false)
    if (r.ok) onDone()
    else setErr('Altes Passwort falsch')
  }

  return (
    <div className="glass-card rounded-xl p-5 max-w-sm flex flex-col gap-3">
      <p className="text-sm font-semibold text-on-surface">Masterpasswort ändern</p>
      <input type="password" value={old} onChange={(e) => setOld(e.target.value)} placeholder="Aktuelles Passwort" className={inp} autoFocus />
      <input type="password" value={nw}  onChange={(e) => setNw(e.target.value)}  placeholder="Neues Passwort" className={inp} />
      <input type="password" value={nw2} onChange={(e) => setNw2(e.target.value)} placeholder="Wiederholen" className={inp} />
      {err && <p className="text-xs text-error">{err}</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={busy}
          className="px-4 py-1.5 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
          {busy ? '…' : 'Ändern'}
        </button>
        <button onClick={onDone}
          className="px-4 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface-variant">
          Abbrechen
        </button>
      </div>
    </div>
  )
}

// ── Haupt-View ────────────────────────────────────────────────────────────

export default function FMyDataView(): JSX.Element {
  const [unlocked, setUnlocked]   = useState(false)
  const [isSetup, setIsSetup]     = useState(true)
  const [rows, setRows]           = useState<MyDataRow[]>([])
  const [editEntry, setEditEntry] = useState<MyDataRow | null | 'new'>(null)
  const [showChgPwd, setShowChgPwd] = useState(false)
  const [revealAll, setRevealAll] = useState<Set<number>>(new Set())
  const [catFilter, setCatFilter] = useState('all')
  const [testingMail, setTestingMail] = useState(false)
  const [mailMsg, setMailMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleTestMail(): Promise<void> {
    setTestingMail(true); setMailMsg(null)
    const r = await window.db.mail.configTest()
    setTestingMail(false)
    setMailMsg(r.ok ? { ok: true, text: 'Verbindung erfolgreich' } : { ok: false, text: r.error ?? 'Fehler' })
  }

  // Temporäre Felder — nur Session, werden beim Schließen der View gelöscht
  const [tempNote1, setTempNote1] = useState('')
  const [tempNote2, setTempNote2] = useState('')

  useEffect(() => {
    window.db.mydata.isSetup().then((setup: boolean) => setIsSetup(setup))
    window.db.mydata.isUnlocked().then((ok: boolean) => { if (ok) { setUnlocked(true); loadRows() } })
  }, [])

  const loadRows = useCallback(async () => {
    const r = await window.db.mydata.getAll()
    if (r.ok) setRows(r.rows)
  }, [])

  async function handleUnlocked(): Promise<void> {
    setUnlocked(true)
    setIsSetup(true)
    await loadRows()
  }

  async function handleSave(data: { category: string; label: string; fields: Record<string, string> }): Promise<void> {
    if (editEntry === 'new') {
      await window.db.mydata.create(data)
    } else if (editEntry) {
      await window.db.mydata.update(editEntry.id, data)
    }
    setEditEntry(null)
    await loadRows()
  }

  async function handleDelete(id: number): Promise<void> {
    if (!window.confirm('Eintrag löschen?')) return
    await window.db.mydata.delete(id)
    await loadRows()
  }

  async function handleLock(): Promise<void> {
    await window.db.mydata.lock()
    setUnlocked(false)
    setRows([])
  }

  function toggleRevealAll(id: number): void {
    setRevealAll((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  async function handleReset(): Promise<void> {
    setUnlocked(false)
    setIsSetup(false)
    setRows([])
  }

  if (!unlocked) {
    return <LockScreen isSetup={isSetup} onDone={handleUnlocked} onReset={handleReset} />
  }

  const allCats = [...new Set(rows.map((r) => r.category))]
  const filtered = catFilter === 'all' ? rows : rows.filter((r) => r.category === catFilter)

  if (editEntry !== null) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-3 border-b border-outline-variant/40 flex items-center gap-3">
          <button onClick={() => setEditEntry(null)} className="btn-secondary text-xs py-1 px-3">← Zurück</button>
          <h2 className="text-base font-semibold text-on-surface">
            {editEntry === 'new' ? 'Neuer Eintrag' : `Bearbeiten: ${editEntry.label}`}
          </h2>
        </div>
        <div className="p-6 overflow-auto flex-1">
          <EntryForm
            initial={editEntry === 'new' ? undefined : { id: editEntry.id, category: editEntry.category, label: editEntry.label, fields: editEntry.fields }}
            onSave={handleSave}
            onCancel={() => setEditEntry(null)}
            onTestMail={handleTestMail}
            testingMail={testingMail}
            mailMsg={mailMsg}
          />
        </div>
      </div>
    )
  }

  if (showChgPwd) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-3 border-b border-outline-variant/40 flex items-center gap-3">
          <button onClick={() => setShowChgPwd(false)} className="btn-secondary text-xs py-1 px-3">← Zurück</button>
        </div>
        <div className="p-6">
          <ChangePwdForm onDone={() => setShowChgPwd(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-b border-outline-variant/40 grid grid-cols-3 items-center gap-3">
        <h2 className="text-xl font-semibold text-on-surface">Meine Daten</h2>

        {/* Temporäre Notizfelder — session-only, keine DB-Speicherung */}
        <div className="flex gap-2 justify-center">
          <input
            value={tempNote1}
            onChange={(e) => setTempNote1(e.target.value)}
            placeholder="Notiz 1"
            className="flex-1 min-w-0 text-xl font-bold text-blue-400 text-center border border-outline-variant/60 rounded-lg px-3 py-1.5 bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-blue-400/40"
          />
          <input
            value={tempNote2}
            onChange={(e) => setTempNote2(e.target.value)}
            placeholder="Notiz 2"
            className="flex-1 min-w-0 text-xl font-bold text-blue-400 text-center border border-outline-variant/60 rounded-lg px-3 py-1.5 bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-blue-400/40"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditEntry('new')}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600">
            + Eintrag
          </button>
          <button onClick={() => setShowChgPwd(true)}
            className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high">
            Passwort ändern
          </button>
          <button onClick={handleLock}
            className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high">
            🔒 Sperren
          </button>
        </div>
      </div>

      {/* Kategorie-Filter */}
      {allCats.length > 1 && (
        <div className="px-6 py-2 border-b border-outline-variant/40 flex gap-1 flex-wrap">
          <button onClick={() => setCatFilter('all')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${catFilter === 'all' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}>
            Alle
          </button>
          {allCats.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${catFilter === c ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}>
              {catLabel(c)}
            </button>
          ))}
        </div>
      )}

      {/* ── Liste ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 ? (
          <div className="text-center text-on-surface-variant/50 text-sm mt-16">
            <div className="text-4xl mb-3">🔐</div>
            <p>Noch keine Einträge</p>
            <button onClick={() => setEditEntry('new')}
              className="mt-4 px-4 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600">
              Ersten Eintrag anlegen
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {filtered.map((row) => {
              const revealed = revealAll.has(row.id)
              const isLink   = row.category === 'link'

              return (
                <div key={row.id} className="glass-card rounded-xl p-4">
                  {/* Karten-Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {row.category === 'email_account' ? 'Mail' : catLabel(row.category)}
                    </span>
                    <span className="text-xl font-semibold text-on-surface flex-1">{row.label}</span>
                    {!isLink && (
                      <button onClick={() => toggleRevealAll(row.id)}
                        className="text-base text-on-surface-variant/50 hover:text-on-surface px-3 py-1 rounded border border-outline-variant/30">
                        {revealed ? '🙈 Verbergen' : '👁 Anzeigen'}
                      </button>
                    )}
                    <button onClick={() => setEditEntry(row)}
                      className="btn-secondary text-base py-1 px-3">Bearbeiten</button>
                    <button onClick={() => handleDelete(row.id)}
                      className="text-base py-1 px-3 text-error hover:bg-error-container/10 rounded">Löschen</button>
                  </div>

                  {/* LinkPanel — alle Kategorien */}
                  <LinkPanel entityType="mydata" entityId={row.id} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

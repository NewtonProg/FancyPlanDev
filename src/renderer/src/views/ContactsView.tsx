import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import FdlgCatModal from '../components/FdlgCatModal'
import LinkPanel from '../components/LinkPanel'

type Tel = Record<string, unknown>
type Row = Record<string, unknown>

type TelEmail = {
  id: number | null
  EMail: string
  bSender: number
  bFavorit: number
  bIsImap: number
  Com: string
  Pwd: string
  MailProvider: string
  sort_order: number
  _deleted?: boolean
}

type TelWeb = {
  id: number | null
  Url: string
  Com: string
  sort_order: number
  _deleted?: boolean
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const AVATAR_PALETTES = [
  { bg: 'bg-primary/20',               text: 'text-primary' },
  { bg: 'bg-secondary-container/60',   text: 'text-secondary-fixed-dim' },
  { bg: 'bg-tertiary-container/60',    text: 'text-tertiary' },
  { bg: 'bg-error/20',                 text: 'text-error' },
  { bg: 'bg-surface-container-highest',text: 'text-on-surface-variant' },
]

function avatarPalette(id: unknown): { bg: string; text: string } {
  return AVATAR_PALETTES[Number(id ?? 0) % AVATAR_PALETTES.length]
}

function initials(first: unknown, last: unknown): string {
  const f = String(first ?? '').trim()[0] ?? ''
  const l = String(last ?? '').trim()[0] ?? ''
  return (f + l).toUpperCase() || '?'
}

function fullName(c: Tel): string {
  return [c.FirstName, c.SurName].filter(Boolean).map(String).join(' ') || String(c.Company ?? '—')
}

const inp = 'w-full text-sm border border-outline-variant rounded-lg px-2.5 py-1.5 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/40'
const inpLight = 'w-full text-sm border border-outline-variant rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 text-gray-800 placeholder-gray-500'
const nameInp = 'w-full text-xl font-semibold border border-outline-variant rounded-lg px-2.5 py-1.5 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-primary placeholder-on-surface-variant/40'
const lbl = 'text-xs text-on-surface-variant/60 mb-0.5 block'

function FormRow({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-start gap-2">
      <label className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 pt-1.5 text-right">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function SectionTitle({ label }: { label: string }): JSX.Element {
  return (
    <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2 mt-3">
      {label}
    </p>
  )
}

function ContactDetail({
  contact,
  cats,
  onSaved,
  onDeleted
}: {
  contact: Tel
  cats: Row[]
  onSaved: (updated: Tel) => void
  onDeleted: (id: number) => void
}): JSX.Element {
  const { t } = useTranslation()
  const [form, setForm] = useState<Tel>({ ...contact })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)

  const [activeTab, setActiveTab] = useState<'general' | 'address' | 'contact' | 'web' | 'activities'>('general')

  const [linkedActs, setLinkedActs] = useState<Row[]>([])
  const [actSearch, setActSearch] = useState('')
  const [actResults, setActResults] = useState<Row[]>([])
  const actSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [emails, setEmails] = useState<TelEmail[]>([])
  const [showCbx, setShowCbx] = useState(false)
  const [emailsExpanded, setEmailsExpanded] = useState(false)

  const [webs, setWebs] = useState<TelWeb[]>([])
  const [websExpanded, setWebsExpanded] = useState(false)

  useEffect(() => {
    setForm({ ...contact })
    setDirty(false)
    setEmailsExpanded(false)
    setWebsExpanded(false)
    if (contact.id) {
      window.db.acttel.getByTel(contact.id as number).then((rows) =>
        setLinkedActs(rows as Row[])
      )
      window.db.ttelmail.getByTel(contact.id as number).then((rawMails: unknown) => {
        setEmails((rawMails as Row[]).map((r) => ({
          id: r.id as number,
          EMail: String(r.EMail ?? ''),
          bSender: Number(r.bSender ?? 0),
          bFavorit: Number(r.bFavorit ?? 0),
          bIsImap: Number(r.bIsImap ?? 0),
          Com: String(r.Com ?? ''),
          Pwd: String(r.Pwd ?? ''),
          MailProvider: String(r.MailProvider ?? ''),
          sort_order: Number(r.sort_order ?? 0),
        })))
      })
      window.db.ttelweb.getByTel(contact.id as number).then((rawWebs: unknown) => {
        setWebs((rawWebs as Row[]).map((r) => ({
          id: r.id as number,
          Url: String(r.Url ?? ''),
          Com: String(r.Com ?? ''),
          sort_order: Number(r.sort_order ?? 0),
        })))
      })
    }
  }, [contact])

  const set = (key: string, val: unknown): void => {
    setForm((p) => ({ ...p, [key]: val }))
    setDirty(true)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    const { id, created_at, updated_at, ...data } = form
    await window.db.tel.update(id as number, data)

    const telId = id as number
    for (const e of emails) {
      if (e._deleted) {
        if (e.id !== null) await window.db.ttelmail.delete(e.id)
      } else if (e.id === null) {
        await window.db.ttelmail.create({ tel_id: telId, EMail: e.EMail, bSender: e.bSender, bFavorit: e.bFavorit, bIsImap: e.bIsImap, Com: e.Com, Pwd: e.Pwd, MailProvider: e.MailProvider, sort_order: e.sort_order })
      } else {
        await window.db.ttelmail.update(e.id, { EMail: e.EMail, bSender: e.bSender, bFavorit: e.bFavorit, bIsImap: e.bIsImap, Com: e.Com, Pwd: e.Pwd, MailProvider: e.MailProvider, sort_order: e.sort_order })
      }
    }
    setEmails((prev) => prev.filter((e) => !e._deleted).map((e, i) => ({ ...e, sort_order: i })))

    for (const w of webs) {
      if (w._deleted) {
        if (w.id !== null) await window.db.ttelweb.delete(w.id)
      } else if (w.id === null) {
        await window.db.ttelweb.create({ tel_id: telId, Url: w.Url, Com: w.Com, sort_order: w.sort_order })
      } else {
        await window.db.ttelweb.update(w.id, { Url: w.Url, Com: w.Com, sort_order: w.sort_order })
      }
    }
    setWebs((prev) => prev.filter((w) => !w._deleted).map((w, i) => ({ ...w, sort_order: i })))

    onSaved({ ...form })
    setSaving(false)
    setDirty(false)
  }

  const addEmail = (): void => {
    const order = emails.filter((e) => !e._deleted).length
    setEmails((prev) => [...prev, { id: null, EMail: '', bSender: 0, bFavorit: 0, bIsImap: 0, Com: '', Pwd: '', MailProvider: '', sort_order: order }])
    setDirty(true)
  }

  const updateEmail = (idx: number, field: keyof TelEmail, val: unknown): void => {
    setEmails((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e))
    setDirty(true)
  }

  const removeEmail = (idx: number): void => {
    setEmails((prev) => prev.map((e, i) => i === idx ? { ...e, _deleted: true } : e))
    setDirty(true)
  }

  const addWeb = (): void => {
    const order = webs.filter((w) => !w._deleted).length
    setWebs((prev) => [...prev, { id: null, Url: '', Com: '', sort_order: order }])
    setDirty(true)
  }

  const updateWeb = (idx: number, field: keyof TelWeb, val: unknown): void => {
    setWebs((prev) => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w))
    setDirty(true)
  }

  const removeWeb = (idx: number): void => {
    setWebs((prev) => prev.map((w, i) => i === idx ? { ...w, _deleted: true } : w))
    setDirty(true)
  }

  const handleDelete = async (): Promise<void> => {
    if (!confirm(t('contacts.deleteConfirm', { name: fullName(form) }))) return
    await window.db.tel.delete(form.id as number)
    onDeleted(form.id as number)
  }

  const searchActs = useCallback((q: string) => {
    if (actSearchRef.current) clearTimeout(actSearchRef.current)
    if (!q.trim()) { setActResults([]); return }
    actSearchRef.current = setTimeout(async () => {
      const rows = await window.db.act.getAll({ search: q })
      const existing = new Set(linkedActs.map((a) => Number(a.id)))
      setActResults((rows as Row[]).filter((r) => !existing.has(Number(r.id))).slice(0, 8))
    }, 250)
  }, [linkedActs])

  const addActLink = async (act: Row): Promise<void> => {
    await window.db.acttel.add(Number(act.id), Number(form.id))
    setLinkedActs((prev) => [...prev, act])
    setActSearch('')
    setActResults([])
  }

  const removeActLink = async (actId: number): Promise<void> => {
    await window.db.acttel.remove(actId, Number(form.id))
    setLinkedActs((prev) => prev.filter((a) => Number(a.id) !== actId))
  }

  const pal = avatarPalette(form.id)

  const TABS = [
    { id: 'general' as const,    label: t('contacts.tabGeneral') },
    { id: 'address' as const,    label: t('contacts.tabAddress') },
    { id: 'contact' as const,    label: t('contacts.tabContact') },
    { id: 'web' as const,        label: t('contacts.tabWeb') },
    { id: 'activities' as const, label: t('contacts.tabActivities') },
  ]

  const emailList = (
    <div className="border-t border-outline-variant/40 pt-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mt-1">{t('contacts.sectionEmail')}</p>
        <button onClick={() => setShowCbx((v) => !v)}
          className="text-[10px] text-on-surface-variant/50 hover:text-on-surface-variant transition-colors px-1.5 py-0.5 rounded border border-outline-variant/30">
          {showCbx ? t('contacts.hideCbx') : t('contacts.showCbx')}
        </button>
      </div>
      {(() => {
        const visible = emails.filter((e) => !e._deleted)
        const shown = emailsExpanded ? visible : visible.slice(0, 4)
        const realIdx = (visIdx: number): number => {
          let c = 0
          for (let i = 0; i < emails.length; i++) {
            if (!emails[i]._deleted) { if (c === visIdx) return i; c++ }
          }
          return -1
        }
        return (
          <>
            {shown.map((e, vi) => {
              const ai = realIdx(vi)
              return (
                <div key={e.id ?? `new-${vi}`} className="mb-1.5">
                  <div className="flex items-center gap-1">
                    <input className={`${inpLight} flex-1`} value={e.EMail}
                      onChange={(ev) => updateEmail(ai, 'EMail', ev.target.value)}
                      placeholder={t('contacts.emailPh')} />
                    <button onClick={() => removeEmail(ai)}
                      className="flex-shrink-0 text-error/50 hover:text-error transition-colors text-xs px-1">✕</button>
                  </div>
                  {showCbx && (
                    <div className="flex gap-3 mt-0.5 ml-1">
                      <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                        <input type="checkbox" checked={e.bSender === 1}
                          onChange={(ev) => updateEmail(ai, 'bSender', ev.target.checked ? 1 : 0)} />
                        {t('contacts.senderRecip')}
                      </label>
                      <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                        <input type="checkbox" checked={e.bFavorit === 1}
                          onChange={(ev) => updateEmail(ai, 'bFavorit', ev.target.checked ? 1 : 0)} />
                        {t('contacts.favorite')}
                      </label>
                      <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                        <input type="checkbox" checked={e.bIsImap === 1}
                          onChange={(ev) => updateEmail(ai, 'bIsImap', ev.target.checked ? 1 : 0)} />
                        {t('contacts.imap')}
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
            {visible.length > 4 && (
              <button onClick={() => setEmailsExpanded((v) => !v)}
                className="text-xs text-primary/70 hover:text-primary transition-colors mb-1">
                {emailsExpanded ? t('contacts.showLess') : t('contacts.showMore', { n: visible.length - 4 })}
              </button>
            )}
            <button onClick={addEmail}
              className="text-xs text-on-surface-variant/50 hover:text-on-surface-variant border border-dashed border-outline-variant/40 rounded-lg px-2 py-1 w-full transition-colors">
              + {t('contacts.addEmail')}
            </button>
          </>
        )
      })()}
    </div>
  )

  const webList = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide">{t('contacts.sectionWeb')}</p>
      </div>
      {(() => {
        const visible = webs.filter((w) => !w._deleted)
        const shown = websExpanded ? visible : visible.slice(0, 4)
        const realIdx = (visIdx: number): number => {
          let c = 0
          for (let i = 0; i < webs.length; i++) {
            if (!webs[i]._deleted) { if (c === visIdx) return i; c++ }
          }
          return -1
        }
        return (
          <>
            {shown.map((w, vi) => {
              const ai = realIdx(vi)
              return (
                <div key={w.id ?? `new-${vi}`} className="flex items-center gap-1 mb-1.5">
                  <input className={`${inpLight} flex-1`} value={w.Url}
                    onChange={(ev) => updateWeb(ai, 'Url', ev.target.value)}
                    placeholder="https://" />
                  <button onClick={() => removeWeb(ai)}
                    className="flex-shrink-0 text-error/50 hover:text-error transition-colors text-xs px-1">✕</button>
                </div>
              )
            })}
            {visible.length > 4 && (
              <button onClick={() => setWebsExpanded((v) => !v)}
                className="text-xs text-primary/70 hover:text-primary transition-colors mb-1">
                {websExpanded ? t('contacts.showLess') : t('contacts.showMore', { n: visible.length - 4 })}
              </button>
            )}
            <button onClick={addWeb}
              className="text-xs text-on-surface-variant/50 hover:text-on-surface-variant border border-dashed border-outline-variant/40 rounded-lg px-2 py-1 w-full transition-colors">
              + {t('contacts.addWeb')}
            </button>
          </>
        )
      })()}
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header mit Avatar + Buttons ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/40 bg-surface-container-low flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-sm ${pal.bg} ${pal.text}`}>
          {initials(form.FirstName, form.SurName)}
        </div>
        <div className="flex-1 min-w-0 flex gap-2">
          <input className={nameInp} placeholder={t('contacts.firstNamePh')}
            value={String(form.FirstName ?? '')} onChange={(e) => set('FirstName', e.target.value)} />
          <input className={nameInp} placeholder={t('contacts.lastNamePh')}
            value={String(form.SurName ?? '')} onChange={(e) => set('SurName', e.target.value)} />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleDelete}
            className="px-3 py-1.5 text-xs rounded-lg border border-error/40 text-error hover:bg-error/10 transition-colors">
            {t('contacts.delete')}
          </button>
          <button onClick={handleSave} disabled={!dirty || saving}
            className="px-4 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-primary/80 disabled:opacity-40 transition-colors">
            {saving ? t('contacts.saving') : t('contacts.save')}
          </button>
        </div>
      </div>

      {/* ── Tab-Leiste ── */}
      <div className="flex border-b border-outline-variant/40 bg-surface-container-low flex-shrink-0 px-4">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant/60 hover:text-on-surface-variant'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* ── Tab: Allgemein ── */}
        {activeTab === 'general' && (
          <div className="max-w-2xl flex flex-col gap-2">

            <FormRow label={t('contacts.labelCategory')}>
              <div className="flex gap-2">
                <input className={`${inp} flex-1`} readOnly
                  value={String(form.Cat ?? '')}
                  placeholder={t('contacts.categoryPh')}
                  onDoubleClick={() => setShowCatPicker(true)} />
                <button onClick={() => setShowCatPicker(true)}
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high transition-colors"
                  title={t('fdlgcat.title')}>
                  ↗
                </button>
              </div>
            </FormRow>

            <FormRow label="">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
                  <input type="checkbox" checked={Number(form.SactPrv) === 1}
                    onChange={(e) => set('SactPrv', e.target.checked ? 1 : 0)} />
                  {t('contacts.activePrivate')}
                </label>
                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
                  <input type="checkbox" checked={Number(form.SactBus) === 1}
                    onChange={(e) => set('SactBus', e.target.checked ? 1 : 0)} />
                  {t('contacts.activeBusiness')}
                </label>
              </div>
            </FormRow>

            <SectionTitle label={t('contacts.sectionPrimaryContact')} />

            <FormRow label={t('contacts.labelTitle')}>
              <div className="flex gap-2">
                <input className={`${inp} w-24`} placeholder="Herr/Frau" value={String(form.MrMrs ?? '')} onChange={(e) => set('MrMrs', e.target.value)} />
                <input className={inp} placeholder="Dr./Prof." value={String(form.Title ?? '')} onChange={(e) => set('Title', e.target.value)} />
              </div>
            </FormRow>

            <FormRow label={t('contacts.labelHeadOffice')}>
              <div className="flex gap-2">
                <input className={inp} value={String(form.HeadOffice ?? '')} onChange={(e) => set('HeadOffice', e.target.value)} />
                <input className={`${inp} w-20`} placeholder={t('contacts.countryPh')} value={String(form.Country ?? '')} onChange={(e) => set('Country', e.target.value)} />
              </div>
            </FormRow>

            <FormRow label={t('contacts.labelCompany')}>
              <input className={inp} value={String(form.Company ?? '')} onChange={(e) => set('Company', e.target.value)} />
            </FormRow>

            <FormRow label="Mobile 1"><input className={inp} value={String(form.Mobile1 ?? '')} onChange={(e) => set('Mobile1', e.target.value)} /></FormRow>
            <FormRow label="Tel 1"><input className={inp} value={String(form.TelNr1 ?? '')} onChange={(e) => set('TelNr1', e.target.value)} /></FormRow>

            <div className="mt-1">{emailList}</div>

          </div>
        )}

        {/* ── Tab: Adresse ── */}
        {activeTab === 'address' && (
          <div className="max-w-2xl flex flex-col gap-2">

            <FormRow label={t('contacts.labelTitle')}>
              <div className="flex gap-2">
                <input className={`${inp} w-24`} placeholder="Herr/Frau" value={String(form.MrMrs ?? '')} onChange={(e) => set('MrMrs', e.target.value)} />
                <input className={inp} placeholder="Dr./Prof." value={String(form.Title ?? '')} onChange={(e) => set('Title', e.target.value)} />
              </div>
            </FormRow>

            <FormRow label={t('contacts.labelJob')}>
              <input className={inp} value={String(form.JobTitle ?? '')} onChange={(e) => set('JobTitle', e.target.value)} />
            </FormRow>

            <FormRow label={t('contacts.labelHeadOffice')}>
              <div className="flex gap-2">
                <input className={inp} value={String(form.HeadOffice ?? '')} onChange={(e) => set('HeadOffice', e.target.value)} />
                <input className={`${inp} w-20`} placeholder={t('contacts.countryPh')} value={String(form.Country ?? '')} onChange={(e) => set('Country', e.target.value)} />
              </div>
            </FormRow>

            <FormRow label={t('contacts.labelCompany')}>
              <input className={inp} value={String(form.Company ?? '')} onChange={(e) => set('Company', e.target.value)} />
            </FormRow>

            <FormRow label={t('contacts.labelDept')}>
              <input className={inp} value={String(form.Departm ?? '')} onChange={(e) => set('Departm', e.target.value)} />
            </FormRow>

            <FormRow label={t('contacts.labelTeam')}>
              <div className="flex gap-2">
                <input className={inp} placeholder="Grp1" value={String(form.Grp1 ?? '')} onChange={(e) => set('Grp1', e.target.value)} />
                <input className={inp} placeholder="Grp2" value={String(form.Grp2 ?? '')} onChange={(e) => set('Grp2', e.target.value)} />
              </div>
            </FormRow>

            <FormRow label={t('contacts.labelMainAddr')}>
              <textarea className={`${inp} resize-none`} rows={4}
                value={String(form.Adress1 ?? '')} onChange={(e) => set('Adress1', e.target.value)} />
            </FormRow>

            <FormRow label={t('contacts.labelSecondAddr')}>
              <textarea className={`${inp} resize-none`} rows={3}
                value={String(form.Adress2 ?? '')} onChange={(e) => set('Adress2', e.target.value)} />
            </FormRow>

            <FormRow label={t('contacts.labelNote')}>
              <textarea className={`${inp} resize-none`} rows={4}
                value={String(form.txt1 ?? '')} onChange={(e) => set('txt1', e.target.value)} />
            </FormRow>

            <FormRow label={t('contacts.labelPrio')}>
              <input type="number" className={`${inp} w-20`}
                value={String(form.Prio1 ?? '')}
                onChange={(e) => set('Prio1', e.target.value ? Number(e.target.value) : null)} />
            </FormRow>

          </div>
        )}

        {/* ── Tab: Kontakt ── */}
        {activeTab === 'contact' && (
          <div className="max-w-2xl flex flex-col gap-2">

            <FormRow label="Mobile 1"><input className={inp} value={String(form.Mobile1 ?? '')} onChange={(e) => set('Mobile1', e.target.value)} /></FormRow>
            <FormRow label="Tel 1"><input className={inp} value={String(form.TelNr1 ?? '')} onChange={(e) => set('TelNr1', e.target.value)} /></FormRow>
            <FormRow label="Mobile 2"><input className={inp} value={String(form.Mobile2 ?? '')} onChange={(e) => set('Mobile2', e.target.value)} /></FormRow>
            <FormRow label="Tel 2"><input className={inp} value={String(form.TelNr2 ?? '')} onChange={(e) => set('TelNr2', e.target.value)} /></FormRow>
            <FormRow label="Tel 3"><input className={inp} value={String(form.TelNr3 ?? '')} onChange={(e) => set('TelNr3', e.target.value)} /></FormRow>
            <FormRow label={t('contacts.labelFax')}><input className={inp} value={String(form.Fax ?? '')} onChange={(e) => set('Fax', e.target.value)} /></FormRow>

            <div className="mt-2">{emailList}</div>

          </div>
        )}

        {/* ── Tab: Web ── */}
        {activeTab === 'web' && (
          <div className="max-w-2xl flex flex-col gap-6">
            {webList}
            <div className="border-t border-outline-variant/40 pt-4">
              <LinkPanel entityType="tel" entityId={form.id as number} />
            </div>
            <p className="text-xs text-on-surface-variant/40 italic">
              {t('contacts.mailTokenHint')}
            </p>
          </div>
        )}

        {/* ── Tab: Aktivitäten ── */}
        {activeTab === 'activities' && (
          <div className="max-w-2xl flex flex-col gap-3">
            <SectionTitle label={t('contacts.sectionActivities')} />
            {linkedActs.length === 0 ? (
              <p className="text-xs text-on-surface-variant/40 italic px-1">{t('contacts.noActivities')}</p>
            ) : (
              <div className="flex flex-col gap-0.5 mb-2">
                {linkedActs.map((a) => (
                  <div key={String(a.id)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <span className="flex-1 text-xs text-on-surface truncate">{String(a.Title ?? '')}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${Number(a.Sdone) === 1 ? 'bg-secondary-container/60 text-secondary-fixed-dim' : 'bg-primary/10 text-primary'}`}>
                      {String(a.Status ?? '')}
                    </span>
                    <button onClick={() => removeActLink(Number(a.id))}
                      className="text-error/50 hover:text-error text-xs leading-none flex-shrink-0 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <input className="w-full text-xs border border-outline-variant/40 rounded-lg px-2.5 py-1 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/40"
                placeholder={t('contacts.searchActivity')}
                value={actSearch}
                onChange={(e) => { setActSearch(e.target.value); searchActs(e.target.value) }}
                onFocus={() => { if (actSearch) searchActs(actSearch) }}
                onBlur={() => setTimeout(() => setActResults([]), 200)} />
              {actResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-0.5 border border-outline-variant/40 rounded-lg bg-surface-container-high shadow-lg z-20 max-h-36 overflow-y-auto">
                  {actResults.map((a) => (
                    <button key={String(a.id)}
                      onMouseDown={(e) => { e.preventDefault(); addActLink(a) }}
                      className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-surface-container-highest border-b border-outline-variant/20 last:border-0 text-on-surface truncate transition-colors">
                      {String(a.Title ?? '')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {showCatPicker && (
        <FdlgCatModal
          cats={cats}
          current={String(form.Cat ?? '')}
          onConfirm={(val) => { set('Cat', val); setShowCatPicker(false) }}
          onClose={() => setShowCatPicker(false)}
        />
      )}
    </div>
  )
}

export default function ContactsView({ initialTelId, onContactOpened, returnActId, onNavigateBack }: { initialTelId?: number; onContactOpened?: () => void; returnActId?: number; onNavigateBack?: () => void }): JSX.Element {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Tel[]>([])
  const [selected, setSelected] = useState<Tel | null>(null)
  const [search, setSearch] = useState('')
  const [alphaFilter, setAlphaFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [cats, setCats] = useState<Row[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback((q: string) => {
    setLoading(true)
    window.db.tel.getAll(q).then((rows) => {
      setContacts(rows as Tel[])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    window.db.cat.getAll('FTel').then((rows) => setCats(rows as Row[]))
  }, [])

  useEffect(() => {
    if (!initialTelId) return
    window.db.tel.getById(initialTelId).then((row) => {
      if (row) { setSelected(row as Tel); setSearch(''); setAlphaFilter('') }
      onContactOpened?.()
    })
  }, [initialTelId])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(search), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, load])

  const visible = alphaFilter
    ? contacts.filter((c) => {
        const first = String(c.SurName ?? c.FirstName ?? c.Company ?? '').trim()[0]?.toUpperCase()
        return first === alphaFilter
      })
    : contacts

  const handleSaved = (updated: Tel): void => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelected(updated)
  }

  const handleDeleted = (id: number): void => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    setSelected(null)
  }

  const handleNew = async (): Promise<void> => {
    const result = await window.db.tel.create({ SurName: t('contacts.newContact'), SactBus: 1 })
    const newContact = await window.db.tel.getById(result.id as number)
    if (newContact) {
      setContacts((prev) => [newContact as Tel, ...prev])
      setSelected(newContact as Tel)
      setAlphaFilter('')
      setSearch('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">

      {returnActId && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-primary/10 border-b border-primary/20 text-sm text-primary">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 hover:text-primary/70 transition-colors font-medium">
            <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
            {t('contacts.backToActivity')}
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">

      {/* ── Linke Kontaktliste ── */}
      <div className={`flex-shrink-0 flex flex-col border-r border-outline-variant/40 bg-surface-container-low overflow-hidden transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-8'}`}>

        {/* Eingeklappt: nur Expand-Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            title={t('contacts.expandSidebar')}
            className="w-full flex items-center justify-center py-2.5 text-on-surface-variant/60 hover:bg-surface-container-highest hover:text-on-surface transition-colors text-base">
            ›
          </button>
        )}

        {/* Ausgeklappt: volle Sidebar */}
        {sidebarOpen && (
          <>
            {/* Kopfzeile: Suche + Neu + Collapse */}
            <div className="px-3 py-2 border-b border-outline-variant/40">
              <div className="flex gap-2 mb-1">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm select-none">⌕</span>
                  <input
                    className="w-full pl-7 pr-6 py-1 text-sm border border-outline-variant rounded-lg bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/40"
                    placeholder={t('contacts.searchPh')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setAlphaFilter('') }}
                    autoFocus />
                  {search && (
                    <button onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-xs hover:text-on-surface-variant transition-colors">✕</button>
                  )}
                </div>
                <button onClick={handleNew}
                  className="flex-shrink-0 px-2.5 py-1 text-xs rounded-lg bg-primary text-on-primary hover:bg-primary/80 transition-colors">
                  + {t('common.new')}
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title={t('contacts.collapseSidebar')}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-on-surface-variant/50 hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm">
                  ‹
                </button>
              </div>
              <p className="text-xs text-on-surface-variant/50">{t('contacts.count', { count: visible.length })}</p>
            </div>

            {/* Alphabetischer Filter */}
            <div className="px-2 py-1.5 border-b border-outline-variant/40 flex flex-wrap gap-0.5">
              {ALPHA.map((l) => (
                <button key={l}
                  onClick={() => { setAlphaFilter(alphaFilter === l ? '' : l); setSearch('') }}
                  className={`w-5 h-5 text-xs rounded flex items-center justify-center transition-colors ${
                    alphaFilter === l
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant/60 hover:bg-surface-container-highest'
                  }`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Kontaktliste */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-on-surface-variant/60 text-sm">{t('contacts.searching')}</div>
              ) : visible.length === 0 ? (
                <div className="p-4 text-on-surface-variant/60 text-sm">{t('contacts.noContacts')}</div>
              ) : visible.map((c) => {
                const pal = avatarPalette(c.id)
                return (
                  <button key={c.id as number} onClick={() => setSelected(c)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-outline-variant/20 transition-colors hover:bg-surface-container ${
                      selected?.id === c.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${pal.bg} ${pal.text}`}>
                      {initials(c.FirstName, c.SurName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{fullName(c)}</p>
                      <p className="text-xs text-on-surface-variant/60 truncate">{String(c.Company ?? c.EMail1 ?? '')}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Rechte Detailansicht ── */}
      <div className="flex-1 overflow-hidden">
        {selected === null ? (
          <div className="flex items-center justify-center h-full text-on-surface-variant/40 text-sm">
            {t('contacts.selectContact')}
          </div>
        ) : (
          <ContactDetail
            key={selected.id as number}
            contact={selected}
            cats={cats}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        )}
      </div>
      </div>
    </div>
  )
}

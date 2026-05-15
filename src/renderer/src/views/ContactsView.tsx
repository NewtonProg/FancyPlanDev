import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import LinkPanel from '../components/LinkPanel'

type Tel = Record<string, unknown>

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function initials(first: unknown, last: unknown): string {
  const f = String(first ?? '').trim()[0] ?? ''
  const l = String(last ?? '').trim()[0] ?? ''
  return (f + l).toUpperCase() || '?'
}

function avatarColor(id: unknown): string {
  const colors = ['bg-blue-400', 'bg-purple-400', 'bg-green-500', 'bg-orange-400', 'bg-pink-400', 'bg-teal-500']
  return colors[Number(id ?? 0) % colors.length]
}

function fullName(c: Tel): string {
  return [c.FirstName, c.SurName].filter(Boolean).map(String).join(' ') || String(c.Company ?? '—')
}

const inp = 'w-full text-sm border border-outline-variant rounded-lg px-2.5 py-1 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40'
const lbl = 'text-xs text-on-surface-variant/60 mb-0.5 block'

function Row({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-start gap-2">
      <label className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 pt-1.5 text-right">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function ContactDetail({
  contact,
  onSaved,
  onDeleted
}: {
  contact: Tel
  onSaved: (updated: Tel) => void
  onDeleted: (id: number) => void
}): JSX.Element {
  const { t } = useTranslation()
  const [form, setForm] = useState<Tel>({ ...contact })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { setForm({ ...contact }); setDirty(false) }, [contact])

  const set = (key: string, val: unknown): void => {
    setForm((p) => ({ ...p, [key]: val }))
    setDirty(true)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    const { id, created_at, updated_at, ...data } = form
    await window.db.tel.update(id as number, data)
    onSaved({ ...form })
    setSaving(false)
    setDirty(false)
  }

  const handleDelete = async (): Promise<void> => {
    if (!confirm(t('contacts.deleteConfirm', { name: fullName(form) }))) return
    await window.db.tel.delete(form.id as number)
    onDeleted(form.id as number)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-outline-variant/40">
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold ${avatarColor(form.id)}`}>
          {initials(form.FirstName, form.SurName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface truncate">{fullName(form)}</p>
          {form.JobTitle && <p className="text-xs text-on-surface-variant/60">{String(form.JobTitle)}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={handleDelete}
            className="px-3 py-1.5 text-xs rounded-lg border border-error/40 text-error hover:bg-error-container/10">
            {t('contacts.delete')}
          </button>
          <button onClick={handleSave} disabled={!dirty || saving}
            className="px-4 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
            {saving ? t('contacts.saving') : t('contacts.save')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-6">

          <div className="flex-1 flex flex-col gap-2.5">
            <div>
              <label className={lbl}>{t('contacts.labelName')}</label>
              <div className="flex gap-2">
                <input className={inp} placeholder={t('contacts.firstNamePh')} value={String(form.FirstName ?? '')} onChange={(e) => set('FirstName', e.target.value)} />
                <input className={inp} placeholder={t('contacts.lastNamePh')} value={String(form.SurName ?? '')} onChange={(e) => set('SurName', e.target.value)} />
              </div>
            </div>
            <Row label={t('contacts.labelCategory')}>
              <input className={inp} value={String(form.Cat ?? '')} onChange={(e) => set('Cat', e.target.value)} placeholder={t('contacts.categoryPh')} />
            </Row>
            <Row label="">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
                  <input type="checkbox" checked={Number(form.SactPrv) === 1} onChange={(e) => set('SactPrv', e.target.checked ? 1 : 0)} />
                  {t('contacts.activePrivate')}
                </label>
                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
                  <input type="checkbox" checked={Number(form.SactBus) === 1} onChange={(e) => set('SactBus', e.target.checked ? 1 : 0)} />
                  {t('contacts.activeBusiness')}
                </label>
              </div>
            </Row>
            <Row label={t('contacts.labelHeadOffice')}>
              <div className="flex gap-2">
                <input className={inp} value={String(form.HeadOffice ?? '')} onChange={(e) => set('HeadOffice', e.target.value)} />
                <input className={`${inp} w-24`} placeholder={t('contacts.countryPh')} value={String(form.Country ?? '')} onChange={(e) => set('Country', e.target.value)} />
              </div>
            </Row>
            <Row label={t('contacts.labelCompany')}><input className={inp} value={String(form.Company ?? '')} onChange={(e) => set('Company', e.target.value)} /></Row>
            <Row label={t('contacts.labelDept')}><input className={inp} value={String(form.Departm ?? '')} onChange={(e) => set('Departm', e.target.value)} /></Row>
            <Row label={t('contacts.labelTeam')}>
              <div className="flex gap-2">
                <input className={inp} placeholder="Grp1" value={String(form.Grp1 ?? '')} onChange={(e) => set('Grp1', e.target.value)} />
                <input className={inp} placeholder="Grp2" value={String(form.Grp2 ?? '')} onChange={(e) => set('Grp2', e.target.value)} />
              </div>
            </Row>
            <Row label={t('contacts.labelMainAddr')}>
              <textarea className={`${inp} resize-none`} rows={4} value={String(form.Adress1 ?? '')} onChange={(e) => set('Adress1', e.target.value)} />
            </Row>
            <Row label={t('contacts.labelSecondAddr')}>
              <textarea className={`${inp} resize-none`} rows={3} value={String(form.Adress2 ?? '')} onChange={(e) => set('Adress2', e.target.value)} />
            </Row>
            <Row label={t('contacts.labelImage')}><input className={inp} value={String(form.imgPath1 ?? '')} onChange={(e) => set('imgPath1', e.target.value)} /></Row>
            <Row label={t('contacts.labelPrio')}><input type="number" className={`${inp} w-20`} value={String(form.Prio1 ?? '')} onChange={(e) => set('Prio1', e.target.value ? Number(e.target.value) : null)} /></Row>
          </div>

          <div className="w-64 flex-shrink-0 flex flex-col gap-2.5">
            <Row label="Mobile1"><input className={inp} value={String(form.Mobile1 ?? '')} onChange={(e) => set('Mobile1', e.target.value)} /></Row>
            <Row label={t('common.status')}><input className={inp} value={String(form.Status ?? '')} onChange={(e) => set('Status', e.target.value)} /></Row>
            <Row label="Tel1"><input className={inp} value={String(form.TelNr1 ?? '')} onChange={(e) => set('TelNr1', e.target.value)} /></Row>
            <Row label="Mobile2"><input className={inp} value={String(form.Mobile2 ?? '')} onChange={(e) => set('Mobile2', e.target.value)} /></Row>
            <Row label="Tel2"><input className={inp} value={String(form.TelNr2 ?? '')} onChange={(e) => set('TelNr2', e.target.value)} /></Row>
            <Row label="Tel3"><input className={inp} value={String(form.TelNr3 ?? '')} onChange={(e) => set('TelNr3', e.target.value)} /></Row>
            <Row label={t('contacts.labelFax')}><input className={inp} value={String(form.Fax ?? '')} onChange={(e) => set('Fax', e.target.value)} /></Row>

            <div className="border-t border-outline-variant/40 pt-2 mt-1">
              <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2">{t('contacts.sectionEmail')}</p>
              {([1, 2, 3] as const).map((n) => (
                <div key={n} className="mb-2">
                  <Row label={`EMail${n}`}>
                    <input className={inp} value={String(form[`EMail${n}`] ?? '')} onChange={(e) => set(`EMail${n}`, e.target.value)} />
                  </Row>
                  <div className="flex gap-3 ml-28 mt-0.5">
                    <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                      <input type="checkbox" checked={Number(form[`bSender${n}`]) === 1} onChange={(e) => set(`bSender${n}`, e.target.checked ? 1 : 0)} />
                      {t('contacts.senderRecip')}
                    </label>
                    <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                      <input type="checkbox" checked={Number(form[`bMailFavo${n}`]) === 1} onChange={(e) => set(`bMailFavo${n}`, e.target.checked ? 1 : 0)} />
                      {t('contacts.favorite')}
                    </label>
                    <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                      <input type="checkbox" checked={Number(form[`bIsImap${n}`]) === 1} onChange={(e) => set(`bIsImap${n}`, e.target.checked ? 1 : 0)} />
                      {t('contacts.imap')}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant/40 pt-2 mt-1">
              <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2">{t('contacts.sectionWeb')}</p>
              {([1, 2, 3] as const).map((n) => (
                <Row key={n} label={`WWW${n}`}>
                  <input className={inp} value={String(form[`www${n}`] ?? '')} onChange={(e) => set(`www${n}`, e.target.value)} />
                </Row>
              ))}
            </div>

            <div className="border-t border-outline-variant/40 pt-2 mt-1">
              <Row label={t('contacts.labelNote')}>
                <textarea className={`${inp} resize-none`} rows={4} value={String(form.txt1 ?? '')} onChange={(e) => set('txt1', e.target.value)} />
              </Row>
            </div>

            <p className="text-xs text-on-surface-variant/40 ml-28 mt-1 italic">
              {t('contacts.mailTokenHint')}
            </p>

            <div className="border-t border-outline-variant/40 pt-2 mt-1">
              <LinkPanel entityType="tel" entityId={form.id as number} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactsView(): JSX.Element {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Tel[]>([])
  const [selected, setSelected] = useState<Tel | null>(null)
  const [search, setSearch] = useState('')
  const [alphaFilter, setAlphaFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback((q: string) => {
    setLoading(true)
    window.db.tel.getAll(q).then((rows) => {
      setContacts(rows)
      setLoading(false)
    })
  }, [])

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

  return (
    <div className="flex h-full">
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-outline-variant/40">
        <div className="px-3 py-2 border-b border-outline-variant/40">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm">⌕</span>
            <input className="w-full pl-7 pr-6 py-1 text-sm border border-outline-variant rounded-lg bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40"
              placeholder={t('contacts.searchPh')} value={search} onChange={(e) => { setSearch(e.target.value); setAlphaFilter('') }} autoFocus />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-xs">✕</button>}
          </div>
          <p className="text-xs text-on-surface-variant/60 mt-1">{t('contacts.count', { count: visible.length })}</p>
        </div>

        <div className="px-2 py-1.5 border-b border-outline-variant/40 flex flex-wrap gap-0.5">
          {ALPHA.map((l) => (
            <button key={l} onClick={() => { setAlphaFilter(alphaFilter === l ? '' : l); setSearch('') }}
              className={`w-5 h-5 text-xs rounded flex items-center justify-center transition-colors ${alphaFilter === l ? 'bg-primary text-on-primary' : 'text-on-surface-variant/60 hover:bg-surface-container-highest'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-on-surface-variant/60 text-sm">{t('contacts.searching')}</div>
          ) : visible.length === 0 ? (
            <div className="p-4 text-on-surface-variant/60 text-sm">{t('contacts.noContacts')}</div>
          ) : visible.map((c) => (
            <button key={c.id as number} onClick={() => setSelected(c)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-outline-variant/20 transition-colors hover:bg-surface-container-high ${selected?.id === c.id ? 'bg-primary/5' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold ${avatarColor(c.id)}`}>
                {initials(c.FirstName, c.SurName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{fullName(c)}</p>
                <p className="text-xs text-on-surface-variant/60 truncate">{String(c.Company ?? c.EMail1 ?? '')}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {selected === null ? (
          <div className="flex items-center justify-center h-full text-on-surface-variant/40 text-sm">{t('contacts.selectContact')}</div>
        ) : (
          <ContactDetail key={selected.id as number} contact={selected} onSaved={handleSaved} onDeleted={handleDeleted} />
        )}
      </div>
    </div>
  )
}

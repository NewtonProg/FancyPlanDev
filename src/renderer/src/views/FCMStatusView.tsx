import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Row = Record<string, unknown>

interface FCMStatusEntry {
  id: number
  Status: string
  StatusGrp: string
  Aktion?: string
  Points?: number
  relevant?: number
  Kategorie?: string
  UserExit?: string
  SortNr?: number
  katFind?: string
  katReplace?: string
  p1LtVal?: number | null; p1LtSet?: number | null; p1LtNoop?: number
  p1EqVal?: number | null; p1EqSet?: number | null; p1EqNoop?: number
  p1GtVal?: number | null; p1GtSet?: number | null; p1GtNoop?: number
  p2LtVal?: number | null; p2LtSet?: number | null; p2LtNoop?: number
  p2EqVal?: number | null; p2EqSet?: number | null; p2EqNoop?: number
  p2GtVal?: number | null; p2GtSet?: number | null; p2GtNoop?: number
  p3LtVal?: number | null; p3LtSet?: number | null; p3LtNoop?: number
  p3EqVal?: number | null; p3EqSet?: number | null; p3EqNoop?: number
  p3GtVal?: number | null; p3GtSet?: number | null; p3GtNoop?: number
  setIstVon?: number
  setIstBis?: number
  setPlanVon?: number
  setPlanBis?: number
  setInfo?: number
  titelText?: string
}

const emptyForm = (): FCMStatusEntry => ({
  id: 0,
  Status: '',
  StatusGrp: 'All',
  Aktion: '',
  Points: 0,
  relevant: 1,
  Kategorie: '',
  UserExit: '',
  SortNr: 0,
  katFind: '',
  katReplace: '',
  p1LtVal: null, p1LtSet: null, p1LtNoop: 1,
  p1EqVal: null, p1EqSet: null, p1EqNoop: 1,
  p1GtVal: null, p1GtSet: null, p1GtNoop: 1,
  p2LtVal: null, p2LtSet: null, p2LtNoop: 1,
  p2EqVal: null, p2EqSet: null, p2EqNoop: 1,
  p2GtVal: null, p2GtSet: null, p2GtNoop: 1,
  p3LtVal: null, p3LtSet: null, p3LtNoop: 1,
  p3EqVal: null, p3EqSet: null, p3EqNoop: 1,
  p3GtVal: null, p3GtSet: null, p3GtNoop: 1,
  setIstVon: 0,
  setIstBis: 0,
  setPlanVon: 0,
  setPlanBis: 0,
  setInfo: 0,
  titelText: ''
})

const inputCls = 'w-full text-sm border border-outline-variant rounded-lg px-2.5 py-1.5 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface'
const numCls = `${inputCls} w-20`
const labelCls = 'text-xs text-on-surface-variant mb-0.5 block'

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}

function Row2({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="w-28 flex-shrink-0 text-xs text-on-surface-variant">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

interface PrioSectionProps {
  t: (key: string) => string
  prefix: string
  title: string
  form: FCMStatusEntry
  set: (key: keyof FCMStatusEntry, value: unknown) => void
}

function PrioSection({ t, prefix, title, form, set }: PrioSectionProps): JSX.Element {
  const ltVal = `${prefix}LtVal` as keyof FCMStatusEntry
  const ltSet = `${prefix}LtSet` as keyof FCMStatusEntry
  const ltNoop = `${prefix}LtNoop` as keyof FCMStatusEntry
  const eqVal = `${prefix}EqVal` as keyof FCMStatusEntry
  const eqSet = `${prefix}EqSet` as keyof FCMStatusEntry
  const eqNoop = `${prefix}EqNoop` as keyof FCMStatusEntry
  const gtVal = `${prefix}GtVal` as keyof FCMStatusEntry
  const gtSet = `${prefix}GtSet` as keyof FCMStatusEntry
  const gtNoop = `${prefix}GtNoop` as keyof FCMStatusEntry

  const renderRow = (
    condLabel: string,
    vKey: keyof FCMStatusEntry,
    sKey: keyof FCMStatusEntry,
    nKey: keyof FCMStatusEntry
  ): JSX.Element => {
    const noop = Number(form[nKey] ?? 1) === 1
    return (
      <div className="flex items-center gap-2 mb-1.5 text-xs">
        <span className="w-20 text-on-surface-variant flex-shrink-0">{condLabel}</span>
        <input
          type="number"
          className="w-16 text-sm border border-outline-variant rounded-lg px-2 py-1 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface"
          placeholder={t('fcmst.condVal')}
          value={form[vKey] != null ? String(form[vKey]) : ''}
          onChange={e => set(vKey, e.target.value !== '' ? Number(e.target.value) : null)}
        />
        <span className="text-on-surface-variant/60 flex-shrink-0">{t('fcmst.thenSet')}</span>
        <input
          type="number"
          className={`w-16 text-sm border border-outline-variant rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface ${noop ? 'bg-surface-container-high opacity-50' : 'bg-surface-container'}`}
          placeholder={t('fcmst.setVal')}
          disabled={noop}
          value={form[sKey] != null ? String(form[sKey]) : ''}
          onChange={e => set(sKey, e.target.value !== '' ? Number(e.target.value) : null)}
        />
        <label className="flex items-center gap-1 flex-shrink-0 cursor-pointer">
          <input
            type="checkbox"
            className="w-3.5 h-3.5"
            checked={noop}
            onChange={e => set(nKey, e.target.checked ? 1 : 0)}
          />
          <span className="text-on-surface-variant/60">{t('fcmst.doNothing')}</span>
        </label>
      </div>
    )
  }

  return (
    <Section title={title}>
      {renderRow(t('fcmst.prioLt'), ltVal, ltSet, ltNoop)}
      {renderRow(t('fcmst.prioEq'), eqVal, eqSet, eqNoop)}
      {renderRow(t('fcmst.prioGt'), gtVal, gtSet, gtNoop)}
    </Section>
  )
}

export default function FCMStatusView({ onBack }: { onBack: () => void }): JSX.Element {
  const { t } = useTranslation()
  const [list, setList] = useState<FCMStatusEntry[]>([])
  const [form, setForm] = useState<FCMStatusEntry>(emptyForm())
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll(): Promise<void> {
    const rows = await window.db.fcmstatus.getAll()
    setList(rows as FCMStatusEntry[])
  }

  function selectEntry(entry: FCMStatusEntry): void {
    setSelectedId(entry.id)
    setForm({ ...emptyForm(), ...entry })
  }

  function handleNew(): void {
    setSelectedId(null)
    setForm(emptyForm())
  }

  async function handleDelete(): Promise<void> {
    if (selectedId == null) return
    await window.db.fcmstatus.delete(selectedId)
    setSelectedId(null)
    setForm(emptyForm())
    loadAll()
  }

  async function handleSave(): Promise<void> {
    const { id, ...data } = form
    const payload: Row = {}
    for (const [k, v] of Object.entries(data)) {
      if (v !== '' && v !== undefined) payload[k] = v
    }
    if (selectedId && selectedId > 0) {
      await window.db.fcmstatus.update(selectedId, payload)
    } else {
      const result = await window.db.fcmstatus.create(payload)
      setSelectedId(Number(result.id))
    }
    loadAll()
  }

  const set = (key: keyof FCMStatusEntry, value: unknown): void =>
    setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/40">
        <button onClick={onBack} className="btn-secondary text-sm py-1 px-3">{t('fcmst.back')}</button>
        <h1 className="text-2xl font-semibold text-on-surface flex-1">{t('fcmst.title')}</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left: List */}
        <div className="w-60 flex-shrink-0 border-r border-outline-variant/40 flex flex-col overflow-hidden">
          <div className="flex gap-1.5 p-3 border-b border-outline-variant/40">
            <button onClick={handleNew} className="btn-secondary text-xs py-1 px-2">{t('fcmst.newBtn')}</button>
            <button onClick={handleDelete} disabled={selectedId == null} className="btn-secondary text-xs py-1 px-2 text-error hover:bg-error-container/10 disabled:opacity-40 disabled:cursor-not-allowed">{t('fcmst.delBtn')}</button>
            <button onClick={handleSave} className="btn-primary text-xs py-1 px-2">{t('fcmst.saveBtn')}</button>
          </div>
          <div className="overflow-y-auto flex-1">
            {list.length === 0 && (
              <p className="text-xs text-on-surface-variant/60 p-4 italic">{t('fcmst.noSelection')}</p>
            )}
            {list.map(entry => (
              <button
                key={entry.id}
                onClick={() => selectEntry(entry)}
                className={`w-full text-left px-3 py-2 border-b border-outline-variant/20 hover:bg-surface-container-high transition-colors ${selectedId === entry.id ? 'bg-primary/10 border-l-2 border-l-apple-blue' : ''}`}
              >
                <p className="text-sm font-medium text-on-surface truncate">{entry.Status}</p>
                <p className="text-xs text-on-surface-variant/60 truncate">{entry.StatusGrp}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Properties */}
        <div className="w-80 flex-shrink-0 border-r border-outline-variant/40 p-4 overflow-y-auto">
          <Section title={t('fcmst.status')}>
            <Row2 label={t('fcmst.status')}>
              <input className={inputCls} value={form.Status} onChange={e => set('Status', e.target.value)} />
            </Row2>
            <Row2 label={t('fcmst.statusGrp')}>
              <input className={inputCls} value={form.StatusGrp ?? ''} onChange={e => set('StatusGrp', e.target.value)} />
            </Row2>
            <Row2 label={t('fcmst.aktion')}>
              <input className={inputCls} value={form.Aktion ?? ''} onChange={e => set('Aktion', e.target.value)} />
            </Row2>
            <Row2 label={t('fcmst.points')}>
              <input type="number" className={numCls} value={form.Points ?? 0} onChange={e => set('Points', Number(e.target.value))} />
            </Row2>
            <Row2 label={t('fcmst.relevant')}>
              <input type="checkbox" className="w-4 h-4" checked={Number(form.relevant) === 1} onChange={e => set('relevant', e.target.checked ? 1 : 0)} />
            </Row2>
            <Row2 label={t('fcmst.kategorie')}>
              <input className={inputCls} value={form.Kategorie ?? ''} onChange={e => set('Kategorie', e.target.value)} />
            </Row2>
            <Row2 label={t('fcmst.userExit')}>
              <input className={inputCls} value={form.UserExit ?? ''} onChange={e => set('UserExit', e.target.value)} />
            </Row2>
            <Row2 label={t('fcmst.sortNr')}>
              <input type="number" className={numCls} value={form.SortNr ?? 0} onChange={e => set('SortNr', Number(e.target.value))} />
            </Row2>
          </Section>
        </div>

        {/* Right: Automation Rules */}
        <div className="flex-1 p-4 overflow-y-auto">

          <Section title={t('fcmst.secKat')}>
            <label className={labelCls}>{t('fcmst.katFind')}</label>
            <input className={`${inputCls} mb-2`} value={form.katFind ?? ''} onChange={e => set('katFind', e.target.value)} placeholder="z.B. Wohnung;Blume" />
            <label className={labelCls}>{t('fcmst.katReplace')}</label>
            <input className={inputCls} value={form.katReplace ?? ''} onChange={e => set('katReplace', e.target.value)} placeholder="z.B. Haus;Rose" />
          </Section>

          <PrioSection t={t} prefix="p1" title={t('fcmst.secPrio1')} form={form} set={set} />
          <PrioSection t={t} prefix="p2" title={t('fcmst.secPrio2')} form={form} set={set} />
          <PrioSection t={t} prefix="p3" title={t('fcmst.secPrio3')} form={form} set={set} />

          <Section title={t('fcmst.secIstDate')}>
            <label className="flex items-center gap-2 mb-1.5 cursor-pointer text-sm text-on-surface">
              <input type="checkbox" className="w-4 h-4" checked={Number(form.setIstVon) === 1} onChange={e => set('setIstVon', e.target.checked ? 1 : 0)} />
              {t('fcmst.setIstVon')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
              <input type="checkbox" className="w-4 h-4" checked={Number(form.setIstBis) === 1} onChange={e => set('setIstBis', e.target.checked ? 1 : 0)} />
              {t('fcmst.setIstBis')}
            </label>
          </Section>

          <Section title={t('fcmst.secPlanDate')}>
            <label className="flex items-center gap-2 mb-1.5 cursor-pointer text-sm text-on-surface">
              <input type="checkbox" className="w-4 h-4" checked={Number(form.setPlanVon) === 1} onChange={e => set('setPlanVon', e.target.checked ? 1 : 0)} />
              {t('fcmst.setPlanVon')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
              <input type="checkbox" className="w-4 h-4" checked={Number(form.setPlanBis) === 1} onChange={e => set('setPlanBis', e.target.checked ? 1 : 0)} />
              {t('fcmst.setPlanBis')}
            </label>
          </Section>

          <Section title={t('fcmst.secInfo')}>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
              <input type="checkbox" className="w-4 h-4" checked={Number(form.setInfo) === 1} onChange={e => set('setInfo', e.target.checked ? 1 : 0)} />
              {t('fcmst.setInfo')}
            </label>
          </Section>

          <Section title={t('fcmst.secTitel')}>
            <label className={labelCls}>{t('fcmst.titelText')}</label>
            <input className={inputCls} value={form.titelText ?? ''} onChange={e => set('titelText', e.target.value)} placeholder="Text wird an Titel angehängt" />
          </Section>

        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TreePickerModal from '../components/TreePickerModal'
import FdlgCatModal from '../components/FdlgCatModal'
import FdlgActModal from '../components/FdlgActModal'
import RichEditor from '../components/RichEditor'

type Act = Record<string, unknown>
type Row = Record<string, unknown>
type Tab = 'status' | 'zugeordnet' | 'control' | 'info'
type NavEntry = { id: number; title: string; form: Act; logs: Row[]; linkedActTitle: string }

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-start gap-2 mb-3">
      <label className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 pt-1.5">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

const inputCls   = 'w-full text-sm border border-outline-variant rounded-lg px-2.5 py-1.5 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface'
const selectCls  = `${inputCls} cursor-pointer`
const textareaCls = `${inputCls} resize-none text-[11px]`

function toDateStr(v: unknown): string {
  return String(v ?? '').slice(0, 10)
}

function dateDiffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function FNowModal({
  actId,
  onClose,
  onSaved
}: {
  actId: number
  onClose: () => void
  onSaved: (act: Act) => void
}): JSX.Element {
  const { t } = useTranslation()

  const [currentId,      setCurrentId]      = useState(actId)
  const [navStack,       setNavStack]        = useState<NavEntry[]>([])
  const [form,           setForm]            = useState<Act>({})
  const [areas,          setAreas]           = useState<Row[]>([])
  const [allThemes,      setAllThemes]       = useState<Row[]>([])
  const [areaThemeLinks, setAreaThemeLinks]  = useState<Row[]>([])
  const [statuses,       setStatuses]        = useState<Row[]>([])
  const [cats,           setCats]            = useState<Row[]>([])
  const [prio1s,         setPrio1s]          = useState<Row[]>([])
  const [prio2s,         setPrio2s]          = useState<Row[]>([])
  const [tab,            setTab]             = useState<Tab>('status')
  const [saving,         setSaving]          = useState(false)
  const [loading,        setLoading]         = useState(true)
  const [logs,           setLogs]            = useState<Row[]>([])
  const [showTreePicker, setShowTreePicker]  = useState(false)
  const [showCatPicker,  setShowCatPicker]   = useState(false)
  const [showActLink,    setShowActLink]      = useState(false)
  const [linkedActTitle, setLinkedActTitle]  = useState('')

  const skipDbLoad = useRef(false)

  function navigateTo(targetId: number): void {
    setNavStack(prev => [...prev, { id: currentId, title: String(form.Title ?? ''), form: { ...form }, logs, linkedActTitle }])
    setCurrentId(targetId)
    setLoading(true)
    setLinkedActTitle('')
  }

  function navigateBack(): void {
    if (navStack.length === 0) return
    const last = navStack[navStack.length - 1]
    setNavStack(s => s.slice(0, -1))
    skipDbLoad.current = true
    setForm(last.form)
    setLogs(last.logs)
    setLinkedActTitle(last.linkedActTitle)
    setLoading(false)
    setCurrentId(last.id)
  }

  useEffect(() => {
    let cancelled = false
    if (skipDbLoad.current) { skipDbLoad.current = false; return }
    Promise.all([
      window.db.act.getById(currentId),
      window.db.area.getAll(),
      window.db.theme.getAll(),
      window.db.areatheme.getAll(),
      window.db.actlog.getByAct(currentId),
      window.db.status.getAll('FAct'),
      window.db.cat.getAll('FAct'),
      window.db.prio.getAll(1),
      window.db.prio.getAll(2)
    ]).then(([act, ar, th, at, lg, st, ct, p1, p2]) => {
      if (cancelled) return
      if (act) {
        setForm({
          ...act,
          Com:   stripHtml(String(act.Com   ?? '')),
          Ltxt1: String(act.Ltxt1 ?? ''),
          Ltxt2: String(act.Ltxt2 ?? ''),
        })
      }
      setAreas(ar)
      setAllThemes(th)
      setAreaThemeLinks(at)
      setLogs(lg)
      setStatuses(st)
      setCats(ct)
      setPrio1s(p1)
      setPrio2s(p2)
      if (act && act.IDActLink) {
        window.db.act.getById(Number(act.IDActLink)).then((linked) => {
          if (cancelled) return
          if (linked) setLinkedActTitle(String(linked.Title ?? ''))
        })
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [currentId])

  const set = (key: string, value: unknown): void =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // ── Bereich→Thema filtering ──────────────────────────────────────────────
  const selectedArea  = areas.find(a => String(a.AreaName) === String(form.AreaName))
  const visibleThemes: Row[] = selectedArea
    ? areaThemeLinks
        .filter(at => Number(at.IDArea) === Number(selectedArea.id))
        .map(at => allThemes.find(t => Number(t.id) === Number(at.IDTheme)))
        .filter((t): t is Row => t !== undefined)
    : allThemes

  // ── Thema→Kategorie filtering (by CatGrp === ThemeName) ──────────────────
  const visibleCats: Row[] = form.ThemeName
    ? cats.filter(c => String(c.CatGrp) === String(form.ThemeName))
    : cats

  function handleAreaChange(newArea: string): void {
    set('AreaName', newArea)
    if (!newArea) return
    const area = areas.find(a => String(a.AreaName) === newArea)
    if (area && form.ThemeName) {
      const still = areaThemeLinks.some(
        at => Number(at.IDArea) === Number(area.id) && String(at.ThemeName) === String(form.ThemeName)
      )
      if (!still) set('ThemeName', '')
    }
  }

  // ── FCM Status ohne Titel-Manipulation ──────────────────────────────────
  const applyFCMStatus = async (status: string): Promise<void> => {
    if (!status.trim()) return
    const cfg = await window.db.fcmstatus.getByStatus(status) as Record<string, unknown> | null
    if (!cfg) return
    const today = new Date().toISOString().slice(0, 10)
    setForm(prev => {
      const next = { ...prev }
      // Kategorie-Substitution
      if (cfg.katFind && cfg.katReplace) {
        const finds    = String(cfg.katFind).split(';')
        const replaces = String(cfg.katReplace).split(';')
        let kat = String(prev.Cat ?? '')
        finds.forEach((f, i) => {
          if (f.trim() && kat.includes(f.trim()))
            kat = kat.replace(f.trim(), (replaces[i] ?? replaces[0] ?? '').trim())
        })
        next.Cat = kat
      }
      // Prio-Regeln
      const applyPrio = (level: 1 | 2 | 3): void => {
        const key = `Prio${level}` as const
        const cur = Number(prev[key] ?? 0)
        const ltV = cfg[`p${level}LtVal`]; const ltS = cfg[`p${level}LtSet`]; const ltN = cfg[`p${level}LtNoop`]
        const eqV = cfg[`p${level}EqVal`]; const eqS = cfg[`p${level}EqSet`]; const eqN = cfg[`p${level}EqNoop`]
        const gtV = cfg[`p${level}GtVal`]; const gtS = cfg[`p${level}GtSet`]; const gtN = cfg[`p${level}GtNoop`]
        if (!ltN && ltV != null && cur < Number(ltV) && ltS != null) next[key] = ltS
        else if (!eqN && eqV != null && cur === Number(eqV) && eqS != null) next[key] = eqS
        else if (!gtN && gtV != null && cur > Number(gtV) && gtS != null) next[key] = gtS
      }
      applyPrio(1); applyPrio(2); applyPrio(3)
      // Datum
      if (cfg.setIstVon)  next.ActBeg  = today
      if (cfg.setIstBis)  next.ActEnd  = today
      if (cfg.setPlanVon) next.Pl1Beg  = today
      if (cfg.setPlanBis) next.Pl1End  = today
      if (cfg.setInfo)    next.binInfo = 1
      // titelText absichtlich NICHT übernommen (User-Anforderung)
      return next
    })
  }

  // ── Plan von Doppelklick: setzt Heute, verschiebt Plan bis wenn nötig ────
  function handlePlanVonDblClick(): void {
    const today   = new Date().toISOString().slice(0, 10)
    const oldFrom = toDateStr(form.Pl1Beg)
    const oldTo   = toDateStr(form.Pl1End)
    let   newTo   = oldTo

    if (oldFrom && oldTo && oldTo < today) {
      const interval = dateDiffDays(oldFrom, oldTo)
      newTo = addDays(today, interval)
    }

    setForm(prev => ({ ...prev, Pl1Beg: today, Pl1End: newTo }))
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    const { id, created_at, updated_at, ...data } = form
    if (Number(data.Sdone) === 1) data.SToday = 0
    await window.db.act.update(id as number, data)
    onSaved({ ...form, ...data })
    setSaving(false)
    onClose()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container">
        <div className="text-on-surface-variant/60 text-sm">{t('fnow.loading')}</div>
      </div>
    )
  }

  const currentThemeId    = allThemes.find(th => String(th.ThemeName) === String(form.ThemeName))?.id
  const visibleStatuses   = statuses.filter(s =>
    Number(s.IDTheme) === 0 || Number(s.IDTheme) === Number(currentThemeId ?? 0)
  )
  const hasPlan           = !!toDateStr(form.Pl1Beg)
  const navTitle          = navStack.length > 0 ? navStack[navStack.length - 1].title : ''

  const tabs: { id: Tab; label: string }[] = [
    { id: 'status',     label: t('fnow.tabStatus')   },
    { id: 'zugeordnet', label: t('fnow.tabAssigned') },
    { id: 'control',    label: t('fnow.tabControl')  },
    { id: 'info',       label: t('fnow.tabInfo')     }
  ]

  // ── Prio helper ─────────────────────────────────────────────────────────
  function PrioSelect({ level, rows }: { level: 1 | 2; rows: Row[] }): JSX.Element {
    const key   = `Prio${level}` as 'Prio1' | 'Prio2'
    const numKey = `Prio${level}` as const
    const txtKey = `Prio${level}Txt` as const
    const cur   = form[key] != null ? String(form[key]) : ''
    if (!rows.length) {
      return (
        <input type="number" className={inputCls}
          value={cur}
          onChange={(e) => set(key, e.target.value ? Number(e.target.value) : null)} />
      )
    }
    return (
      <select className={selectCls} value={cur}
        onChange={(e) => set(key, e.target.value ? Number(e.target.value) : null)}>
        <option value="">—</option>
        {rows.map(r => {
          const nr  = String(r[numKey] ?? '')
          const txt = String(r[txtKey] ?? '')
          return (
            <option key={String(r.id)} value={nr}>
              {nr}{txt ? ` ${txt}` : ''}
            </option>
          )
        })}
      </select>
    )
  }

  // ── Folgeaktivität: display only Nr after selection ──────────────────────
  function prioDisplayValue(prios: Row[], level: 1 | 2): string {
    const key = `Prio${level}` as 'Prio1' | 'Prio2'
    const val = form[key]
    if (val == null || val === '') return ''
    return String(val)
  }

  // suppress linter — prioDisplayValue used for future reference
  void prioDisplayValue

  return (
    <>
      {/* Full-screen, no backdrop overlay */}
      <div className="fixed inset-0 z-50 flex flex-col bg-surface-container overflow-hidden">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/40 bg-surface-container-high flex-shrink-0">
          {navStack.length > 0 && (
            <button
              onClick={navigateBack}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high flex items-center gap-1"
              title={t('fnow.navBack')}
            >
              ← {t('fnow.navBack')}
              {navTitle && <span className="text-on-surface-variant/50 max-w-[120px] truncate ml-1">({navTitle})</span>}
            </button>
          )}
          <input
            className="flex-1 text-lg font-semibold text-on-surface bg-transparent border-none outline-none placeholder-on-surface-variant/40"
            value={String(form.Title ?? '')}
            onChange={(e) => set('Title', e.target.value)}
            placeholder={t('fnow.titlePh')}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? t('fnow.saving') : t('fnow.save')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm hover:bg-surface-container-high"
          >
            {t('fnow.cancel')}
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Main content ─────────────────────────────────────────── */}
          <div className="flex-1 p-5 flex flex-col gap-4 border-r border-outline-variant/40 overflow-y-auto">

            {/* Zeit/Plan — nur wenn Termin (Pl1Beg gesetzt) */}
            {hasPlan && (
              <div className="flex gap-4 text-xs text-on-surface-variant/60">
                {form.ActBeg && <span>Zeit: {String(form.ActBeg).slice(0, 16)}</span>}
                <span>Plan: {toDateStr(form.Pl1Beg)} – {toDateStr(form.Pl1End)}</span>
              </div>
            )}

            {/* Kommentar (ohne TCom-Label) */}
            <div>
              <label className="block text-xs text-on-surface-variant/60 mb-1">{t('fnow.commentLabel')}</label>
              <textarea
                className={textareaCls}
                rows={3}
                value={String(form.Com ?? '')}
                onChange={(e) => set('Com', e.target.value)}
                placeholder={t('fnow.commentPh')}
              />
            </div>

            {/* Text 1 — Rich Text */}
            <div>
              <label className="block text-xs text-on-surface-variant/60 mb-1">{t('fnow.text1Label')}</label>
              <RichEditor
                value={String(form.Ltxt1 ?? '')}
                onChange={(html) => set('Ltxt1', html)}
                rows={5}
                placeholder={t('fnow.text1Ph')}
              />
            </div>

            {/* Text 2 — Rich Text */}
            <div>
              <label className="block text-xs text-on-surface-variant/60 mb-1">{t('fnow.text2Label')}</label>
              <RichEditor
                value={String(form.Ltxt2 ?? '')}
                onChange={(html) => set('Ltxt2', html)}
                rows={5}
                placeholder={t('fnow.text2Ph')}
              />
            </div>

            <div className="flex gap-3 mt-2">
              <div className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3">
                <p className="text-xs font-semibold text-on-surface-variant/60 mb-2">{t('fnow.contactLinks')}</p>
                <p className="text-xs text-on-surface-variant/40 italic">{t('fnow.contactLinksPhase')}</p>
              </div>
              <div className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3">
                <p className="text-xs font-semibold text-on-surface-variant/60 mb-2">{t('fnow.links')}</p>
                <p className="text-xs text-on-surface-variant/40 italic">{t('fnow.linksHint')}</p>
                <p className="text-xs text-on-surface-variant/40 italic">{t('fnow.contactLinksPhase')}</p>
              </div>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div className="w-80 flex-shrink-0 flex flex-col overflow-y-auto bg-surface-container-high">

            {/* Tab-Leiste */}
            <div className="flex bg-surface-container-high border-b border-outline-variant px-2 pt-2 gap-0.5 flex-shrink-0">
              {tabs.map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                    tab === tb.id
                      ? 'bg-surface-container text-on-surface shadow-sm border border-b-0 border-outline-variant'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Tab-Inhalt */}
            <div className="p-4 flex-1 overflow-y-auto">

              {/* ── Status-Tab ─────────────────────────────────────── */}
              {tab === 'status' && (
                <div>
                  {/* Prioritäten als Dropdown mit Bezeichnung */}
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs text-on-surface-variant/60 mb-1">{t('fnow.prio1')}</label>
                      <PrioSelect level={1} rows={prio1s} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-on-surface-variant/60 mb-1">{t('fnow.prio2')}</label>
                      <PrioSelect level={2} rows={prio2s} />
                    </div>
                  </div>

                  {/* Plan von / Plan bis — Doppelklick setzt Heute */}
                  <Field label={t('fnow.planFrom')}>
                    <input
                      type="date"
                      className={inputCls}
                      value={toDateStr(form.Pl1Beg)}
                      onChange={(e) => set('Pl1Beg', e.target.value)}
                      onDoubleClick={handlePlanVonDblClick}
                      title={t('fnow.planFromDblClick')}
                    />
                  </Field>
                  <Field label={t('fnow.planTo')}>
                    <input
                      type="date"
                      className={inputCls}
                      value={toDateStr(form.Pl1End)}
                      onChange={(e) => set('Pl1End', e.target.value)}
                    />
                  </Field>

                  <Field label={t('common.status')}>
                    <select className={selectCls}
                      value={String(form.Status ?? '')}
                      onChange={(e) => { set('Status', e.target.value); applyFCMStatus(e.target.value) }}>
                      <option value="">—</option>
                      {visibleStatuses.map((s) => (
                        <option key={String(s.id)} value={String(s.Status)}>{String(s.Status)}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Bereich — filtert Themen */}
                  <Field label={t('fnow.area')}>
                    <select className={selectCls} value={String(form.AreaName ?? '')}
                      onChange={(e) => handleAreaChange(e.target.value)}>
                      <option value="">—</option>
                      {areas.map((a) => (
                        <option key={String(a.id)} value={String(a.AreaName)}>{String(a.AreaName)}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Thema — gefiltert nach Bereich */}
                  <Field label={t('fnow.theme')}>
                    <select className={selectCls} value={String(form.ThemeName ?? '')}
                      onChange={(e) => set('ThemeName', e.target.value)}>
                      <option value="">—</option>
                      {visibleThemes.map((th) => (
                        <option key={String(th.id)} value={String(th.ThemeName)}>{String(th.ThemeName)}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Kategorie — mehrfach, gefiltert nach Thema */}
                  <Field label={t('fnow.category')}>
                    <div className="flex gap-1.5">
                      <input className={inputCls} readOnly
                        value={String(form.Cat ?? '')}
                        placeholder={t('fdlgcat.none')}
                        onDoubleClick={() => setShowCatPicker(true)} />
                      <button onClick={() => setShowCatPicker(true)}
                        className="flex-shrink-0 px-2.5 py-1 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high"
                        title={t('fdlgcat.title')}>
                        ↗
                      </button>
                    </div>
                  </Field>

                  <Field label={t('fnow.tree')}>
                    <div className="flex gap-1.5">
                      <input className={inputCls} readOnly
                        value={String(form.PSPName ?? '')}
                        placeholder={t('fnow.noNode')}
                        onDoubleClick={() => setShowTreePicker(true)} />
                      <button onClick={() => setShowTreePicker(true)}
                        className="flex-shrink-0 px-2.5 py-1 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high"
                        title={t('fnow.selectNode')}>
                        ↗
                      </button>
                    </div>
                  </Field>

                  {/* Folgeaktivität — Klick navigiert, Zurück-Button im Header */}
                  <Field label={t('fnow.followAct')}>
                    <div className="flex gap-1.5">
                      <input className={inputCls} readOnly
                        value={linkedActTitle}
                        placeholder={t('fnow.noFollowAct')}
                        onDoubleClick={() => setShowActLink(true)} />
                      <button
                        onClick={() =>
                          form.IDActLink
                            ? navigateTo(Number(form.IDActLink))
                            : setShowActLink(true)
                        }
                        className="flex-shrink-0 px-2.5 py-1 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high"
                        title={form.IDActLink ? t('fnow.navToFollowAct') : t('fdlgact.title')}>
                        ↗
                      </button>
                      {form.IDActLink && (
                        <button
                          onClick={() => { set('IDActLink', null); setLinkedActTitle('') }}
                          className="flex-shrink-0 px-2.5 py-1 rounded-lg border border-outline-variant text-error text-xs hover:bg-error-container/10"
                          title={t('fnow.clearFollowAct')}>
                          ✕
                        </button>
                      )}
                    </div>
                  </Field>
                </div>
              )}

              {/* ── Zugeordnet-Tab ─────────────────────────────────── */}
              {tab === 'zugeordnet' && (
                <div>
                  <Field label={t('fnow.assigned')}>
                    <input className={inputCls} value={String(form.CostCtrName ?? '')}
                      onChange={(e) => set('CostCtrName', e.target.value)}
                      placeholder={t('fnow.assignedPh')} />
                  </Field>
                  <Field label={t('fnow.delegated')}>
                    <input className={inputCls} value={String(form.OrderName ?? '')}
                      onChange={(e) => set('OrderName', e.target.value)}
                      placeholder={t('fnow.delegatedPh')} />
                  </Field>
                  <Field label={t('fnow.orderNr')}>
                    <input className={inputCls} value={String(form.OrderNr ?? '')}
                      onChange={(e) => set('OrderNr', e.target.value)} />
                  </Field>
                </div>
              )}

              {/* ── Control-Tab ───────────────────────────────────── */}
              {tab === 'control' && (
                <div className="flex flex-col gap-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded mt-0.5"
                      checked={Number(form.SToday) === 1}
                      onChange={(e) => set('SToday', e.target.checked ? 1 : 0)} />
                    <div>
                      <p className="text-sm text-on-surface">{t('fnow.showToday')}</p>
                      <p className="text-xs text-on-surface-variant/60">{t('fnow.showTodayHint')}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded mt-0.5"
                      checked={Number(form.Sdone) === 1}
                      onChange={(e) => {
                        const v = e.target.checked ? 1 : 0
                        set('Sdone', v)
                        if (v === 1) set('SToday', 0)
                      }} />
                    <div>
                      <p className="text-sm text-on-surface">{t('fnow.done')}</p>
                      <p className="text-xs text-on-surface-variant/60">{t('fnow.doneHint')}</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded"
                      checked={Number(form.SinWork) === 1}
                      onChange={(e) => set('SinWork', e.target.checked ? 1 : 0)} />
                    <span className="text-sm text-on-surface">{t('fnow.inWork')}</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded mt-0.5"
                      checked={Number(form.SInfo) === 1}
                      onChange={(e) => set('SInfo', e.target.checked ? 1 : 0)} />
                    <div>
                      <p className="text-sm text-on-surface">{t('fnow.actInfo')}</p>
                      <p className="text-xs text-on-surface-variant/60">{t('fnow.actInfoHint')}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded mt-0.5"
                      checked={Number(form.SDetailStat) === 1}
                      onChange={(e) => set('SDetailStat', e.target.checked ? 1 : 0)} />
                    <div>
                      <p className="text-sm text-on-surface">{t('fnow.detailLog')}</p>
                      <p className="text-xs text-on-surface-variant/60">{t('fnow.detailLogHint')}</p>
                    </div>
                  </label>
                </div>
              )}

              {/* ── Info-Tab ──────────────────────────────────────── */}
              {tab === 'info' && (
                <div>
                  <div className="text-xs text-on-surface-variant/60 flex flex-col gap-1 mb-4">
                    {form.dateCreated && <span>{t('fnow.created')} {String(form.dateCreated).slice(0, 10)}</span>}
                    {form.dateEnd && <span>{t('fnow.completed')} {String(form.dateEnd).slice(0, 10)}</span>}
                    {form.IDSQL && <span>{t('fnow.query')} {String(form.IDSQL)}</span>}
                    {form.IFName && <span>{t('fnow.interface')} {String(form.IFName)}</span>}
                  </div>
                  {logs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                          {t('fnow.log', { count: logs.length })}
                        </p>
                        <button
                          onClick={async () => { await window.db.actlog.deleteByAct(currentId); setLogs([]) }}
                          className="text-xs text-error hover:text-red-600"
                        >
                          {t('fnow.deleteLog')}
                        </button>
                      </div>
                      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                        {logs.map((l) => (
                          <div key={l.id as number} className="text-xs bg-surface-container-low rounded-lg px-2 py-1.5">
                            <span className="text-on-surface-variant/60">{String(l.changed_at).slice(0, 16)}</span>
                            <span className="mx-1 text-on-surface-variant font-medium">{String(l.field_name)}</span>
                            <span className="text-on-surface-variant/60 line-through">{String(l.old_value).slice(0, 20)}</span>
                            <span className="mx-1">→</span>
                            <span className="text-on-surface">{String(l.new_value).slice(0, 20)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {logs.length === 0 && Number(form.SDetailStat) === 1 && (
                    <p className="text-xs text-on-surface-variant/60">{t('fnow.noLogEntries')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Dialoge ───────────────────────────────────────────────── */}
      {showTreePicker && (
        <TreePickerModal
          current={String(form.PSPName ?? '')}
          onConfirm={(name) => { set('PSPName', name); setShowTreePicker(false) }}
          onClose={() => setShowTreePicker(false)}
        />
      )}

      {showCatPicker && (
        <FdlgCatModal
          cats={visibleCats}
          current={String(form.Cat ?? '')}
          onConfirm={(val) => { set('Cat', val); setShowCatPicker(false) }}
          onClose={() => setShowCatPicker(false)}
        />
      )}

      {showActLink && (
        <FdlgActModal
          currentId={currentId}
          currentTitle={String(form.Title ?? '')}
          onConfirm={(id, title) => { set('IDActLink', id); setLinkedActTitle(title); setShowActLink(false) }}
          onClose={() => setShowActLink(false)}
        />
      )}
    </>
  )
}

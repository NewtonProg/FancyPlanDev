import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TreePickerModal from '../components/TreePickerModal'
import FdlgCatModal from '../components/FdlgCatModal'
import FdlgActModal from '../components/FdlgActModal'
import FdlgTelModal from '../components/FdlgTelModal'
import RichEditor from '../components/RichEditor'
import LinkPanel from '../components/LinkPanel'

type Act = Record<string, unknown>
type Row = Record<string, unknown>
type Tab = 'status' | 'kontakt' | 'links' | 'control' | 'info' | 'zugeordnet' | 'termine' | 'timer'
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

function parsePlanDate(v: unknown): Date | null {
  if (v == null || v === '') return null
  const n = Number(v)
  if (!isNaN(n) && Number.isInteger(n) && n > 0 && n < 99999) {
    return new Date(-2209161600000 + n * 86400000)
  }
  const s = String(v)
  if (s.length >= 10) {
    const d = new Date(s.slice(0, 10) + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function FNowModal({
  actId,
  onClose,
  onSaved,
  formName = 'FAct'
}: {
  actId: number
  onClose: () => void
  onSaved: (act: Act) => void
  formName?: string
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
  const [linkedTels,     setLinkedTels]      = useState<Row[]>([])
  const [showTelPicker,  setShowTelPicker]   = useState(false)
  const [catContacts,    setCatContacts]    = useState<Row[]>([])
  const [actTermins,     setActTermins]     = useState<Row[]>([])
  const [linkDate,       setLinkDate]       = useState(new Date().toISOString().slice(0, 10))
  const [linkDateTermins, setLinkDateTermins] = useState<Row[]>([])

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
      window.db.prio.getAll(1, formName),
      window.db.prio.getAll(2, formName)
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
      window.db.acttel.getByAct(currentId).then((tels) => {
        if (!cancelled) setLinkedTels(tels as Row[])
      })
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [currentId])

  useEffect(() => {
    if (tab !== 'kontakt' || !form.Cat) { setCatContacts([]); return }
    window.db.tel.getByCat(String(form.Cat)).then(rows => setCatContacts(rows as Row[]))
  }, [tab, form.Cat])

  useEffect(() => {
    if (tab === 'termine') {
      window.db.termin.getByAct(currentId).then(rows => setActTermins(rows))
    }
  }, [tab, currentId])

  const loadLinkDateTermins = async (date: string): Promise<void> => {
    const rows = await window.db.termin.getByDate(date)
    setLinkDateTermins(rows)
  }

  const handleLinkTermin = async (terminId: number): Promise<void> => {
    await window.db.termin.update(terminId, { act_id: currentId })
    const rows = await window.db.termin.getByAct(currentId)
    setActTermins(rows)
    setLinkDateTermins([])
  }

  const handleUnlinkTermin = async (terminId: number): Promise<void> => {
    await window.db.termin.update(terminId, { act_id: null })
    setActTermins(prev => prev.filter(t => (t.id as number) !== terminId))
  }

  const set = (key: string, value: unknown): void =>
    setForm((prev) => ({ ...prev, [key]: value }))

  function prependDate(field: 'Ltxt1' | 'Ltxt2'): void {
    const d = new Date()
    const dateStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
    const cur = String(form[field] ?? '')
    set(field, cur ? dateStr + '<br>' + cur : dateStr)
  }

  // ── Bereich→Thema filtering ──────────────────────────────────────────────
  const selectedArea  = areas.find(a => String(a.AreaName) === String(form.AreaName))
  const visibleThemes: Row[] = selectedArea
    ? allThemes.filter(t => {
        if (Number(t.IDArea) === 0) return true
        if (Number(t.IDArea) === Number(selectedArea.id)) return true
        return areaThemeLinks.some(at => Number(at.IDArea) === Number(selectedArea.id) && Number(at.IDTheme) === Number(t.id))
      })
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
      // Text1 / Text2 setzen wenn in FCMStatus eingetragen
      if (cfg.text1 && String(cfg.text1).trim()) next.Ltxt1 = String(cfg.text1)
      if (cfg.text2 && String(cfg.text2).trim()) next.Ltxt2 = String(cfg.text2)
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
    data.TodayEdited = new Date().toISOString().slice(0, 10)
    await window.db.act.update(id as number, data)
    onSaved({ ...form, ...data })
    setSaving(false)
    onClose()
  }

  // ── Timer helpers ────────────────────────────────────────────────────────
  const [tick, setTick] = useState(0)
  const anyActive = [1,2,3,4].some(n => Number(form[`Timer${n}Active`]) === 1)
  useEffect(() => {
    if (!anyActive) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [anyActive])

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

  const daysLeft = (() => {
    const due = parsePlanDate(form.Pl1End)
    if (!due) return null
    const today = new Date(); today.setHours(0, 0, 0, 0); due.setHours(0, 0, 0, 0)
    return Math.round((due.getTime() - today.getTime()) / 86_400_000)
  })()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'status',     label: t('fnow.tabStatus')   },
    { id: 'kontakt',    label: t('fnow.tabKontakt')  },
    { id: 'links',      label: t('fnow.tabLinks')    },
    { id: 'control',    label: t('fnow.tabControl')  },
    { id: 'info',       label: t('fnow.tabInfo')     },
    { id: 'zugeordnet', label: t('fnow.tabAssigned') },
    { id: 'termine',    label: t('fnow.tabTermine')  },
    { id: 'timer',      label: 'Timer'               }
  ]

  function timerElapsedSec(n: number, _tick?: number): number {
    void _tick
    if (Number(form[`Timer${n}Active`]) !== 1) return 0
    const stamp = String(form[`Timer${n}Stamp`] ?? '')
    if (!stamp) return 0
    return Math.max(0, Math.floor((Date.now() - new Date(stamp).getTime()) / 1000))
  }

  function formatDur(totalHours: number, extraSec = 0): string {
    const totalSec = Math.round(totalHours * 3600) + extraSec
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m`
    return `${m}m ${s.toString().padStart(2,'0')}s`
  }

  async function startTimer(n: number): Promise<void> {
    const now = new Date().toISOString()
    const begFirstKey = `Timer${n}BegFirst`
    const updates: Record<string, unknown> = {
      [`Timer${n}Active`]: 1,
      [`Timer${n}Stamp`]:  now,
      [`Timer${n}Beg`]:    now,
      [`Timer${n}BegToday`]: now,
    }
    if (!form[begFirstKey]) updates[begFirstKey] = now
    setForm(prev => ({ ...prev, ...updates }))
    await window.db.act.update(currentId, updates)
  }

  async function stopTimer(n: number): Promise<void> {
    const now = new Date().toISOString()
    const elapsed = timerElapsedSec(n) / 3600
    const prev = parseFloat(String(form[`Timer${n}sngDur`] ?? 0)) || 0
    const total = prev + elapsed
    const updates: Record<string, unknown> = {
      [`Timer${n}Active`]:      0,
      [`Timer${n}End`]:         now,
      [`Timer${n}EndToday`]:    now,
      [`Timer${n}sngDur`]:      total,
      [`Timer${n}Dur`]:         formatDur(total),
      [`Timer${n}sngDurToday`]: elapsed,
      [`Timer${n}DurToday`]:    formatDur(elapsed),
    }
    setForm(prev2 => ({ ...prev2, ...updates }))
    await window.db.act.update(currentId, updates)
  }

  async function resetTimer(n: number): Promise<void> {
    const updates: Record<string, unknown> = {
      [`Timer${n}Active`]: 0, [`Timer${n}Stamp`]: null,
      [`Timer${n}Beg`]: null, [`Timer${n}BegFirst`]: null, [`Timer${n}BegToday`]: null,
      [`Timer${n}End`]: null, [`Timer${n}EndToday`]: null,
      [`Timer${n}sngDur`]: 0, [`Timer${n}Dur`]: null,
      [`Timer${n}sngDurToday`]: 0, [`Timer${n}DurToday`]: null,
    }
    setForm(prev => ({ ...prev, ...updates }))
    await window.db.act.update(currentId, updates)
  }

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
          <button
            onClick={() => window.db.help.open('fnow')}
            title={t('common.help')}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-outline-variant/50 text-on-surface-variant/50 hover:border-primary/40 hover:text-primary text-sm transition-colors"
          >
            ?
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
              <label className="block text-xs text-on-surface-variant/60 mb-1 cursor-pointer select-none" title="Doppelklick: Datum einfügen" onDoubleClick={() => prependDate('Ltxt1')}>{t('fnow.text1Label')}</label>
              <RichEditor
                value={String(form.Ltxt1 ?? '')}
                onChange={(html) => set('Ltxt1', html)}
                rows={5}
                placeholder={t('fnow.text1Ph')}
              />
            </div>

            {/* Text 2 — Rich Text */}
            <div>
              <label className="block text-xs text-on-surface-variant/60 mb-1 cursor-pointer select-none" title="Doppelklick: Datum einfügen" onDoubleClick={() => prependDate('Ltxt2')}>{t('fnow.text2Label')}</label>
              <RichEditor
                value={String(form.Ltxt2 ?? '')}
                onChange={(html) => set('Ltxt2', html)}
                rows={5}
                placeholder={t('fnow.text2Ph')}
              />
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div className="w-96 flex-shrink-0 flex flex-col overflow-y-auto bg-surface-container-high">

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
                      onChange={(e) => {
                        const newFrom = e.target.value
                        setForm(prev => {
                          const endStr = toDateStr(prev.Pl1End)
                          const clampedEnd = endStr && endStr < newFrom ? newFrom : endStr
                          return { ...prev, Pl1Beg: newFrom, Pl1End: clampedEnd ?? prev.Pl1End }
                        })
                      }}
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

                  {daysLeft !== null && (
                    <Field label={t('fnow.daysLeft')}>
                      <div className={
                        daysLeft <= 0
                          ? 'w-full text-sm font-semibold rounded-lg px-2.5 py-1.5 bg-red-950/60 border border-red-500/60 text-red-400'
                          : daysLeft === 1
                            ? 'w-full text-sm font-semibold rounded-lg px-2.5 py-1.5 bg-amber-950/40 border border-amber-500/50 text-amber-400'
                            : 'w-full text-sm rounded-lg px-2.5 py-1.5 bg-surface-container border border-outline-variant text-on-surface'
                      }>{daysLeft}</div>
                    </Field>
                  )}

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
                <div className="flex flex-col gap-3">

                  {/* ANSPRECHPARTNER */}
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2">
                      {t('fnow.assignedContacts')}
                    </p>
                    {linkedTels.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/40 italic mb-2">{t('fnow.noContacts')}</p>
                    ) : (
                      <div className="flex flex-col gap-1.5 mb-2">
                        {linkedTels.map((c) => (
                          <div key={String(c.acttel_id ?? c.id)}
                            onDoubleClick={() => {
                              window.dispatchEvent(new CustomEvent('fp:open-contact', { detail: { telId: Number(c.id), actId: currentId } }))
                              onClose()
                            }}
                            title={t('fnow.dblClickContact')}
                            className="cursor-default select-none flex flex-col gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-high transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="flex-1 text-sm text-on-surface truncate">
                                {[c.FirstName, c.SurName].filter(Boolean).join(' ') || String(c.Company ?? '—')}
                              </span>
                              {c.Company && <span className="text-xs text-on-surface-variant/50 truncate max-w-[100px]">{String(c.Company)}</span>}
                              <button
                                onClick={async () => {
                                  await window.db.acttel.remove(currentId, Number(c.id))
                                  setLinkedTels((prev) => prev.filter((x) => x.acttel_id !== c.acttel_id))
                                }}
                                className="text-error/50 hover:text-error text-xs leading-none flex-shrink-0 transition-colors">✕</button>
                            </div>
                            {/* Abtlg + Team aus TTel */}
                            {(c.Departm || c.Grp1 || c.Grp2) && (
                              <div className="flex gap-3 text-xs text-on-surface-variant/60">
                                {c.Departm && (
                                  <span><span className="text-on-surface-variant/40">{t('fnow.contactDepartm')}:</span> {String(c.Departm)}</span>
                                )}
                                {(c.Grp1 || c.Grp2) && (
                                  <span><span className="text-on-surface-variant/40">{t('fnow.contactTeam')}:</span> {[c.Grp1, c.Grp2].filter(Boolean).join(' / ')}</span>
                                )}
                              </div>
                            )}
                            <input
                              key={`com-${String(c.acttel_id)}`}
                              className="w-full text-xs border border-outline-variant/30 rounded px-2 py-0.5 bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary/30 text-on-surface placeholder-on-surface-variant/30"
                              placeholder="Kommentar…"
                              defaultValue={String(c.acttel_Com ?? '')}
                              onBlur={async (e) => {
                                if (c.acttel_id != null) {
                                  await window.db.acttel.updateCom(Number(c.acttel_id), e.target.value)
                                  setLinkedTels((prev) => prev.map((x) => x.acttel_id === c.acttel_id ? { ...x, acttel_Com: e.target.value } : x))
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setShowTelPicker(true)}
                      className="w-full text-xs border border-dashed border-outline-variant/50 rounded-lg px-2.5 py-1.5 text-on-surface-variant/60 hover:border-primary/40 hover:text-primary transition-colors text-left">
                      {t('fnow.searchContact')}
                    </button>
                  </div>

                  {/* Kostenstelle / Auftrag / Projekt */}
                  <div className="border-t border-outline-variant/30 pt-3">
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
                    <Field label={t('fnow.projektName')}>
                      <input className={inputCls} value={String(form.ProjektName ?? '')}
                        onChange={(e) => set('ProjektName', e.target.value)}
                        placeholder={t('fnow.projektNamePh')} />
                    </Field>
                  </div>

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

              {/* ── Links-Tab ─────────────────────────────────────── */}
              {tab === 'links' && (
                <div className="py-1">
                  <LinkPanel entityType="act" entityId={currentId} />
                </div>
              )}

              {/* ── Kontakt-Tab ───────────────────────────────────── */}
              {tab === 'kontakt' && (
                <div className="flex flex-col gap-3">

                  {/* Manuell verknüpfte Ansprechpartner */}
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2">
                      {t('fnow.contacts')}
                    </p>
                    {linkedTels.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/40 italic mb-2">{t('fnow.noContacts')}</p>
                    ) : (
                      <div className="flex flex-col gap-1.5 mb-2">
                        {linkedTels.map((c) => (
                          <div key={String(c.acttel_id ?? c.id)}
                            onDoubleClick={() => {
                              window.dispatchEvent(new CustomEvent('fp:open-contact', { detail: { telId: Number(c.id), actId: currentId } }))
                              onClose()
                            }}
                            title={t('fnow.dblClickContact')}
                            className="cursor-default select-none flex flex-col gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-high transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="flex-1 text-sm text-on-surface truncate">
                                {[c.FirstName, c.SurName].filter(Boolean).join(' ') || String(c.Company ?? '—')}
                              </span>
                              {c.Company && <span className="text-xs text-on-surface-variant/50 truncate max-w-[100px]">{String(c.Company)}</span>}
                              <button
                                onClick={async () => {
                                  await window.db.acttel.remove(currentId, Number(c.id))
                                  setLinkedTels((prev) => prev.filter((x) => x.acttel_id !== c.acttel_id))
                                }}
                                className="text-error/50 hover:text-error text-xs leading-none flex-shrink-0 transition-colors">✕</button>
                            </div>
                            <input
                              key={`com-${String(c.acttel_id)}`}
                              className="w-full text-xs border border-outline-variant/30 rounded px-2 py-0.5 bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary/30 text-on-surface placeholder-on-surface-variant/30"
                              placeholder="Kommentar…"
                              defaultValue={String(c.acttel_Com ?? '')}
                              onBlur={async (e) => {
                                if (c.acttel_id != null) {
                                  await window.db.acttel.updateCom(Number(c.acttel_id), e.target.value)
                                  setLinkedTels((prev) => prev.map((x) => x.acttel_id === c.acttel_id ? { ...x, acttel_Com: e.target.value } : x))
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Kontakt verknüpfen */}
                    <button
                      onClick={() => setShowTelPicker(true)}
                      className="w-full text-xs border border-dashed border-outline-variant/50 rounded-lg px-2.5 py-1.5 text-on-surface-variant/60 hover:border-primary/40 hover:text-primary transition-colors text-left">
                      {t('fnow.searchContact')}
                    </button>
                  </div>

                  {/* Kontakte nach Kategorie */}
                  {(form.Cat || catContacts.length > 0) && (
                    <div className="border-t border-outline-variant/30 pt-3">
                      <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2">
                        Kontakte nach Kategorie
                      </p>
                      {!form.Cat && (
                        <p className="text-xs text-on-surface-variant/40 italic">{t('fnow.noCatForContacts')}</p>
                      )}
                      {form.Cat && catContacts.length === 0 && (
                        <p className="text-xs text-on-surface-variant/40 italic">{t('fnow.noContactsForCat')}</p>
                      )}
                      <div className="flex flex-col gap-1">
                        {catContacts.map(tel => (
                          <div key={tel.id as number}
                            onDoubleClick={() => {
                              window.dispatchEvent(new CustomEvent('fp:open-contact', { detail: { telId: Number(tel.id), actId: currentId } }))
                              onClose()
                            }}
                            title={t('fnow.dblClickContact')}
                            className="cursor-default select-none rounded-lg px-2.5 py-2 flex items-center gap-3 hover:bg-surface-container-high transition-colors">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                              {String(tel.FirstName ?? tel.Company ?? '?')[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-on-surface truncate">
                                {[tel.FirstName, tel.SurName].filter(Boolean).join(' ') || String(tel.Company ?? '—')}
                              </p>
                              {(tel.FirstName || tel.SurName) && tel.Company && (
                                <p className="text-xs text-on-surface-variant/60 truncate">{String(tel.Company)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

              {/* ── Termine-Tab ──────────────────────────────────── */}
              {tab === 'termine' && (
                <div className="flex flex-col gap-4">

                  {/* Verknüpfte Termine */}
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2">
                      {t('fnow.terminLinked')}
                    </p>
                    {actTermins.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/50">{t('fnow.terminNone')}</p>
                    ) : actTermins.map((tr) => (
                      <div key={tr.id as number}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface truncate font-medium">{String(tr.title ?? '')}</p>
                          <p className="text-xs text-on-surface-variant/60">
                            {String(tr.termin_date ?? '')}
                            {tr.time_start ? ` · ${String(tr.time_start)}${tr.time_end ? `–${String(tr.time_end)}` : ''}` : ''}
                          </p>
                        </div>
                        <button onClick={() => handleUnlinkTermin(tr.id as number)}
                          className="text-on-surface-variant/40 hover:text-error transition-colors flex-shrink-0"
                          title={t('fnow.terminUnlink')}>
                          <span className="material-symbols-outlined text-[16px]">link_off</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Termin verknüpfen */}
                  <div className="border-t border-outline-variant/20 pt-3">
                    <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-2">
                      {t('fnow.terminLink')}
                    </p>
                    <div className="flex gap-2 mb-2">
                      <input type="date" value={linkDate}
                        onChange={(e) => setLinkDate(e.target.value)}
                        className="flex-1 text-sm bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      <button onClick={() => loadLinkDateTermins(linkDate)}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors">
                        {t('fnow.terminSearch')}
                      </button>
                    </div>
                    {linkDateTermins.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {linkDateTermins.map((tr) => (
                          <button key={tr.id as number}
                            onClick={() => handleLinkTermin(tr.id as number)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/20 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors">
                            <span className="material-symbols-outlined text-[14px] text-primary/50">add_link</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-on-surface truncate">{String(tr.title ?? '')}</p>
                              <p className="text-xs text-on-surface-variant/60">
                                {tr.time_start ? `${String(tr.time_start)}${tr.time_end ? `–${String(tr.time_end)}` : ''}` : 'Ganztägig'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {linkDateTermins.length === 0 && linkDate && (
                      <p className="text-xs text-on-surface-variant/50">{t('fnow.terminDateEmpty')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Timer-Tab ────────────────────────────────────── */}
              {tab === 'timer' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-on-surface-variant/50 mb-1">
                    Zeitmessung pro Aktivität — bis zu 4 unabhängige Timer.
                  </p>
                  {/* tick drives re-renders for live elapsed display */}
                  {[1,2,3,4].map((n) => {
                    const active = Number(form[`Timer${n}Active`]) === 1
                    const totalHours = parseFloat(String(form[`Timer${n}sngDur`] ?? 0)) || 0
                    const elapsedSec = active ? timerElapsedSec(n, tick) : 0
                    const begFirst = String(form[`Timer${n}BegFirst`] ?? '')
                    return (
                      <div key={n} className={`rounded-xl border px-4 py-3 flex flex-col gap-2 transition-colors ${
                        active ? 'border-primary/40 bg-primary/6' : 'border-outline-variant/20 bg-surface-container-low'
                      }`}>
                        <div className="flex items-center gap-3">
                          {active && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                          )}
                          <span className="text-sm font-semibold text-on-surface flex-1">Timer {n}</span>
                          {totalHours > 0 && (
                            <span className="text-xs text-on-surface-variant/60 font-mono">
                              Gesamt: {formatDur(totalHours, elapsedSec)}
                            </span>
                          )}
                          {active && elapsedSec > 0 && (
                            <span className="text-xs font-mono text-primary">
                              +{formatDur(0, elapsedSec)}
                            </span>
                          )}
                        </div>

                        {begFirst && (
                          <p className="text-[10px] text-on-surface-variant/40">
                            Erststart: {new Date(begFirst).toLocaleString('de-DE')}
                          </p>
                        )}

                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => active ? stopTimer(n) : startTimer(n)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              active
                                ? 'bg-error/15 text-error hover:bg-error/25'
                                : 'bg-primary/15 text-primary hover:bg-primary/25'
                            }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {active ? 'stop' : 'play_arrow'}
                            </span>
                            {active ? 'Stopp' : 'Start'}
                          </button>
                          {(totalHours > 0 || active) && (
                            <button
                              onClick={() => resetTimer(n)}
                              title="Zurücksetzen"
                              className="px-2.5 py-1.5 rounded-lg text-xs text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-colors">
                              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
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

      {showTelPicker && (
        <FdlgTelModal
          excludeIds={new Set(linkedTels.map((x) => Number(x.id)))}
          onSelect={async (c) => {
            await window.db.acttel.add(currentId, Number(c.id))
            const fresh = await window.db.acttel.getByAct(currentId)
            setLinkedTels(fresh as Row[])
            setShowTelPicker(false)
          }}
          onClose={() => setShowTelPicker(false)}
        />
      )}
    </>
  )
}

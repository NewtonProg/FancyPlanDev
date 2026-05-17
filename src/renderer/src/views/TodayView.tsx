import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import FNowModal from './FNowModal'
import PlanVariantPanel from '../components/PlanVariantPanel'

type Act = Record<string, unknown>
type Termin = Record<string, unknown>
type Row = Record<string, unknown>
type ViewMode = 'today' | 'verschoben' | 'erledigt' | 'bearbeitet' | 'geplant'

function parsePlanDate(v: unknown): Date | null {
  if (v == null || v === '') return null
  const n = Number(v)
  if (!isNaN(n) && Number.isInteger(n) && n > 0 && n < 99999) {
    // Access/Excel date serial: days since 1899-12-30
    return new Date(-2209161600000 + n * 86400000)
  }
  const s = String(v)
  if (s.length >= 10) {
    const d = new Date(s.slice(0, 10) + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function computeTage(act: Act): number | null {
  const due = parsePlanDate(act.Pl1End)
  if (!due) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const STATUS_COLORS: Record<string, { border: string; badge: string; glow: string }> = {
  progress: {
    border: 'border-l-primary/40',
    badge: 'bg-primary-container/10 text-secondary-fixed-dim/70 border border-secondary-fixed-dim/20',
    glow: 'rgba(173, 198, 255, 0.05)',
  },
  waiting: {
    border: 'border-l-tertiary/40',
    badge: 'bg-tertiary-container/10 text-tertiary-fixed-dim/70 border border-tertiary-fixed-dim/20',
    glow: 'rgba(255, 181, 149, 0.05)',
  },
  overdue: {
    border: 'border-l-error/40',
    badge: 'bg-error-container/10 text-error/70 border border-error/20',
    glow: 'rgba(255, 180, 171, 0.05)',
  },
  default: {
    border: 'border-l-on-surface-variant/30',
    badge: 'bg-surface-container/30 text-on-surface-variant/70',
    glow: 'rgba(193, 198, 215, 0.05)',
  },
}

function getStatusColors(status: unknown): { border: string; badge: string; glow: string } {
  const s = String(status || '').toLowerCase()
  if (s.includes('progress') || s.includes('aktiv') || s.includes('bearbeitung')) return STATUS_COLORS.progress
  if (s.includes('wait') || s.includes('warten') || s.includes('pending')) return STATUS_COLORS.waiting
  if (s.includes('overdue') || s.includes('überfällig') || s.includes('late')) return STATUS_COLORS.overdue
  return STATUS_COLORS.default
}


function PrioBox({ level, value, isSort, sortDir, onClick }: {
  level: 1 | 2
  value: unknown
  isSort: boolean
  sortDir: 'asc' | 'desc'
  onClick: () => void
}): JSX.Element {
  const cur = value != null && value !== '' ? String(value) : '—'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-[9px] uppercase tracking-wider font-semibold text-on-surface-variant/40 text-center">
        P{level}{isSort ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </p>
      <div
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className="rounded-lg min-w-[36px] h-[32px] flex items-center justify-center border cursor-pointer transition-colors bg-surface-container-highest/20 border-outline-variant/10 hover:border-primary/30"
      >
        <span className="text-sm font-bold text-on-surface-variant/60">{cur}</span>
      </div>
    </div>
  )
}

function ActCard({
  act,
  onToggleDone,
  onPostpone,
  onDelete,
  onOpen,
  prioSort,
  onPrioSort,
}: {
  act: Act
  onToggleDone: (id: number, current: number) => void
  onPostpone: (id: number) => void
  onDelete: (id: number) => void
  onOpen: (id: number) => void
  prioSort: { key: 'Prio1' | 'Prio2'; dir: 'asc' | 'desc' } | null
  onPrioSort: (key: 'Prio1' | 'Prio2') => void
}): JSX.Element {
  const id = act.id as number
  const done = Number(act.Sdone) === 1
  const sc = getStatusColors(act.Status)
  const tage = computeTage(act)

  return (
    <div
      className={`activity-card rounded-xl p-4 flex items-start gap-4 border-l-2 ${sc.border} transition-all`}
      style={{ '--glow-color': sc.glow } as React.CSSProperties}
    >
      {/* Left: title + theme + buttons */}
      <div className={`flex flex-col gap-1.5 flex-grow self-stretch justify-between ${done ? 'opacity-50' : ''}`}>
        <div>
          <button
            onClick={() => onOpen(id)}
            className="text-base font-semibold text-on-surface opacity-90 text-left hover:text-primary transition-colors w-full leading-snug"
          >
            <span className={done ? 'line-through' : ''}>{String(act.Title || '')}</span>
          </button>
          {!!act.ThemeName && (
            <p className="text-on-surface-variant/70 text-body-sm mt-0.5">{String(act.ThemeName)}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onPostpone(id)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high/20 backdrop-blur-md text-on-surface-variant/60 hover:bg-surface-variant transition-colors text-body-sm border border-outline-variant/10"
          >
            <span className="material-symbols-outlined text-[14px] opacity-70">event_repeat</span>
            Verschieben
          </button>
          <button
            onClick={() => onToggleDone(id, Number(act.Sdone))}
            className={`flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur-md transition-colors text-body-sm border ${
              done
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-surface-container-high/20 text-on-surface-variant/60 hover:bg-surface-variant border-outline-variant/10'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] opacity-70">check_circle</span>
            {done ? 'Erledigt' : 'Fertigstellen'}
          </button>
          <button
            onClick={() => onDelete(id)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high/20 backdrop-blur-md text-on-surface-variant/60 hover:bg-error-container/30 hover:text-error transition-colors text-body-sm border border-outline-variant/10"
          >
            <span className="material-symbols-outlined text-[14px] opacity-70">delete</span>
            Löschen
          </button>
        </div>
      </div>

      {/* Right: P1/P2/Tage in one row, Status below */}
      <div className="flex flex-col items-end flex-shrink-0 gap-2 pr-1">
        <div className="flex gap-2 items-end">
          <PrioBox level={1} value={act.Prio1}
            isSort={prioSort?.key === 'Prio1'} sortDir={prioSort?.key === 'Prio1' ? prioSort.dir : 'asc'}
            onClick={() => onPrioSort('Prio1')} />
          <PrioBox level={2} value={act.Prio2}
            isSort={prioSort?.key === 'Prio2'} sortDir={prioSort?.key === 'Prio2' ? prioSort.dir : 'asc'}
            onClick={() => onPrioSort('Prio2')} />
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-[9px] uppercase tracking-wider font-semibold text-on-surface-variant/40 text-center">Tage</p>
            <div className={`rounded-lg min-w-[44px] h-[32px] flex items-center justify-center border ${
              tage === null
                ? 'bg-surface-container-highest/20 border-outline-variant/10'
                : tage <= 0
                  ? 'bg-red-950/60 border-red-500/60'
                  : tage === 1
                    ? 'bg-amber-950/40 border-amber-500/50'
                    : 'bg-surface-container-highest/20 border-outline-variant/10'
            }`}>
              <span className={`text-base font-bold ${
                tage === null
                  ? 'text-on-surface-variant/30'
                  : tage <= 0
                    ? 'text-red-400'
                    : tage === 1
                      ? 'text-amber-400'
                      : 'text-on-surface-variant/60'
              }`}>{tage === null ? '--' : tage}</span>
            </div>
          </div>
        </div>
        {!!act.Status && (
          <span className={`px-3 py-1 rounded-md text-sm flex items-center min-h-[32px] ${sc.badge}`}>
            {String(act.Status)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function TodayView(): JSX.Element {
  const { t } = useTranslation()
  const [acts, setActs] = useState<Act[]>([])
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(false)
  const [catFilter, setCatFilter] = useState<string>('all')
  const [openActId, setOpenActId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [showVariantPanel, setShowVariantPanel] = useState(false)
  const [termins, setTermins] = useState<Termin[]>([])
  const [recurringDue, setRecurringDue] = useState<Termin[]>([])
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [themeFilter, setThemeFilter] = useState<string>('all')
  const [openFilter, setOpenFilter] = useState<'area' | 'theme' | 'cat' | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('today')
  const [bottomVon, setBottomVon] = useState<string>(new Date().toISOString().slice(0, 10))
  const [bottomBis, setBottomBis] = useState<string>(new Date().toISOString().slice(0, 10))
  const [prioSort, setPrioSort] = useState<{ key: 'Prio1' | 'Prio2'; dir: 'asc' | 'desc' } | null>({ key: 'Prio1', dir: 'asc' })

  // suppress unused-variable warnings for state that exists but isn't rendered yet
  void termins
  void setTermins
  void recurringDue
  void setRecurringDue

  const todayIso = new Date().toISOString().slice(0, 10)
  const isToday = selectedDate === todayIso

  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const shiftDate = (days: number): void => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let rows: Act[]
      if (viewMode === 'verschoben') {
        rows = await window.db.act.getAll({ svFrom: selectedDate, svTo: selectedDate })
      } else if (viewMode === 'erledigt') {
        rows = await window.db.act.getAll({ doneFrom: selectedDate, doneTo: selectedDate })
      } else if (viewMode === 'bearbeitet') {
        rows = await window.db.act.getAll({ editedFrom: bottomVon || selectedDate, editedTo: bottomBis || selectedDate })
      } else if (viewMode === 'geplant') {
        rows = await window.db.act.getAll({ planFrom: bottomVon || selectedDate, planTo: bottomBis || selectedDate, Sdone: 0 })
      } else {
        const isTodayDate = selectedDate === new Date().toISOString().slice(0, 10)
        if (isTodayDate) {
          rows = await window.db.act.getAll({ SToday: 1, forDate: selectedDate })
        } else {
          rows = await window.db.act.getAll({ planFrom: selectedDate, planTo: selectedDate })
        }
      }
      setActs(rows)
    } catch {
      setActs([])
    } finally {
      setLoading(false)
    }
  }, [viewMode, selectedDate, bottomVon, bottomBis])

  useEffect(() => { load() }, [load])

  const handleToggleDone = async (id: number, current: number): Promise<void> => {
    const next = current === 1 ? 0 : 1
    const update: Record<string, unknown> = { Sdone: next }
    if (next === 1) {
      update.SToday = 0
      update.TodayDone = new Date().toISOString().slice(0, 10)
    }
    await window.db.act.update(id, update)
    setActs((prev) => prev.map((a) => (a.id === id ? { ...a, Sdone: next, ...(next === 1 ? { SToday: 0 } : {}) } : a)))
  }

  const handlePostpone = async (id: number): Promise<void> => {
    await window.db.act.update(id, { SToday: 0, ToDayShifted: new Date().toISOString().slice(0, 10) })
    setActs((prev) => prev.filter((a) => a.id !== id))
  }

  const handleDelete = async (id: number): Promise<void> => {
    await window.db.act.delete(id)
    setActs((prev) => prev.filter((a) => a.id !== id))
  }

  const handlePrioSort = (key: 'Prio1' | 'Prio2'): void => {
    setPrioSort(prev =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }


  const areas = [...new Set(acts.map((a) => String(a.AreaName || '')).filter(Boolean))]
  const themes = [...new Set(
    acts
      .filter((a) => areaFilter === 'all' || a.AreaName === areaFilter)
      .map((a) => String(a.ThemeName || ''))
      .filter(Boolean)
  )]

  const catOptions = [...new Set(
    acts
      .filter((a) => areaFilter === 'all' || a.AreaName === areaFilter)
      .filter((a) => themeFilter === 'all' || a.ThemeName === themeFilter)
      .flatMap((a) => String(a.Cat || '').split(/[;:]/).map((s) => s.trim()).filter(Boolean))
  )]

  const filteredActs = acts
    .filter((a) => viewMode !== 'today' || showDone || Number(a.Sdone) !== 1)
    .filter((a) => areaFilter === 'all' || a.AreaName === areaFilter)
    .filter((a) => themeFilter === 'all' || a.ThemeName === themeFilter)
    .filter((a) => catFilter === 'all' || String(a.Cat || '').split(/[;:]/).map((s) => s.trim()).includes(catFilter))
    .filter((a) => !searchQuery || String(a.Title || '').toLowerCase().includes(searchQuery.toLowerCase()))

  const visible = prioSort
    ? [...filteredActs].sort((a, b) => {
        const va = a[prioSort.key] != null ? Number(a[prioSort.key]) : 99999
        const vb = b[prioSort.key] != null ? Number(b[prioSort.key]) : 99999
        return prioSort.dir === 'asc' ? va - vb : vb - va
      })
    : filteredActs

  const doneCount = acts.filter((a) => Number(a.Sdone) === 1).length
  const totalCount = acts.length

  return (
    <div
      className="h-full flex flex-col bg-background text-on-background overflow-hidden"
      onClick={() => setOpenFilter(null)}
    >
      {/* Header */}
      <header className="bg-surface-dim border-b border-outline-variant/30 flex justify-between items-center px-6 py-3 sticky top-0 z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant/60 text-sm transition-colors"
            >
              ‹
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayIso)}
                className="px-2 py-0.5 text-xs text-primary hover:text-primary/80 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                {t('today.goToToday')}
              </button>
            )}
            <button
              onClick={() => shiftDate(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant/60 text-sm transition-colors"
            >
              ›
            </button>
          </div>
          <span className="text-sm text-on-surface-variant/50">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant/50 text-[18px]">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-high/50 border border-outline-variant/20 rounded-full pl-9 pr-4 py-1.5 text-body-md text-on-surface focus:ring-1 focus:ring-primary/50 focus:outline-none w-64 placeholder:text-on-surface-variant/40 transition-all"
              placeholder="Aktivitäten suchen..."
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); load() }}
            className="material-symbols-outlined text-on-surface-variant/60 hover:text-primary transition-colors"
          >
            refresh
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowVariantPanel((v) => !v) }}
            className={`material-symbols-outlined transition-colors ${showVariantPanel ? 'text-primary' : 'text-on-surface-variant/60 hover:text-primary'}`}
            title={t('today.planVariant')}
          >
            tune
          </button>
        </div>
      </header>

      {/* Plan Variant Panel */}
      {showVariantPanel && (
        <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant/20 z-40 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <PlanVariantPanel
            currentActIds={acts.map((a) => a.id as number)}
            onLoaded={load}
            onClose={() => setShowVariantPanel(false)}
          />
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">

          {/* Filter row */}
          <section>
            <div className="grid grid-cols-3 gap-4">

              {/* Bereich */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenFilter(openFilter === 'area' ? null : 'area')}
                  className="glass-card rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer group w-full"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim/50 text-[20px]">rectangle</span>
                    <span className="text-sm opacity-80">
                      {areaFilter === 'all' ? 'Bereich' : areaFilter}
                    </span>
                  </div>
                  <span className={`material-symbols-outlined opacity-40 transition-transform ${openFilter === 'area' ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {openFilter === 'area' && areas.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/30 rounded-xl overflow-hidden z-30 shadow-lg">
                    <button
                      onClick={() => { setAreaFilter('all'); setThemeFilter('all'); setOpenFilter(null) }}
                      className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container-highest transition-colors ${areaFilter === 'all' ? 'text-primary font-medium' : 'text-on-surface-variant'}`}
                    >
                      Alle
                    </button>
                    {areas.map((a) => (
                      <button
                        key={a}
                        onClick={() => { setAreaFilter(a); setThemeFilter('all'); setOpenFilter(null) }}
                        className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container-highest transition-colors ${areaFilter === a ? 'text-primary font-medium' : 'text-on-surface-variant'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Thema */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenFilter(openFilter === 'theme' ? null : 'theme')}
                  className="glass-card rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer group w-full"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim/50 text-[20px]">keyboard_arrow_right</span>
                    <span className="text-sm opacity-80">
                      {themeFilter === 'all' ? 'Thema' : themeFilter}
                    </span>
                  </div>
                  <span className={`material-symbols-outlined opacity-40 transition-transform ${openFilter === 'theme' ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {openFilter === 'theme' && themes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/30 rounded-xl overflow-hidden z-30 shadow-lg">
                    <button
                      onClick={() => { setThemeFilter('all'); setOpenFilter(null) }}
                      className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container-highest transition-colors ${themeFilter === 'all' ? 'text-primary font-medium' : 'text-on-surface-variant'}`}
                    >
                      Alle
                    </button>
                    {themes.map((th) => (
                      <button
                        key={th}
                        onClick={() => { setThemeFilter(th); setOpenFilter(null) }}
                        className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container-highest transition-colors ${themeFilter === th ? 'text-primary font-medium' : 'text-on-surface-variant'}`}
                      >
                        {th}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Kategorien (catFilter) */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenFilter(openFilter === 'cat' ? null : 'cat')}
                  className="glass-card rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer group w-full"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim/50 text-[20px]">keyboard_double_arrow_right</span>
                    <span className="text-sm opacity-80">
                      {catFilter === 'all' ? 'Kategorien' : catFilter}
                    </span>
                  </div>
                  <span className={`material-symbols-outlined opacity-40 transition-transform ${openFilter === 'cat' ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {openFilter === 'cat' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/30 rounded-xl overflow-hidden z-30 shadow-lg">
                    <button
                      onClick={() => { setCatFilter('all'); setOpenFilter(null) }}
                      className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container-highest transition-colors ${catFilter === 'all' ? 'text-primary font-medium' : 'text-on-surface-variant'}`}
                    >
                      {t('today.filterAll')}
                    </button>
                    {catOptions.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCatFilter(c); setOpenFilter(null) }}
                        className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container-highest transition-colors ${catFilter === c ? 'text-primary font-medium' : 'text-on-surface-variant'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Stats bar */}
          <div className="text-body-md text-on-surface-variant/60">
            <span>{t('today.doneCount', { done: doneCount, total: totalCount })}</span>
          </div>

          {/* Active mode indicator */}
          {viewMode !== 'today' && (
            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-body-md text-primary/80">
                <span className="material-symbols-outlined text-[16px]">
                  {viewMode === 'verschoben' ? 'event_repeat' : viewMode === 'erledigt' ? 'check_circle' : viewMode === 'bearbeitet' ? 'person_edit' : 'schedule'}
                </span>
                <span>
                  {viewMode === 'verschoben' ? 'verschoben' : viewMode === 'erledigt' ? 'erledigt' : viewMode === 'bearbeitet' ? 'bearbeitete Aktivitäten' : 'geplant'}
                </span>
              </div>
              <button
                onClick={() => setViewMode('today')}
                className="flex items-center gap-1 text-body-sm text-primary/60 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Zurück
              </button>
            </div>
          )}

          {/* Activity list */}
          <section className="space-y-4">
            {loading ? (
              <div className="glass-card rounded-xl p-6">
                <p className="text-on-surface-variant/60 text-body-md">{t('today.loading')}</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="glass-card rounded-xl p-6">
                <p className="text-on-surface-variant/60 text-body-md">
                  {totalCount === 0 ? t('today.noActivities') : t('today.allDone')}
                </p>
              </div>
            ) : (
              visible.map((act) => (
                <ActCard
                  key={act.id as number}
                  act={act}
                  onToggleDone={handleToggleDone}
                  onPostpone={handlePostpone}
                  onDelete={handleDelete}
                  onOpen={setOpenActId}
                  prioSort={prioSort}
                  onPrioSort={handlePrioSort}
                />
              ))
            )}
          </section>

          {/* Bottom section */}
          <section className="pt-8 border-t border-outline-variant/20 space-y-3 flex flex-col items-center">
            <div className="flex flex-wrap gap-2 justify-center">
              {([
                { key: 'verschoben', icon: 'event_repeat', label: 'verschoben' },
                { key: 'erledigt',   icon: 'check_circle', label: 'erledigt' },
                { key: 'bearbeitet', icon: 'person_edit',  label: 'bearbeitete Aktivitäten' },
                { key: 'geplant',    icon: 'schedule',     label: 'geplant' },
              ] as const).map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(viewMode === key ? 'today' : key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-body-md border transition-colors ${
                    viewMode === key
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-surface-container-high/20 text-on-surface-variant/60 hover:bg-surface-variant border-outline-variant/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center flex-wrap gap-3 justify-center">
              <span className="text-body-sm text-on-surface-variant/50 font-medium">Von</span>
              <input
                type="date"
                value={bottomVon}
                onChange={(e) => setBottomVon(e.target.value)}
                className="bg-surface-container-high/50 border border-outline-variant/20 rounded-lg px-3 py-1 text-body-sm text-on-surface focus:ring-1 focus:ring-primary/50 focus:outline-none"
              />
              <span className="text-body-sm text-on-surface-variant/50 font-medium">Bis</span>
              <input
                type="date"
                value={bottomBis}
                onChange={(e) => setBottomBis(e.target.value)}
                className="bg-surface-container-high/50 border border-outline-variant/20 rounded-lg px-3 py-1 text-body-sm text-on-surface focus:ring-1 focus:ring-primary/50 focus:outline-none"
              />
            </div>
            {viewMode !== 'today' && (
              <div className="text-body-sm text-on-surface-variant/50 text-center">
                {loading ? 'Lädt…' : `${visible.length} Aktivität${visible.length !== 1 ? 'en' : ''}`}
              </div>
            )}
          </section>

        </div>
      </div>

      {openActId !== null && (
        <FNowModal
          actId={openActId}
          onClose={() => setOpenActId(null)}
          onSaved={(updated) => {
            setActs((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            setOpenActId(null)
          }}
        />
      )}
    </div>
  )
}

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import FNowModal from './FNowModal'

type Act = Record<string, unknown>

const todayIso = new Date().toISOString().slice(0, 10)

function fmtDate(val: unknown): string {
  if (!val) return ''
  const s = String(val).slice(0, 10)
  if (!s.match(/\d{4}-\d{2}-\d{2}/)) return ''
  const [y, m, d] = s.split('-')
  return `${d}.${m}.${y}`
}

function remainingDays(val: unknown): string {
  if (!val) return ''
  const s = String(val).slice(0, 10)
  const diff = Math.ceil((new Date(s).getTime() - new Date(todayIso).getTime()) / 86400000)
  if (isNaN(diff)) return ''
  if (diff < 0) return String(diff)
  return `+${diff}`
}

function statusColor(status: unknown): string {
  const s = String(status ?? '').toLowerCase()
  if (s.includes('arbeit')) return 'bg-primary/10 text-primary'
  if (s.includes('warte')) return 'bg-tertiary-container/10 text-tertiary'
  if (s.includes('erledigt')) return 'bg-secondary-container/10 text-secondary-fixed-dim'
  if (s.includes('info')) return 'bg-primary-container/10 text-primary'
  if (s.includes('neu')) return 'bg-tertiary-container/10 text-tertiary'
  return 'bg-surface-container-high text-on-surface-variant'
}

function rowBg(act: Act, idx: number): string {
  if (Number(act.Sdone) === 1) return 'opacity-40'
  if (Number(act.Prio1) === 1 || Number(act.Prio2) === 1)
    return idx % 2 === 0 ? 'bg-amber-500/15' : 'bg-amber-500/10'
  return idx % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-low/60'
}

type TypeFilter = 'all' | 'actions' | 'infos'
type DateFilter = 'all' | 'ab-heute' | 'bis-heute'
type SortCol = 'Prio1' | 'Prio2' | 'Title' | 'Pl1Beg' | 'remaining' | 'Pl1End' | 'Status'

export default function PrioritiesView(): JSX.Element {
  const { t } = useTranslation()
  const [acts, setActs] = useState<Act[]>([])
  const [loading, setLoading] = useState(true)

  const saved = useRef<Record<string, unknown> | null>(null)
  if (saved.current === null) {
    try { saved.current = JSON.parse(localStorage.getItem('prio_filters') ?? '{}') } catch { saved.current = {} }
  }
  const s = saved.current!

  const [catFilter, setCatFilter] = useState<string>((s.catFilter as string) ?? 'all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>((s.typeFilter as TypeFilter) ?? 'all')
  const [dateFilter, setDateFilter] = useState<DateFilter>((s.dateFilter as DateFilter) ?? 'all')
  const [abHeuteDate, setAbHeuteDate] = useState<string>((s.abHeuteDate as string) ?? todayIso)
  const [bisHeuteDate, setBisHeuteDate] = useState<string>((s.bisHeuteDate as string) ?? todayIso)
  const [showArchiv, setShowArchiv] = useState<boolean>((s.showArchiv as boolean) ?? false)
  const [openActId, setOpenActId] = useState<number | null>(null)
  const [sortCol, setSortCol] = useState<SortCol | null>((s.sortCol as SortCol) ?? null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>((s.sortDir as 'asc' | 'desc') ?? 'asc')
  const [statusFilter, setStatusFilter] = useState<string | null>((s.statusFilter as string) ?? null)

  useEffect(() => {
    localStorage.setItem('prio_filters', JSON.stringify({ catFilter, typeFilter, dateFilter, abHeuteDate, bisHeuteDate, showArchiv, sortCol, sortDir, statusFilter }))
  }, [catFilter, typeFilter, dateFilter, abHeuteDate, bisHeuteDate, showArchiv, sortCol, sortDir, statusFilter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const filter: Record<string, unknown> = { sortByPrio: true }
      if (!showArchiv) filter.Sdone = 0
      const rows = await window.db.act.getAll(filter)
      setActs(rows)
    } finally {
      setLoading(false)
    }
  }, [showArchiv])

  useEffect(() => { load() }, [load])

  const preFiltered = acts.filter((a) => {
    if (typeFilter === 'actions' && Number(a.SInfo) === 1) return false
    if (typeFilter === 'infos' && Number(a.SInfo) !== 1) return false
    if (dateFilter === 'ab-heute') {
      const beg = String(a.Pl1Beg ?? '').slice(0, 10)
      if (!beg || beg < abHeuteDate) return false
    }
    if (dateFilter === 'bis-heute') {
      const end = String(a.Pl1End ?? '').slice(0, 10)
      if (end && end > bisHeuteDate) return false
    }
    if (statusFilter && String(a.Status ?? '') !== statusFilter) return false
    return true
  })

  const availableCats = [...new Set(
    preFiltered.flatMap((a) => String(a.Cat || '').split(/[;:]/).map((s) => s.trim()).filter(Boolean))
  )].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }))

  const visible = catFilter === 'all'
    ? preFiltered
    : preFiltered.filter((a) =>
        String(a.Cat || '').split(/[;:]/).map((s) => s.trim()).includes(catFilter)
      )

  function handleSort(col: SortCol): void {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortedVisible = sortCol === null ? visible : [...visible].sort((a, b) => {
    let av: number | string
    let bv: number | string
    if (sortCol === 'Prio1' || sortCol === 'Prio2') {
      av = a[sortCol] != null && a[sortCol] !== '' ? Number(a[sortCol]) : 99999
      bv = b[sortCol] != null && b[sortCol] !== '' ? Number(b[sortCol]) : 99999
    } else if (sortCol === 'remaining') {
      av = a.Pl1End ? new Date(String(a.Pl1End).slice(0, 10)).getTime() : Infinity
      bv = b.Pl1End ? new Date(String(b.Pl1End).slice(0, 10)).getTime() : Infinity
    } else {
      av = String(a[sortCol] ?? '')
      bv = String(b[sortCol] ?? '')
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const Th = ({ col, label, className }: { col: SortCol; label: string; className?: string }): JSX.Element => (
    <th
      className={`px-3 py-2 text-xs font-semibold text-on-surface-variant cursor-pointer select-none hover:text-on-surface transition-colors ${className ?? ''}`}
      onClick={() => handleSort(col)}
    >
      {label}{sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  )

  const tabBtn = (active: boolean, onClick: () => void, label: string): JSX.Element => (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-md transition-colors ${
        active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant/40">
        <h2 className="text-xl font-semibold text-on-surface">{t('prio.title')}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant/60">{t('prio.entries', { count: visible.length })}</span>
          <button onClick={load} className="text-xs text-on-surface-variant/60 hover:text-on-surface">↻</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-8 text-on-surface-variant/60 text-sm">{t('prio.loading')}</div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-on-surface-variant/60 text-sm">{t('prio.noEntries')}</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant z-10">
              <tr>
                <Th col="Prio1"     label={t('prio.colPrio1')} className="text-left w-12" />
                <Th col="Prio2"     label={t('prio.colPrio2')} className="text-left w-12" />
                <Th col="Title"     label={t('prio.colTitle')} className="text-left" />
                <Th col="Pl1Beg"    label={t('prio.colFrom')}  className="text-left w-24" />
                <Th col="remaining" label={t('prio.colUntil')} className="text-right w-16" />
                <Th col="Pl1End"    label={t('prio.colPlanTo')} className="text-left w-24" />
                <Th col="Status"    label={t('prio.colStatus')} className="text-left w-32" />
              </tr>
            </thead>
            <tbody>
              {sortedVisible.map((act, idx) => (
                <tr
                  key={act.id as number}
                  className={`border-b border-outline-variant/40 cursor-pointer hover:bg-primary/5 transition-colors ${rowBg(act, idx)}`}
                  onDoubleClick={() => setOpenActId(act.id as number)}
                >
                  <td className="px-3 py-1.5 text-on-surface font-medium tabular-nums">
                    {act.Prio1 != null && act.Prio1 !== '' ? String(act.Prio1) : ''}
                  </td>
                  <td className="px-3 py-1.5 text-on-surface-variant tabular-nums">
                    {act.Prio2 != null && act.Prio2 !== '' ? String(act.Prio2) : ''}
                  </td>
                  <td className="px-3 py-1.5 text-on-surface font-medium max-w-0">
                    <div className="truncate" title={String(act.Title ?? '')}>
                      {String(act.Title ?? '')}
                    </div>
                    {act.ThemeName && (
                      <div className="text-xs text-on-surface-variant/60 truncate">{String(act.ThemeName)}</div>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-on-surface-variant text-xs tabular-nums whitespace-nowrap">
                    {fmtDate(act.Pl1Beg)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs tabular-nums whitespace-nowrap">
                    {act.Pl1End ? (
                      <span className={Number(remainingDays(act.Pl1End).replace('+','')) < 0 ? 'text-error font-medium' : 'text-on-surface-variant'}>
                        {remainingDays(act.Pl1End)}
                      </span>
                    ) : ''}
                  </td>
                  <td className="px-3 py-1.5 text-on-surface-variant text-xs tabular-nums whitespace-nowrap">
                    {fmtDate(act.Pl1End)}
                  </td>
                  <td className="px-3 py-1.5">
                    {act.Status ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer ${statusColor(act.Status)} ${statusFilter === String(act.Status) ? 'ring-1 ring-current' : ''}`}
                        onDoubleClick={(e) => { e.stopPropagation(); setStatusFilter(statusFilter === String(act.Status) ? null : String(act.Status)) }}
                        title="Doppelklick: nach Status filtern"
                      >
                        {String(act.Status)}
                      </span>
                    ) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-outline-variant bg-surface-container-low px-4 py-2 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {tabBtn(catFilter === 'all', () => setCatFilter('all'), t('common.all'))}
          {availableCats.map((c) => tabBtn(catFilter === c, () => setCatFilter(catFilter === c ? 'all' : c), c))}
        </div>

        <div className="w-px h-5 bg-outline-variant/40" />

        <div className="flex items-center gap-1">
          {tabBtn(typeFilter === 'actions', () => setTypeFilter(typeFilter === 'actions' ? 'all' : 'actions'), t('prio.filterActions'))}
          {tabBtn(typeFilter === 'infos', () => setTypeFilter(typeFilter === 'infos' ? 'all' : 'infos'), t('prio.filterInfos'))}
          {tabBtn(typeFilter === 'all', () => setTypeFilter('all'), t('prio.filterAll'))}
        </div>

        <div className="w-px h-5 bg-outline-variant/40" />

        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-1">
            {tabBtn(dateFilter === 'ab-heute', () => setDateFilter(dateFilter === 'ab-heute' ? 'all' : 'ab-heute'), t('prio.fromToday'))}
            {dateFilter === 'ab-heute' && (
              <input
                type="date"
                value={abHeuteDate}
                onChange={(e) => setAbHeuteDate(e.target.value || todayIso)}
                className="px-2 py-0.5 text-xs rounded-md bg-surface-container border border-primary/40 text-on-surface focus:outline-none focus:border-primary"
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            {tabBtn(dateFilter === 'bis-heute', () => setDateFilter(dateFilter === 'bis-heute' ? 'all' : 'bis-heute'), t('prio.untilToday'))}
            {dateFilter === 'bis-heute' && (
              <input
                type="date"
                value={bisHeuteDate}
                onChange={(e) => setBisHeuteDate(e.target.value || todayIso)}
                className="px-2 py-0.5 text-xs rounded-md bg-surface-container border border-primary/40 text-on-surface focus:outline-none focus:border-primary"
              />
            )}
          </div>
          {tabBtn(false, () => { setDateFilter('all'); setCatFilter('all'); setTypeFilter('all'); setStatusFilter(null); setAbHeuteDate(todayIso); setBisHeuteDate(todayIso) }, t('prio.reset'))}
        </div>

        {statusFilter && (
          <>
            <div className="w-px h-5 bg-outline-variant/40" />
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-2 py-0.5 text-xs rounded-md border border-current flex items-center gap-1 ${statusColor(statusFilter)}`}
            >
              {statusFilter} ✕
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowArchiv((v) => !v)}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              showArchiv ? 'border-primary/40 bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {t('prio.archive')}
          </button>
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

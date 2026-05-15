import { useEffect, useState, useCallback } from 'react'
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
  const s = String(act.Status ?? '').toLowerCase()
  if (s.includes('arbeit')) return idx % 2 === 0 ? 'bg-blue-50/40' : 'bg-blue-50/20'
  return idx % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-low/60'
}

type AreaFilter = string
type TypeFilter = 'all' | 'actions' | 'infos'
type DateFilter = 'all' | 'ab-heute' | 'bis-heute'

export default function PrioritiesView(): JSX.Element {
  const { t } = useTranslation()
  const [acts, setActs] = useState<Act[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [showArchiv, setShowArchiv] = useState(false)
  const [openActId, setOpenActId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const filter: Record<string, unknown> = { sortByPrio: true }
      if (!showArchiv) filter.Sdone = 0
      const rows = await window.db.act.getAll(filter)
      setActs(rows)
      const uniqueAreas = [...new Set(rows.map((r) => String(r.AreaName ?? '')))]
        .filter(Boolean).sort()
      setAreas(uniqueAreas)
    } finally {
      setLoading(false)
    }
  }, [showArchiv])

  useEffect(() => { load() }, [load])

  const visible = acts.filter((a) => {
    if (areaFilter !== 'all' && a.AreaName !== areaFilter) return false
    if (typeFilter === 'actions' && Number(a.SInfo) === 1) return false
    if (typeFilter === 'infos' && Number(a.SInfo) !== 1) return false
    if (dateFilter === 'ab-heute') {
      const beg = String(a.Pl1Beg ?? '').slice(0, 10)
      if (beg && beg < todayIso) return false
    }
    if (dateFilter === 'bis-heute') {
      const end = String(a.Pl1End ?? '').slice(0, 10)
      if (end && end > todayIso) return false
    }
    return true
  })

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
                <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant w-12">{t('prio.colPrio1')}</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant w-12">{t('prio.colPrio2')}</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">{t('prio.colTitle')}</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant w-24">{t('prio.colFrom')}</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-on-surface-variant w-16">{t('prio.colUntil')}</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant w-24">{t('prio.colPlanTo')}</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant w-32">{t('prio.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((act, idx) => (
                <tr
                  key={act.id as number}
                  className={`border-b border-outline-variant/40 cursor-pointer hover:bg-primary/5 transition-colors ${rowBg(act, idx)}`}
                  onDoubleClick={() => setOpenActId(act.id as number)}
                >
                  <td className="px-3 py-1.5 text-on-surface font-medium tabular-nums">
                    {act.Prio1 != null && act.Prio1 !== '' ? String(act.Prio1) : ''}
                  </td>
                  <td className="px-3 py-1.5 text-on-surface-variant/60 tabular-nums">
                    {act.Prio2 != null && act.Prio2 !== '' ? String(act.Prio2) : ''}
                  </td>
                  <td className="px-3 py-1.5 text-on-surface max-w-0">
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
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColor(act.Status)}`}>
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
        <div className="flex items-center gap-1">
          {tabBtn(areaFilter === 'all', () => setAreaFilter('all'), t('common.all'))}
          {areas.slice(0, 5).map((a) => tabBtn(areaFilter === a, () => setAreaFilter(a), a))}
        </div>

        <div className="w-px h-5 bg-outline-variant/40" />

        <div className="flex items-center gap-1">
          {tabBtn(typeFilter === 'actions', () => setTypeFilter(typeFilter === 'actions' ? 'all' : 'actions'), t('prio.filterActions'))}
          {tabBtn(typeFilter === 'infos', () => setTypeFilter(typeFilter === 'infos' ? 'all' : 'infos'), t('prio.filterInfos'))}
          {tabBtn(typeFilter === 'all', () => setTypeFilter('all'), t('prio.filterAll'))}
        </div>

        <div className="w-px h-5 bg-outline-variant/40" />

        <div className="flex items-center gap-1">
          {tabBtn(dateFilter === 'ab-heute', () => setDateFilter(dateFilter === 'ab-heute' ? 'all' : 'ab-heute'), t('prio.fromToday'))}
          {tabBtn(dateFilter === 'bis-heute', () => setDateFilter(dateFilter === 'bis-heute' ? 'all' : 'bis-heute'), t('prio.untilToday'))}
          {tabBtn(false, () => { setDateFilter('all'); setAreaFilter('all'); setTypeFilter('all') }, t('prio.reset'))}
        </div>

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

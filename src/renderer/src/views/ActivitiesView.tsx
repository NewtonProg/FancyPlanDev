import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FNowModal from './FNowModal'
import BtkSelector, { BtkLevel1, BtkItem, BtkLevel3, BtkSelection } from '../components/BtkSelector'

type Act = Record<string, unknown>
type Row = Record<string, unknown>

const LS_KEY = 'fp_activities_filter'
type DoneFilter = 'open' | 'done' | 'all'
type SortCol = 'Title' | 'Prio1' | 'Prio2' | 'Status' | 'Tage'
type SortState = { col: SortCol | null; dir: 'asc' | 'desc' }
type ColFilter = Partial<Record<'Prio1' | 'Prio2' | 'Status' | 'Tage', string>>

type SavedFilter = {
  area: string | null; theme: string | null; cat: string | null
  done: DoneFilter; colFilters: ColFilter; sort: SortState
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
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

function computeTageRaw(act: Act): number {
  const due = parsePlanDate(act.Pl1End)
  if (!due) return 99999
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function computeTageTxt(act: Act): string {
  const v = computeTageRaw(act)
  return v === 99999 ? '—' : String(v)
}

function tageColorCls(act: Act): string {
  const v = computeTageRaw(act)
  if (v === 99999) return 'text-on-surface-variant/30'
  if (v <= 0) return 'text-red-400'
  if (v === 1) return 'text-amber-400'
  return 'text-on-surface-variant/60'
}

function statusColor(status: unknown): string {
  const s = String(status ?? '').toLowerCase()
  if (s.includes('arbeit') || s.includes('aktiv')) return 'bg-primary/10 text-primary'
  if (s.includes('warte')) return 'bg-tertiary-container/10 text-tertiary'
  if (s.includes('erledigt')) return 'bg-secondary-container/10 text-secondary-fixed-dim'
  if (s.includes('info')) return 'bg-primary-container/10 text-primary'
  if (s.includes('neu')) return 'bg-tertiary-container/10 text-tertiary'
  return 'bg-surface-container-high text-on-surface-variant'
}

function loadFromLS(): SavedFilter | null {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null } catch { return null }
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 max-w-[180px]">
      <span className="truncate">{label}</span>
      <button onClick={onClear} className="hover:text-error flex-shrink-0 leading-none">✕</button>
    </span>
  )
}

function SortTh({ col, label, sort, onSort, className }: {
  col: SortCol; label: string; sort: SortState; onSort: (col: SortCol) => void; className?: string
}): JSX.Element {
  const active = sort.col === col
  return (
    <th
      className={`px-3 py-2 text-xs font-semibold text-on-surface-variant cursor-pointer select-none hover:text-on-surface whitespace-nowrap ${className ?? ''}`}
      onClick={() => onSort(col)}
    >
      {label}{active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
    </th>
  )
}

export default function ActivitiesView(): JSX.Element {
  const { t } = useTranslation()

  const [acts, setActs] = useState<Act[]>([])
  const [areas, setAreas] = useState<Row[]>([])
  const [themes, setThemes] = useState<Row[]>([])
  const [areaTheme, setAreaTheme] = useState<Row[]>([])
  const [cats, setCats] = useState<Row[]>([])

  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [doneFilter, setDoneFilter] = useState<DoneFilter>('open')
  const [btkSel, setBtkSel] = useState<BtkSelection>({ level1: null, level2: null, level3: null })
  const [colFilters, setColFilters] = useState<ColFilter>({})
  const [sort, setSort] = useState<SortState>({ col: null, dir: 'asc' })
  const [openActId, setOpenActId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  // Referenz-Daten laden + Filter wiederherstellen
  useEffect(() => {
    Promise.all([
      window.db.area.getAll(),
      window.db.theme.getAll(),
      window.db.areatheme.getAll(),
      window.db.cat.getAll('FAct')
    ]).then(([ar, th, at, ct]: [Row[], Row[], Row[], Row[]]) => {
      setAreas(ar); setThemes(th); setAreaTheme(at); setCats(ct)
      const saved = loadFromLS()
      if (saved) {
        setDoneFilter(saved.done ?? 'open')
        setColFilters(saved.colFilters ?? {})
        setSort(saved.sort ?? { col: null, dir: 'asc' })
        if (saved.area || saved.theme || saved.cat) {
          const l1 = ar.map(a => ({
            id: Number(a.id), name: String(a.AreaName),
            childIds: at.filter(x => Number(x.IDArea) === Number(a.id)).map(x => Number(x.IDTheme))
          })).find(i => i.name === saved.area) ?? null
          const l2 = th.map(t2 => ({ id: Number(t2.id), name: String(t2.ThemeName) })).find(i => i.name === saved.theme) ?? null
          const l3 = ct.filter(c => c.Cat).map(c => ({
            id: Number(c.id), name: String(c.Cat), parentId: Number(c.IDTheme ?? 0)
          })).find(i => i.name === saved.cat) ?? null
          if (l1 || l2 || l3) setBtkSel({ level1: l1, level2: l2, level3: l3 })
        }
      }
      initializedRef.current = true
    })
  }, [])

  // Filter bei jeder Änderung persistieren (erst nach Initialisierung)
  useEffect(() => {
    if (!initializedRef.current) return
    localStorage.setItem(LS_KEY, JSON.stringify({
      area: btkSel.level1?.name ?? null,
      theme: btkSel.level2?.name ?? null,
      cat: btkSel.level3?.name ?? null,
      done: doneFilter, colFilters, sort
    }))
  }, [btkSel, doneFilter, colFilters, sort])

  const load = useCallback(async (search: string) => {
    setLoading(true)
    try {
      const filter: Record<string, unknown> = { sortByPrio: true }
      if (search.trim()) filter.search = search.trim()
      if (doneFilter === 'open') filter.Sdone = 0
      if (doneFilter === 'done') filter.Sdone = 1
      setActs(await window.db.act.getAll(filter))
    } finally { setLoading(false) }
  }, [doneFilter])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(searchText), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchText, load])

  // BtkSelector-Daten aufbauen
  const level1Items = useMemo<BtkLevel1[]>(() => {
    const globalThemeIds = themes.filter(t => Number(t.IDArea) === 0).map(t => Number(t.id))
    return areas.map(a => ({
      id: Number(a.id), name: String(a.AreaName),
      childIds: [
        ...new Set([
          ...areaTheme.filter(at => Number(at.IDArea) === Number(a.id)).map(at => Number(at.IDTheme)),
          ...themes.filter(t => Number(t.IDArea) === Number(a.id)).map(t => Number(t.id)),
          ...globalThemeIds
        ])
      ]
    }))
  }, [areas, areaTheme, themes])

  const level2Items = useMemo<BtkItem[]>(() =>
    themes.map(t => ({ id: Number(t.id), name: String(t.ThemeName) })), [themes])

  const level3Items = useMemo<BtkLevel3[]>(() =>
    cats.filter(c => c.Cat).map(c => ({
      id: Number(c.id), name: String(c.Cat), parentId: Number(c.IDTheme ?? 0)
    })), [cats])

  // Filtern + Sortieren
  const visible = useMemo(() => {
    let r = acts
    if (btkSel.level1) r = r.filter(a => String(a.AreaName) === btkSel.level1!.name)
    if (btkSel.level2) r = r.filter(a => String(a.ThemeName) === btkSel.level2!.name)
    if (btkSel.level3) {
      const cn = btkSel.level3.name
      r = r.filter(a => String(a.Cat ?? '').split(/[;:]/).map(s => s.trim()).includes(cn))
    }
    if (colFilters.Prio1) r = r.filter(a => String(a.Prio1 ?? '') === colFilters.Prio1)
    if (colFilters.Prio2) r = r.filter(a => String(a.Prio2 ?? '') === colFilters.Prio2)
    if (colFilters.Status) r = r.filter(a => String(a.Status ?? '') === colFilters.Status)
    if (colFilters.Tage) r = r.filter(a => computeTageTxt(a) === colFilters.Tage)
    if (sort.col) {
      const d = sort.dir === 'asc' ? 1 : -1
      r = [...r].sort((a, b) => {
        let va: string | number = '', vb: string | number = ''
        switch (sort.col) {
          case 'Title':  va = String(a.Title ?? '').toLowerCase();            vb = String(b.Title ?? '').toLowerCase(); break
          case 'Prio1':  va = a.Prio1 != null ? Number(a.Prio1) : 9999;      vb = b.Prio1 != null ? Number(b.Prio1) : 9999; break
          case 'Prio2':  va = a.Prio2 != null ? Number(a.Prio2) : 9999;      vb = b.Prio2 != null ? Number(b.Prio2) : 9999; break
          case 'Status': va = String(a.Status ?? '').toLowerCase();           vb = String(b.Status ?? '').toLowerCase(); break
          case 'Tage':   va = computeTageRaw(a);                              vb = computeTageRaw(b); break
        }
        return va < vb ? -d : va > vb ? d : 0
      })
    }
    return r
  }, [acts, btkSel, colFilters, sort])

  function handleSort(col: SortCol): void {
    setSort(prev => ({ col, dir: prev.col === col ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'asc' }))
  }

  function handleValFilter(col: keyof ColFilter, value: string): void {
    if (!value || value === '—') return
    setColFilters(prev => ({ ...prev, [col]: prev[col] === value ? undefined : value }))
  }

  function clearArea():  void { setBtkSel({ level1: null, level2: null, level3: null }) }
  function clearTheme(): void { setBtkSel(prev => ({ ...prev, level2: null, level3: null })) }
  function clearCat():   void { setBtkSel(prev => ({ ...prev, level3: null })) }
  function clearColFilter(col: keyof ColFilter): void { setColFilters(prev => { const n = { ...prev }; delete n[col]; return n }) }
  function clearAll(): void { setBtkSel({ level1: null, level2: null, level3: null }); setColFilters({}) }

  const hasFilters = !!(btkSel.level1 || btkSel.level2 || btkSel.level3 || Object.values(colFilters).some(Boolean))

  const handleExportCsv = async (): Promise<void> => {
    const fields = ['Title', 'AreaName', 'ThemeName', 'Cat', 'Status', 'Prio1', 'Prio2', 'ActBeg', 'dateFin', 'Pl1Beg', 'Pl1End', 'Com']
    const esc = (v: string): string => (v.includes(';') || v.includes('\n') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
    const header = fields.join(';')
    const rows = visible.map(a => fields.map(f => esc(String(a[f] ?? ''))).join(';')).join('\n')
    await window.db.export.csv(`${header}\n${rows}`, 'aktivitaeten.csv')
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Sidebar: BtkSelector */}
      <aside className="w-52 flex-shrink-0 border-r border-outline-variant/40 bg-surface-container-low overflow-y-auto p-3 flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-wide px-1">Filter</p>
        <BtkSelector
          level1Items={level1Items}
          level2Items={level2Items}
          level3Items={level3Items}
          value={btkSel}
          showAllWhenEmpty
          onChange={setBtkSel}
        />
        {hasFilters && (
          <button onClick={clearAll}
            className="mt-2 text-xs text-on-surface-variant/50 hover:text-error py-1.5 border border-outline-variant/40 rounded-lg transition-colors">
            Alle Filter löschen
          </button>
        )}
      </aside>

      {/* Hauptbereich */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-outline-variant/40 flex items-center gap-2.5 flex-wrap">
          <div className="flex-1 relative min-w-32">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm">⌕</span>
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-outline-variant rounded-xl bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40"
              placeholder={t('act.searchPh')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              autoFocus
            />
            {searchText && (
              <button onClick={() => setSearchText('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant text-xs">✕</button>
            )}
          </div>
          <div className="flex rounded-lg border border-outline-variant overflow-hidden text-xs">
            {(['open', 'all', 'done'] as const).map((f) => (
              <button key={f} onClick={() => setDoneFilter(f)}
                className={`px-2.5 py-1.5 transition-colors ${doneFilter === f ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                {f === 'open' ? t('act.filterOpen') : f === 'done' ? t('act.filterDone') : t('act.filterAll')}
              </button>
            ))}
          </div>
          <span className="text-xs text-on-surface-variant/60 whitespace-nowrap">{t('act.entries', { count: visible.length })}</span>
          <div className="flex rounded-lg border border-outline-variant overflow-hidden text-xs">
            {(['table', 'list'] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-2.5 py-1.5 transition-colors ${viewMode === m ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                {m === 'table' ? t('act.table') : t('act.list')}
              </button>
            ))}
          </div>
          <button onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high whitespace-nowrap">
            {t('act.csv')}
          </button>
        </div>

        {/* Aktive Filter-Chips */}
        {hasFilters && (
          <div className="px-4 py-1.5 border-b border-outline-variant/40 flex items-center gap-1.5 flex-wrap bg-surface-container/30">
            {btkSel.level1 && <FilterChip label={`Bereich: ${btkSel.level1.name}`} onClear={clearArea} />}
            {btkSel.level2 && <FilterChip label={`Thema: ${btkSel.level2.name}`} onClear={clearTheme} />}
            {btkSel.level3 && <FilterChip label={`Kat.: ${btkSel.level3.name}`} onClear={clearCat} />}
            {(Object.entries(colFilters) as [keyof ColFilter, string | undefined][]).map(([col, val]) =>
              val ? <FilterChip key={col} label={`${col}: ${val}`} onClear={() => clearColFilter(col)} /> : null
            )}
          </div>
        )}

        {/* Inhalt */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-on-surface-variant/60 text-sm">{t('act.searching')}</div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-on-surface-variant/60 text-sm">
              {searchText ? t('act.noResults', { search: searchText }) : t('act.noActivities')}
            </div>
          ) : viewMode === 'list' ? (
            <div className="divide-y divide-outline-variant/40">
              {visible.map((act) => (
                <button key={act.id as number} onClick={() => setOpenActId(act.id as number)}
                  className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-primary/5 transition-colors ${Number(act.Sdone) === 1 ? 'opacity-40' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-on-surface" title={String(act.Title ?? '')}>{String(act.Title ?? '')}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {act.AreaName && <span className="text-xs text-on-surface-variant/60 truncate">{String(act.AreaName)}</span>}
                      {act.ThemeName && <span className="text-xs text-on-surface-variant/40">· {String(act.ThemeName)}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {act.Prio1 && <span className="text-xs tabular-nums text-on-surface-variant/60">P{String(act.Prio1)}</span>}
                    {act.Prio2 && <span className="text-xs tabular-nums text-on-surface-variant/40">·{String(act.Prio2)}</span>}
                    {act.Status && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColor(act.Status)}`}>{String(act.Status)}</span>
                    )}
                    <span className={`text-xs tabular-nums w-8 text-right ${tageColorCls(act)}`}>{computeTageTxt(act)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant z-10">
                <tr>
                  <SortTh col="Title"  label="Titel"  sort={sort} onSort={handleSort} className="text-left" />
                  <SortTh col="Prio1"  label="P1"     sort={sort} onSort={handleSort} className="text-left w-12" />
                  <SortTh col="Prio2"  label="P2"     sort={sort} onSort={handleSort} className="text-left w-12" />
                  <SortTh col="Status" label="Status" sort={sort} onSort={handleSort} className="text-left w-32" />
                  <SortTh col="Tage"   label="Tage"   sort={sort} onSort={handleSort} className="text-right w-14" />
                </tr>
              </thead>
              <tbody>
                {visible.map((act, idx) => (
                  <tr key={act.id as number}
                    className={`border-b border-outline-variant/40 cursor-pointer hover:bg-primary/5 transition-colors ${idx % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-low/40'} ${Number(act.Sdone) === 1 ? 'opacity-40' : ''}`}
                    onDoubleClick={() => setOpenActId(act.id as number)}>
                    <td className="px-3 py-1.5 max-w-0">
                      <div className="truncate font-medium text-on-surface" title={String(act.Title ?? '')}>{String(act.Title ?? '')}</div>
                      {act.Com && stripHtml(String(act.Com)) && (
                        <div className="truncate text-xs text-on-surface-variant/60">{stripHtml(String(act.Com))}</div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-on-surface-variant tabular-nums"
                      onDoubleClick={(e) => { e.stopPropagation(); handleValFilter('Prio1', String(act.Prio1 ?? '')) }}>
                      {act.Prio1 ? String(act.Prio1) : ''}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-on-surface-variant tabular-nums"
                      onDoubleClick={(e) => { e.stopPropagation(); handleValFilter('Prio2', String(act.Prio2 ?? '')) }}>
                      {act.Prio2 ? String(act.Prio2) : ''}
                    </td>
                    <td className="px-3 py-1.5"
                      onDoubleClick={(e) => { e.stopPropagation(); handleValFilter('Status', String(act.Status ?? '')) }}>
                      {act.Status && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColor(act.Status)}`}>{String(act.Status)}</span>
                      )}
                    </td>
                    <td className={`px-3 py-1.5 text-xs tabular-nums text-right ${tageColorCls(act)}`}
                      onDoubleClick={(e) => { e.stopPropagation(); handleValFilter('Tage', computeTageTxt(act)) }}>
                      {computeTageTxt(act)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {openActId !== null && (
        <FNowModal actId={openActId} onClose={() => setOpenActId(null)}
          onSaved={(updated) => {
            setActs((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            setOpenActId(null)
          }} />
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const FORM_OPTIONS = [
  { value: '*',        label: 'Alle Formulare' },
  { value: 'FAct',     label: 'Aktivitäten' },
  { value: 'FAcquis',  label: 'Akquisition' },
  { value: 'FTreeEdit', label: 'Tree' },
]

function FormSelect({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }): JSX.Element {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`input-field ${className ?? ''}`}>
      {FORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

type SortDir = 'asc' | 'desc'

function SortTh({ label, col, sortCol, sortDir, onSort, className }: {
  label: string; col: string; sortCol: string | null; sortDir: SortDir
  onSort: (col: string) => void; className?: string
}): JSX.Element {
  const active = sortCol === col
  return (
    <th
      className={`pb-2 font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface whitespace-nowrap ${className ?? ''}`}
      onClick={() => onSort(col)}
    >
      {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
    </th>
  )
}

type SubEditor =
  | null
  | 'bereich'
  | 'prio1'
  | 'prio2'
  | 'prio3'
  | 'status'
  | 'kat'
  | 'land'
  | 'kostenstelle'
  | 'auftrag'
  | 'projekt'

interface Row { id: number; [k: string]: unknown }

// â”€â”€ Reusable simple list editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SimpleListEditorProps {
  title: string
  rows: Row[]
  labelField: string
  secondField?: string
  secondLabel?: string
  onAdd: (label: string, second?: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onRename: (id: number, label: string, second?: string) => Promise<void>
  onBack: () => void
}

function SimpleListEditor({
  title, rows, labelField, secondField, secondLabel,
  onAdd, onDelete, onRename, onBack
}: SimpleListEditorProps) {
  const { t } = useTranslation()
  const [newVal, setNewVal] = useState('')
  const [newSec, setNewSec] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')
  const [editSec, setEditSec] = useState('')

  async function handleAdd() {
    if (!newVal.trim()) return
    await onAdd(newVal.trim(), newSec.trim() || undefined)
    setNewVal('')
    setNewSec('')
  }

  async function handleSave(id: number) {
    if (!editVal.trim()) return
    await onRename(id, editVal.trim(), editSec.trim() || undefined)
    setEditId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-outline-variant/40">
        <button onClick={onBack} className="btn-secondary text-xs py-1 px-3">← {t('fcmval.back')}</button>
        <h2 className="text-base font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="p-5 overflow-auto flex-1 flex flex-col gap-4 max-w-xl">
        <div className="flex gap-2">
          <input
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={t('fcmval.newValue')}
            className="input-field flex-1"
          />
          {secondField && (
            <input
              value={newSec}
              onChange={e => setNewSec(e.target.value)}
              placeholder={secondLabel ?? ''}
              className="input-field w-28"
            />
          )}
          <button onClick={handleAdd} className="btn-primary">{t('fcmval.add')}</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-outline-variant/40">
<th className="pb-2 font-medium text-on-surface-variant">{title}</th>
              {secondField && <th className="pb-2 font-medium text-on-surface-variant w-32">{secondLabel}</th>}
              <th className="pb-2 w-28" />
            </tr>
          </thead>
          <tbody>
            {[...rows].sort((a, b) => String(a[labelField] ?? '').localeCompare(String(b[labelField] ?? ''), 'de')).map(r => (
              <tr key={r.id} className="border-b border-outline-variant/20">
                <td className="py-1.5">
                  {editId === r.id ? (
                    <input value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(r.id); if (e.key === 'Escape') setEditId(null) }}
                      className="input-field w-full" autoFocus />
                  ) : (
                    <span className="text-on-surface">{String(r[labelField] ?? '')}</span>
                  )}
                </td>
                {secondField && (
                  <td className="py-1.5">
                    {editId === r.id ? (
                      <input value={editSec} onChange={e => setEditSec(e.target.value)}
                        className="input-field w-full" />
                    ) : (
                      <span className="text-on-surface-variant text-xs">{String(r[secondField] ?? '')}</span>
                    )}
                  </td>
                )}
                <td className="py-1.5 text-right">
                  {editId === r.id ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleSave(r.id)} className="btn-primary text-xs py-0.5 px-2">{t('fcmval.ok')}</button>
                      <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.cancel')}</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditId(r.id); setEditVal(String(r[labelField] ?? '')); setEditSec(String(r[secondField ?? ''] ?? '')) }}
                        className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.edit')}</button>
                      <button onClick={() => onDelete(r.id)}
                        className="btn-secondary text-xs py-0.5 px-2 text-error hover:bg-error-container/10">{t('fcmval.del')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={secondField ? 3 : 2} className="py-6 text-center text-on-surface-variant/60 text-xs">{t('fcmval.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// â”€â”€ Prio editor (form + profile aware) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PrioEditorProps { level: 1 | 2 | 3; onBack: () => void }

function PrioEditor({ level, onBack }: PrioEditorProps) {
  const { t } = useTranslation()
  const prioField = `Prio${level}` as const
  const txtField  = `Prio${level}Txt` as const

  const [rows, setRows]               = useState<Row[]>([])
  const [formName, setFormName]       = useState('*')
  const [newPrio, setNewPrio]         = useState('')
  const [newTxt, setNewTxt]           = useState('')
  const [editId, setEditId]           = useState<number | null>(null)
  const [editPrio, setEditPrio]       = useState('')
  const [editTxt, setEditTxt]         = useState('')
  const [editFormName, setEditFormName] = useState('*')

  const load = useCallback(async () => {
    const all = (await window.db.prio.getAll(level)) as Row[]
    const fn = formName === '*' ? '' : formName
    setRows(fn ? all.filter(r => r.IDFormName === fn) : all)
  }, [level, formName])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    const p = parseInt(newPrio)
    if (!newPrio || isNaN(p)) return
    await window.db.prio.create(level, {
      IDFormName: formName === '*' ? '' : formName,
      [prioField]: p,
      [txtField]:  newTxt
    })
    setNewPrio(''); setNewTxt('')
    load()
  }

  async function handleSave(id: number) {
    const p = parseInt(editPrio)
    if (isNaN(p)) return
    await window.db.prio.update(level, id, { [prioField]: p, [txtField]: editTxt, IDFormName: editFormName === '*' ? '' : editFormName })
    setEditId(null)
    load()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-outline-variant/40">
        <button onClick={onBack} className="btn-secondary text-xs py-1 px-3">← {t('fcmval.back')}</button>
        <h2 className="text-base font-semibold text-on-surface">{t('fcmval.prio')} {level}</h2>
      </div>
      <div className="p-5 overflow-auto flex-1 flex flex-col gap-4 max-w-xl">
        <div className="flex gap-3 text-sm items-center">
          <span className="text-on-surface-variant">{t('fcmval.formName')}:</span>
          <FormSelect value={formName} onChange={setFormName} className="w-36" />
        </div>
        <div className="flex gap-2">
          <input value={newPrio} onChange={e => setNewPrio(e.target.value)} type="number"
            placeholder={t('fcmval.prioNr')} className="input-field w-20" />
          <input value={newTxt} onChange={e => setNewTxt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={t('fcmval.prioTxt')} className="input-field flex-1" />
          <button onClick={handleAdd} className="btn-primary">{t('fcmval.add')}</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-outline-variant/40">
              <th className="pb-2 font-medium text-on-surface-variant w-16">Nr.</th>
              <th className="pb-2 font-medium text-on-surface-variant">{t('fcmval.prioTxt')}</th>
              <th className="pb-2 font-medium text-on-surface-variant w-32">{t('fcmval.formName')}</th>
              <th className="pb-2 w-28" />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-outline-variant/20">
                <td className="py-1.5">
                  {editId === r.id
                    ? <input value={editPrio} onChange={e => setEditPrio(e.target.value)} type="number" className="input-field w-16" />
                    : <span className="text-on-surface font-mono">{String(r[prioField] ?? '')}</span>}
                </td>
                <td className="py-1.5">
                  {editId === r.id
                    ? <input value={editTxt} onChange={e => setEditTxt(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(r.id); if (e.key === 'Escape') setEditId(null) }}
                        className="input-field w-full" autoFocus />
                    : <span className="text-on-surface">{String(r[txtField] ?? '')}</span>}
                </td>
                <td className="py-1.5">
                  {editId === r.id
                    ? <FormSelect value={editFormName} onChange={setEditFormName} className="w-full text-xs" />
                    : <span className="text-on-surface-variant text-xs">{FORM_OPTIONS.find(o => o.value === String(r.IDFormName || '*'))?.label ?? String(r.IDFormName ?? '*')}</span>}
                </td>
                <td className="py-1.5 text-right">
                  {editId === r.id ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleSave(r.id)} className="btn-primary text-xs py-0.5 px-2">{t('fcmval.ok')}</button>
                      <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.cancel')}</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditId(r.id); setEditPrio(String(r[prioField] ?? '')); setEditTxt(String(r[txtField] ?? '')); setEditFormName(String(r.IDFormName || '*')) }}
                        className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.edit')}</button>
                      <button onClick={async () => { await window.db.prio.delete(level, r.id); load() }}
                        className="btn-secondary text-xs py-0.5 px-2 text-error hover:bg-error-container/10">{t('fcmval.del')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-on-surface-variant/60 text-xs">{t('fcmval.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// â”€â”€ Status editor (with theme assignment) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusEditor({ rows, themes, onAdd, onUpdate, onDelete, onBack }: {
  rows: Row[]
  themes: Row[]
  onAdd: (status: string, formName: string, themeId: number) => Promise<void>
  onUpdate: (id: number, status: string, formName: string, themeId: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [newStatus, setNewStatus] = useState('')
  const [newForm, setNewForm] = useState('*')
  const [newTheme, setNewTheme] = useState(0)
  const [editId, setEditId] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editForm, setEditForm] = useState('')
  const [editTheme, setEditTheme] = useState(0)

  function startEdit(r: Row) {
    setEditId(r.id as number)
    setEditStatus(String(r.Status ?? ''))
    setEditForm(String(r.IDFormName ?? '*'))
    setEditTheme(Number(r.IDTheme ?? 0))
  }

  async function handleAdd() {
    if (!newStatus.trim()) return
    await onAdd(newStatus.trim(), newForm || '*', newTheme)
    setNewStatus(''); setNewForm('*'); setNewTheme(0)
  }

  async function handleSave(id: number) {
    if (!editStatus.trim()) return
    await onUpdate(id, editStatus.trim(), editForm || '*', editTheme)
    setEditId(null)
  }

  const themeName = (id: number) =>
    id === 0 ? t('fcmval.allThemes') : String(themes.find(th => Number(th.id) === id)?.ThemeName ?? `ID:${id}`)

  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortedStatus = [...rows].sort((a, b) => {
    const d = sortDir === 'asc' ? 1 : -1
    if (sortCol === 'status') return String(a.Status ?? '').localeCompare(String(b.Status ?? ''), 'de') * d
    if (sortCol === 'theme')  return themeName(Number(a.IDTheme ?? 0)).localeCompare(themeName(Number(b.IDTheme ?? 0)), 'de') * d
    return String(a.Status ?? '').localeCompare(String(b.Status ?? ''), 'de')
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-outline-variant/40">
        <button onClick={onBack} className="btn-secondary text-xs py-1 px-3">← {t('fcmval.back')}</button>
        <h2 className="text-base font-semibold text-on-surface">{t('fcmval.status')}</h2>
      </div>
      <div className="p-5 overflow-auto flex-1 flex flex-col gap-4 max-w-2xl">
        <div className="flex gap-2 flex-wrap">
          <input value={newStatus} onChange={e => setNewStatus(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={t('fcmval.newValue')} className="input-field flex-1 min-w-28" />
          <FormSelect value={newForm} onChange={setNewForm} className="w-36" />
          <select value={newTheme} onChange={e => setNewTheme(Number(e.target.value))}
            className="input-field w-40">
            <option value={0}>{t('fcmval.allThemes')}</option>
            {themes.map(th => (
              <option key={String(th.id)} value={Number(th.id)}>{String(th.ThemeName)}</option>
            ))}
          </select>
          <button onClick={handleAdd} className="btn-primary">{t('fcmval.add')}</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-outline-variant/40">
<SortTh label="Status" col="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <th className="pb-2 font-medium text-on-surface-variant w-24">{t('fcmval.formName')}</th>
              <SortTh label={t('fcmval.theme')} col="theme" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-36" />
              <th className="pb-2 w-28" />
            </tr>
          </thead>
          <tbody>
            {sortedStatus.map(r => (
              <tr key={String(r.id)} className="border-b border-outline-variant/20">
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <input value={editStatus} onChange={e => setEditStatus(e.target.value)}
                      className="input-field w-full" autoFocus />
                  ) : (
                    <span className="text-on-surface">{String(r.Status ?? '')}</span>
                  )}
                </td>
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <FormSelect value={editForm} onChange={setEditForm} className="w-full text-xs" />
                  ) : (
                    <span className="text-on-surface-variant text-xs">{FORM_OPTIONS.find(o => o.value === String(r.IDFormName ?? '*'))?.label ?? String(r.IDFormName ?? '*')}</span>
                  )}
                </td>
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <select value={editTheme} onChange={e => setEditTheme(Number(e.target.value))}
                      className="input-field w-full text-xs">
                      <option value={0}>{t('fcmval.allThemes')}</option>
                      {themes.map(th => (
                        <option key={String(th.id)} value={Number(th.id)}>{String(th.ThemeName)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-on-surface-variant text-xs">{themeName(Number(r.IDTheme ?? 0))}</span>
                  )}
                </td>
                <td className="py-1.5 text-right">
                  {editId === (r.id as number) ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleSave(r.id as number)} className="btn-primary text-xs py-0.5 px-2">{t('fcmval.ok')}</button>
                      <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.cancel')}</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => startEdit(r)} className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.edit')}</button>
                      <button onClick={() => onDelete(r.id as number)} className="btn-secondary text-xs py-0.5 px-2 text-error hover:bg-error-container/10">{t('fcmval.del')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-on-surface-variant/60 text-xs">{t('fcmval.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// â”€â”€ Thema editor (ThemeName + Formular + Bereich) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ThemaEditor({ rows, areas, onAdd, onUpdate, onDelete, onBack }: {
  rows: Row[]
  areas: Row[]
  onAdd: (theme: string, formName: string, areaId: number) => Promise<void>
  onUpdate: (id: number, theme: string, formName: string, areaId: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [newTheme, setNewTheme] = useState('')
  const [newForm, setNewForm]   = useState('*')
  const [newArea, setNewArea]   = useState(0)
  const [editId, setEditId]     = useState<number | null>(null)
  const [editTheme, setEditTheme] = useState('')
  const [editForm, setEditForm]   = useState('')
  const [editArea, setEditArea]   = useState(0)

  function startEdit(r: Row) {
    setEditId(r.id as number)
    setEditTheme(String(r.ThemeName ?? ''))
    setEditForm(String(r.IDFormName ?? '*'))
    setEditArea(Number(r.IDArea ?? 0))
  }

  async function handleAdd() {
    if (!newTheme.trim()) return
    await onAdd(newTheme.trim(), newForm || '*', newArea)
    setNewTheme(''); setNewForm('*'); setNewArea(0)
  }

  async function handleSave(id: number) {
    if (!editTheme.trim()) return
    await onUpdate(id, editTheme.trim(), editForm || '*', editArea)
    setEditId(null)
  }

  const areaLabel = (id: number) =>
    id === 0 ? t('fcmval.allAreas') : String(areas.find(a => Number(a.id) === id)?.AreaName ?? `ID:${id}`)

  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sorted = [...rows].sort((a, b) => {
    const d = sortDir === 'asc' ? 1 : -1
    if (sortCol === 'theme') return String(a.ThemeName ?? '').localeCompare(String(b.ThemeName ?? ''), 'de') * d
    if (sortCol === 'area')  return areaLabel(Number(a.IDArea ?? 0)).localeCompare(areaLabel(Number(b.IDArea ?? 0)), 'de') * d
    return String(a.ThemeName ?? '').localeCompare(String(b.ThemeName ?? ''), 'de')
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-outline-variant/40">
        <button onClick={onBack} className="btn-secondary text-xs py-1 px-3">← {t('fcmval.back')}</button>
        <h2 className="text-base font-semibold text-on-surface">{t('fcmval.areas')}</h2>
      </div>
      <div className="p-5 overflow-auto flex-1 flex flex-col gap-4 max-w-2xl">
        <div className="flex gap-2 flex-wrap">
          <input value={newTheme} onChange={e => setNewTheme(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={t('fcmval.newValue')} className="input-field flex-1 min-w-28" />
          <FormSelect value={newForm} onChange={setNewForm} className="w-36" />
          <select value={newArea} onChange={e => setNewArea(Number(e.target.value))} className="input-field w-40">
            <option value={0}>{t('fcmval.allAreas')}</option>
            {areas.map(a => (
              <option key={String(a.id)} value={Number(a.id)}>{String(a.AreaName)}</option>
            ))}
          </select>
          <button onClick={handleAdd} className="btn-primary">{t('fcmval.add')}</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-outline-variant/40">
              <SortTh label={t('fcmval.theme')}    col="theme" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <th className="pb-2 font-medium text-on-surface-variant w-24">{t('fcmval.formName')}</th>
              <SortTh label={t('fcmval.area')}     col="area"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-36" />
              <th className="pb-2 w-28" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={String(r.id)} className="border-b border-outline-variant/20">
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <input value={editTheme} onChange={e => setEditTheme(e.target.value)}
                      className="input-field w-full" autoFocus />
                  ) : (
                    <span className="text-on-surface">{String(r.ThemeName ?? '')}</span>
                  )}
                </td>
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <FormSelect value={editForm} onChange={setEditForm} className="w-full text-xs" />
                  ) : (
                    <span className="text-on-surface-variant text-xs">{FORM_OPTIONS.find(o => o.value === String(r.IDFormName ?? '*'))?.label ?? String(r.IDFormName ?? '*')}</span>
                  )}
                </td>
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <select value={editArea} onChange={e => setEditArea(Number(e.target.value))}
                      className="input-field w-full text-xs">
                      <option value={0}>{t('fcmval.allAreas')}</option>
                      {areas.map(a => (
                        <option key={String(a.id)} value={Number(a.id)}>{String(a.AreaName)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-on-surface-variant text-xs">{areaLabel(Number(r.IDArea ?? 0))}</span>
                  )}
                </td>
                <td className="py-1.5 text-right">
                  {editId === (r.id as number) ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleSave(r.id as number)} className="btn-primary text-xs py-0.5 px-2">{t('fcmval.ok')}</button>
                      <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.cancel')}</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => startEdit(r)} className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.edit')}</button>
                      <button onClick={() => onDelete(r.id as number)} className="btn-secondary text-xs py-0.5 px-2 text-error hover:bg-error-container/10">{t('fcmval.del')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-on-surface-variant/60 text-xs">{t('fcmval.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// â”€â”€ Kategorie editor (Cat + Thema-Dropdown mit '*') â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KatEditor({ rows, themes, onAdd, onUpdate, onDelete, onBack }: {
  rows: Row[]
  themes: Row[]
  onAdd: (cat: string, formName: string, themeId: number) => Promise<void>
  onUpdate: (id: number, cat: string, formName: string, themeId: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [newCat, setNewCat]   = useState('')
  const [newForm, setNewForm] = useState('*')
  const [newTheme, setNewTheme] = useState(0)
  const [editId, setEditId]   = useState<number | null>(null)
  const [editCat, setEditCat] = useState('')
  const [editForm, setEditForm] = useState('')
  const [editTheme, setEditTheme] = useState(0)

  function startEdit(r: Row) {
    setEditId(r.id as number)
    setEditCat(String(r.Cat ?? ''))
    setEditForm(String(r.IDFormName ?? '*'))
    setEditTheme(Number(r.IDTheme ?? 0))
  }

  async function handleAdd() {
    if (!newCat.trim()) return
    await onAdd(newCat.trim(), newForm || '*', newTheme)
    setNewCat(''); setNewForm('*'); setNewTheme(0)
  }

  async function handleSave(id: number) {
    if (!editCat.trim()) return
    await onUpdate(id, editCat.trim(), editForm || '*', editTheme)
    setEditId(null)
  }

  const themeName = (id: number) =>
    id === 0 ? t('fcmval.allThemes') : String(themes.find(th => Number(th.id) === id)?.ThemeName ?? `ID:${id}`)

  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortedCat = [...rows].sort((a, b) => {
    const d = sortDir === 'asc' ? 1 : -1
    if (sortCol === 'cat')   return String(a.Cat ?? '').localeCompare(String(b.Cat ?? ''), 'de') * d
    if (sortCol === 'theme') return themeName(Number(a.IDTheme ?? 0)).localeCompare(themeName(Number(b.IDTheme ?? 0)), 'de') * d
    return String(a.Cat ?? '').localeCompare(String(b.Cat ?? ''), 'de')
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-outline-variant/40">
        <button onClick={onBack} className="btn-secondary text-xs py-1 px-3">← {t('fcmval.back')}</button>
        <h2 className="text-base font-semibold text-on-surface">{t('fcmval.cat')}</h2>
      </div>
      <div className="p-5 overflow-auto flex-1 flex flex-col gap-4 max-w-2xl">
        <div className="flex gap-2 flex-wrap">
          <input value={newCat} onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={t('fcmval.newValue')} className="input-field flex-1 min-w-28" />
          <FormSelect value={newForm} onChange={setNewForm} className="w-36" />
          <select value={newTheme} onChange={e => setNewTheme(Number(e.target.value))}
            className="input-field w-40">
            <option value={0}>{t('fcmval.allThemes')}</option>
            {themes.map(th => (
              <option key={String(th.id)} value={Number(th.id)}>{String(th.ThemeName)}</option>
            ))}
          </select>
          <button onClick={handleAdd} className="btn-primary">{t('fcmval.add')}</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-outline-variant/40">
<SortTh label="Kategorie" col="cat" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <th className="pb-2 font-medium text-on-surface-variant w-24">{t('fcmval.formName')}</th>
              <SortTh label={t('fcmval.theme')} col="theme" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-36" />
              <th className="pb-2 w-28" />
            </tr>
          </thead>
          <tbody>
            {sortedCat.map(r => (
              <tr key={String(r.id)} className="border-b border-outline-variant/20">
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <input value={editCat} onChange={e => setEditCat(e.target.value)}
                      className="input-field w-full" autoFocus />
                  ) : (
                    <span className="text-on-surface">{String(r.Cat ?? '')}</span>
                  )}
                </td>
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <FormSelect value={editForm} onChange={setEditForm} className="w-full text-xs" />
                  ) : (
                    <span className="text-on-surface-variant text-xs">{FORM_OPTIONS.find(o => o.value === String(r.IDFormName ?? '*'))?.label ?? String(r.IDFormName ?? '*')}</span>
                  )}
                </td>
                <td className="py-1.5">
                  {editId === (r.id as number) ? (
                    <select value={editTheme} onChange={e => setEditTheme(Number(e.target.value))}
                      className="input-field w-full text-xs">
                      <option value={0}>{t('fcmval.allThemes')}</option>
                      {themes.map(th => (
                        <option key={String(th.id)} value={Number(th.id)}>{String(th.ThemeName)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-on-surface-variant text-xs">{themeName(Number(r.IDTheme ?? 0))}</span>
                  )}
                </td>
                <td className="py-1.5 text-right">
                  {editId === (r.id as number) ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleSave(r.id as number)} className="btn-primary text-xs py-0.5 px-2">{t('fcmval.ok')}</button>
                      <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.cancel')}</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => startEdit(r)} className="btn-secondary text-xs py-0.5 px-2">{t('fcmval.edit')}</button>
                      <button onClick={() => onDelete(r.id as number)} className="btn-secondary text-xs py-0.5 px-2 text-error hover:bg-error-container/10">{t('fcmval.del')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {sortedCat.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-on-surface-variant/60 text-xs">{t('fcmval.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// â”€â”€ Hub button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HubBtn({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-44 text-sm px-3 py-2 border rounded text-left transition-colors ${
        disabled
          ? 'border-outline-variant/40 text-on-surface-variant/40 cursor-not-allowed bg-surface-container'
          : 'border-outline-variant text-on-surface hover:bg-surface-container-high hover:border-apple-blue cursor-pointer bg-surface-container'
      }`}
    >
      {label}
    </button>
  )
}

// â”€â”€ Main FCMValueView â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Props { onBack: () => void }

export default function FCMValueView({ onBack }: Props) {
  const { t } = useTranslation()
  const [sub, setSub] = useState<SubEditor>(null)

  // â”€â”€ Sub-editor wiring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function reloadArea() { return (await window.db.area.getAll()) as Row[] }
  async function reloadTheme() { return (await window.db.theme.getAll()) as Row[] }
  async function reloadStatus() { return (await window.db.status.getAll()) as Row[] }
  async function reloadCat() { return (await window.db.cat.getAll()) as Row[] }
  async function reloadLand() { return (await window.db.land.getAll()) as Row[] }
  async function reloadKS() { return (await window.db.kostenstelle.getAll()) as Row[] }
  async function reloadAuftrag() { return (await window.db.auftrag.getAll()) as Row[] }
  async function reloadProjekt() { return (await window.db.projekt.getAll()) as Row[] }

  const [areaRows,        setAreaRows]        = useState<Row[]>([])
  const [themeRows,       setThemeRows]       = useState<Row[]>([])
  const [statusRows,      setStatusRows]      = useState<Row[]>([])
  const [catRows,         setCatRows]         = useState<Row[]>([])
  const [landRows,        setLandRows]        = useState<Row[]>([])
  const [ksRows,          setKsRows]          = useState<Row[]>([])
  const [auftragRows,     setAuftragRows]     = useState<Row[]>([])
  const [projektRows,     setProjektRows]     = useState<Row[]>([])

  useEffect(() => {
    if (sub === 'bereich')       { reloadTheme().then(setThemeRows); reloadArea().then(setAreaRows) }
    if (sub === 'status')        { reloadStatus().then(setStatusRows); reloadTheme().then(setThemeRows) }
    if (sub === 'kat')           { reloadCat().then(setCatRows); reloadTheme().then(setThemeRows) }
    if (sub === 'land')          reloadLand().then(setLandRows)
    if (sub === 'kostenstelle')  reloadKS().then(setKsRows)
    if (sub === 'auftrag')       reloadAuftrag().then(setAuftragRows)
    if (sub === 'projekt')       reloadProjekt().then(setProjektRows)
  }, [sub])

  if (sub === 'bereich') return (
    <ThemaEditor
      rows={themeRows}
      areas={areaRows}
      onAdd={async (th, f, aid) => { await window.db.theme.create({ ThemeName: th, IDFormName: f, IDArea: aid, binArchiv: 0 }); setThemeRows(await reloadTheme()) }}
      onUpdate={async (id, th, f, aid) => { await window.db.theme.update(id, { ThemeName: th, IDFormName: f, IDArea: aid }); setThemeRows(await reloadTheme()) }}
      onDelete={async id => { await window.db.theme.delete(id); setThemeRows(await reloadTheme()) }}
      onBack={() => setSub(null)} />
  )

  if (sub === 'prio1') return <PrioEditor level={1} onBack={() => setSub(null)} />
  if (sub === 'prio2') return <PrioEditor level={2} onBack={() => setSub(null)} />
  if (sub === 'prio3') return <PrioEditor level={3} onBack={() => setSub(null)} />

  if (sub === 'status') return (
    <StatusEditor
      rows={statusRows}
      themes={themeRows}
      onAdd={async (s, f, tid) => { await window.db.status.create({ Status: s, IDFormName: f, IDTheme: tid }); setStatusRows(await reloadStatus()) }}
      onUpdate={async (id, s, f, tid) => { await window.db.status.update(id, { Status: s, IDFormName: f, IDTheme: tid }); setStatusRows(await reloadStatus()) }}
      onDelete={async id => { await window.db.status.delete(id); setStatusRows(await reloadStatus()) }}
      onBack={() => setSub(null)} />
  )

  if (sub === 'kat') return (
    <KatEditor
      rows={catRows}
      themes={themeRows}
      onAdd={async (cat, f, tid) => {
        const tn = String(themeRows.find(t => Number(t.id) === tid)?.ThemeName ?? '*')
        await window.db.cat.create({ Cat: cat, IDFormName: f, IDTheme: tid, CatGrp: tn, bActive: 1 })
        setCatRows(await reloadCat())
      }}
      onUpdate={async (id, cat, f, tid) => {
        const tn = String(themeRows.find(t => Number(t.id) === tid)?.ThemeName ?? '*')
        await window.db.cat.update(id, { Cat: cat, IDFormName: f, IDTheme: tid, CatGrp: tn })
        setCatRows(await reloadCat())
      }}
      onDelete={async id => { await window.db.cat.delete(id); setCatRows(await reloadCat()) }}
      onBack={() => setSub(null)} />
  )

  if (sub === 'land') return (
    <SimpleListEditor title={t('fcmval.land')} rows={landRows} labelField="LandName"
      secondField="LandCode" secondLabel={t('fcmval.landCode')}
      onAdd={async (v, code) => { await window.db.land.create({ LandName: v, LandCode: code || '' }); setLandRows(await reloadLand()) }}
      onDelete={async id => { await window.db.land.delete(id); setLandRows(await reloadLand()) }}
      onRename={async (id, v, code) => { await window.db.land.update(id, { LandName: v, LandCode: code || '' }); setLandRows(await reloadLand()) }}
      onBack={() => setSub(null)} />
  )

  if (sub === 'kostenstelle') return (
    <SimpleListEditor title={t('fcmval.kostenstelle')} rows={ksRows} labelField="KSName"
      secondField="KSNr" secondLabel={t('fcmval.ksNr')}
      onAdd={async (v, nr) => { await window.db.kostenstelle.create({ KSName: v, KSNr: nr || '' }); setKsRows(await reloadKS()) }}
      onDelete={async id => { await window.db.kostenstelle.delete(id); setKsRows(await reloadKS()) }}
      onRename={async (id, v, nr) => { await window.db.kostenstelle.update(id, { KSName: v, KSNr: nr || '' }); setKsRows(await reloadKS()) }}
      onBack={() => setSub(null)} />
  )

  if (sub === 'auftrag') return (
    <SimpleListEditor title={t('fcmval.auftrag')} rows={auftragRows} labelField="AuftragName"
      secondField="AuftragNr" secondLabel={t('fcmval.auftragNr')}
      onAdd={async (v, nr) => { await window.db.auftrag.create({ AuftragName: v, AuftragNr: nr || '' }); setAuftragRows(await reloadAuftrag()) }}
      onDelete={async id => { await window.db.auftrag.delete(id); setAuftragRows(await reloadAuftrag()) }}
      onRename={async (id, v, nr) => { await window.db.auftrag.update(id, { AuftragName: v, AuftragNr: nr || '' }); setAuftragRows(await reloadAuftrag()) }}
      onBack={() => setSub(null)} />
  )

  if (sub === 'projekt') return (
    <SimpleListEditor title={t('fcmval.projekt')} rows={projektRows} labelField="ProjektName"
      secondField="ProjektNr" secondLabel={t('fcmval.projektNr')}
      onAdd={async (v, nr) => { await window.db.projekt.create({ ProjektName: v, ProjektNr: nr || '' }); setProjektRows(await reloadProjekt()) }}
      onDelete={async id => { await window.db.projekt.delete(id); setProjektRows(await reloadProjekt()) }}
      onRename={async (id, v, nr) => { await window.db.projekt.update(id, { ProjektName: v, ProjektNr: nr || '' }); setProjektRows(await reloadProjekt()) }}
      onBack={() => setSub(null)} />
  )

  // â”€â”€ Hub â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/40">
        <button onClick={onBack} className="btn-secondary text-xs py-1 px-3">← {t('fcmval.backMain')}</button>
        <h1 className="text-xl font-semibold text-on-surface">{t('fcmval.title')}</h1>
      </div>

      <div className="p-6 overflow-auto flex-1">
        <div className="grid grid-cols-2 gap-x-10 gap-y-3 max-w-lg">

          {/* Spalte 1: Prioritäten + Kontierungsobjekte */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-1">{t('fcmval.secPrio')}</p>
            <HubBtn label={t('fcmval.prio1btn')} onClick={() => setSub('prio1')} />
            <HubBtn label={t('fcmval.prio2btn')} onClick={() => setSub('prio2')} />
            <HubBtn label={t('fcmval.prio3btn')} onClick={() => setSub('prio3')} />
            <div className="mt-4" />
            <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-1">{t('fcmval.secCont')}</p>
            <HubBtn label={t('fcmval.land')}          onClick={() => setSub('land')} />
            <HubBtn label={t('fcmval.kostenstelle')}  onClick={() => setSub('kostenstelle')} />
            <HubBtn label={t('fcmval.auftrag')}       onClick={() => setSub('auftrag')} />
            <HubBtn label={t('fcmval.projekt')}       onClick={() => setSub('projekt')} />
          </div>

          {/* Spalte 2: Bereich / Thema / Kategorie / Status */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-1">{t('fcmval.secValues')}</p>
            <HubBtn label={t('fcmval.areas')}  onClick={() => setSub('bereich')} />
            <HubBtn label={t('fcmval.status')} onClick={() => setSub('status')} />
            <HubBtn label={t('fcmval.cat')}    onClick={() => setSub('kat')} />
          </div>

        </div>
      </div>
    </div>
  )
}

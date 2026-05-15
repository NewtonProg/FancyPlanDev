import { useState } from 'react'

function by2<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.slice(0, 2).localeCompare(b.name.slice(0, 2), undefined, { sensitivity: 'base' }) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

export type BtkItem    = { id: number; name: string }
export type BtkLevel1  = BtkItem & { childIds: number[] }
export type BtkLevel3  = BtkItem & { parentId: number }

export type BtkSelection = {
  level1: BtkLevel1 | null
  level2: BtkItem   | null
  level3: BtkLevel3 | null
}

export type BtkSelectorProps = {
  level1Items: BtkLevel1[]
  level2Items: BtkItem[]
  level3Items: BtkLevel3[]
  labels?: {
    level1?: string
    level2?: string
    level3?: string
  }
  /** Wenn true: Ebene 2/3 auch ohne Eltern-Selektion nutzbar (zeigt alle Einträge) */
  showAllWhenEmpty?: boolean
  /** Kontrollierter Modus: Selektion von außen */
  value?: BtkSelection
  onChange?: (sel: BtkSelection) => void
}

function AccHeader({
  label, open, onToggle, disabled = false
}: {
  label: string; open: boolean; onToggle: () => void; disabled?: boolean
}): JSX.Element {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
        disabled
          ? 'text-on-surface-variant/40 cursor-not-allowed'
          : open
            ? 'bg-primary/10 text-primary'
            : 'text-on-surface hover:bg-surface-container-highest'
      }`}
    >
      <span className="truncate text-left">{label}</span>
      <span
        className="text-[10px] flex-shrink-0 ml-1"
        style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
      >
        ▶
      </span>
    </button>
  )
}

function AccListItem({
  label, active, onClick
}: {
  label: string; active: boolean; onClick: () => void
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors truncate ${
        active
          ? 'bg-primary text-on-primary font-medium'
          : 'text-on-surface-variant hover:bg-surface-container-highest'
      }`}
    >
      {label}
    </button>
  )
}

export default function BtkSelector({
  level1Items,
  level2Items,
  level3Items,
  labels = {},
  showAllWhenEmpty,
  value,
  onChange
}: BtkSelectorProps): JSX.Element {
  const lbl1 = labels.level1 ?? 'Bereich'
  const lbl2 = labels.level2 ?? 'Themen'
  const lbl3 = labels.level3 ?? 'Kategorien'

  // Unkontrollierter Fallback-State
  const [internalSel, setInternalSel] = useState<BtkSelection>(
    value ?? { level1: null, level2: null, level3: null }
  )

  const sel = value ?? internalSel

  const [acc1Open, setAcc1Open] = useState(() => !!sel.level1)
  const [acc2Open, setAcc2Open] = useState(() => !!(sel.level2 || (sel.level1 && showAllWhenEmpty)))
  const [acc3Open, setAcc3Open] = useState(() => !!sel.level3)

  function emit(next: BtkSelection): void {
    if (!value) setInternalSel(next)
    onChange?.(next)
  }

  function selectLevel1(item: BtkLevel1): void {
    if (sel.level1?.id === item.id) {
      emit({ level1: null, level2: null, level3: null })
      return
    }
    emit({ level1: item, level2: null, level3: null })
    setAcc2Open(true)
    setAcc3Open(false)
  }

  function selectLevel2(item: BtkItem): void {
    if (sel.level2?.id === item.id) {
      emit({ ...sel, level2: null, level3: null })
      setAcc3Open(false)
      return
    }
    emit({ ...sel, level2: item, level3: null })
    setAcc3Open(true)
  }

  function selectLevel3(item: BtkLevel3): void {
    if (sel.level3?.id === item.id) {
      emit({ ...sel, level3: null })
      return
    }
    emit({ ...sel, level3: item })
  }

  const visibleLevel2 = sel.level1
    ? level2Items.filter(t => sel.level1!.childIds.includes(t.id))
    : showAllWhenEmpty ? level2Items : []

  const visibleLevel3 = sel.level2
    ? level3Items.filter(k => k.parentId === sel.level2!.id || k.parentId === 0)
    : showAllWhenEmpty ? level3Items : []

  const hdr1 = sel.level1 ? `${lbl1}: ${sel.level1.name}` : lbl1
  const hdr2 = sel.level2 ? `${lbl2}: ${sel.level2.name}` : lbl2
  const hdr3 = sel.level3 ? `${lbl3}: ${sel.level3.name}` : lbl3

  const level2Disabled = !sel.level1 && !showAllWhenEmpty
  const level3Disabled = !sel.level2 && !showAllWhenEmpty

  return (
    <div className="flex flex-col gap-1">

      <AccHeader label={hdr1} open={acc1Open} onToggle={() => setAcc1Open(p => !p)} />
      {acc1Open && (
        <div className="mb-1 flex flex-col gap-0.5 pl-3">
          {by2(level1Items).map(item => (
            <AccListItem key={item.id} label={item.name} active={sel.level1?.id === item.id} onClick={() => selectLevel1(item)} />
          ))}
        </div>
      )}

      <div className="border-t border-outline-variant my-0.5" />

      <AccHeader label={hdr2} open={acc2Open} onToggle={() => { if (!level2Disabled) setAcc2Open(p => !p) }} disabled={level2Disabled} />
      {acc2Open && !level2Disabled && (
        <div className="mb-1 flex flex-col gap-0.5 pl-3">
          {by2(visibleLevel2).map(item => (
            <AccListItem key={item.id} label={item.name} active={sel.level2?.id === item.id} onClick={() => selectLevel2(item)} />
          ))}
        </div>
      )}

      <div className="border-t border-outline-variant my-0.5" />

      <AccHeader label={hdr3} open={acc3Open} onToggle={() => { if (!level3Disabled) setAcc3Open(p => !p) }} disabled={level3Disabled} />
      {acc3Open && !level3Disabled && (
        <div className="flex flex-col gap-0.5 pl-3">
          {by2(visibleLevel3).map(item => (
            <AccListItem key={item.id} label={item.name} active={sel.level3?.id === item.id} onClick={() => selectLevel3(item)} />
          ))}
        </div>
      )}
    </div>
  )
}

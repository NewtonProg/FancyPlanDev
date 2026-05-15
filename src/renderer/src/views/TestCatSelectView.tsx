import { useState } from 'react'
import BtkSelector, { BtkLevel1, BtkItem, BtkLevel3, BtkSelection } from '../components/BtkSelector'

// --- Testdaten ---
const BEREICHE: BtkLevel1[] = [
  { id: 1, name: 'Bereich 1', childIds: [1, 2] },
  { id: 2, name: 'Bereich 2', childIds: [2, 3] },
]

const THEMEN: BtkItem[] = [
  { id: 1, name: 'Thema 1' },
  { id: 2, name: 'Thema 2' },
  { id: 3, name: 'Thema 3' },
]

const KATEGORIEN: BtkLevel3[] = [
  { id: 1, name: 'Kategorie 1', parentId: 1 },
  { id: 2, name: 'Kategorie 2', parentId: 1 },
  { id: 3, name: 'Kategorie 3', parentId: 2 },
  { id: 4, name: 'Kategorie 4', parentId: 2 },
  { id: 5, name: 'Kategorie 4', parentId: 3 },
  { id: 6, name: 'Kategorie 5', parentId: 3 },
  { id: 7, name: 'Kategorie 6', parentId: 3 },
]

function SummaryRow({ label, value }: { label: string; value?: string }): JSX.Element {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40">
      <span className="text-xs font-semibold text-on-surface-variant/60 w-20">{label}</span>
      <span className={`text-sm ${value ? 'text-on-surface font-medium' : 'text-on-surface-variant/40 italic'}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

export default function TestCatSelectView(): JSX.Element {
  const [sel, setSel] = useState<BtkSelection>({ level1: null, level2: null, level3: null })

  return (
    <div className="flex h-full overflow-hidden">

      {/* Linkes Panel: BtkSelector */}
      <aside className="w-60 flex-shrink-0 border-r border-outline-variant/40 bg-surface-container-low overflow-y-auto p-3">
        <BtkSelector
          level1Items={BEREICHE}
          level2Items={THEMEN}
          level3Items={KATEGORIEN}
          onChange={setSel}
        />
      </aside>

      {/* Rechtes Panel: Auswahl-Zusammenfassung */}
      <main className="flex-1 overflow-y-auto p-6">
        <p className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-4">
          Aktuelle Auswahl
        </p>
        <div className="max-w-xs space-y-2">
          <SummaryRow label="Bereich"   value={sel.level1?.name} />
          <SummaryRow label="Thema"     value={sel.level2?.name} />
          <SummaryRow label="Kategorie" value={sel.level3?.name} />
        </div>
      </main>
    </div>
  )
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
  /** Schrittweite der Minutenspalte (Standard: 1 → jede Minute auswählbar) */
  minuteStep?: number
}

const ITEM_H = 36 // px – Höhe einer Listenzeile
const VISIBLE = 5 // sichtbare Zeilen (ungerade → mittige Auswahl)
const VIEW_H = ITEM_H * VISIBLE
const PAD = (VIEW_H - ITEM_H) / 2 // Leerraum oben/unten, damit Randwerte mittig stehen können
// Schwelle für das Mausrad: ein normaler Mausrad-Klick (deltaY ≈ 100/120)
// bewegt genau einen Schritt; Trackpad-Deltas werden bis zur Schwelle summiert.
const WHEEL_THRESHOLD = 40

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function parse(value: string): { h: number; m: number } {
  const match = /^(\d{1,2}):(\d{1,2})/.exec(value || '')
  if (!match) return { h: 0, m: 0 }
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10) || 0))
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10) || 0))
  return { h, m }
}

/** Scrollbare Zahlenspalte mit feinem Mausrad-Stepping (1 Schritt pro Raste). */
function Column({
  items,
  selected,
  onSelect
}: {
  items: number[]
  selected: number
  onSelect: (value: number) => void
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const accum = useRef(0)

  // Ausgewählten Eintrag in die Mitte des sichtbaren Bereichs scrollen.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const idx = items.indexOf(selected)
    if (idx < 0) return
    el.scrollTop = idx * ITEM_H // dank PAD oben liegt idx*ITEM_H exakt mittig
  }, [selected, items])

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault()
    accum.current += e.deltaY
    let steps = 0
    while (Math.abs(accum.current) >= WHEEL_THRESHOLD) {
      steps += accum.current > 0 ? 1 : -1
      accum.current -= accum.current > 0 ? WHEEL_THRESHOLD : -WHEEL_THRESHOLD
    }
    if (steps === 0) return
    const idx = items.indexOf(selected)
    const len = items.length
    const next = ((idx + steps) % len + len) % len // mit Umlauf
    onSelect(items[next])
  }

  return (
    <div
      ref={ref}
      onWheel={handleWheel}
      className="relative z-10 w-16 overflow-y-auto [&::-webkit-scrollbar]:hidden"
      style={{
        height: VIEW_H,
        scrollbarWidth: 'none',
        // sanftes Ausblenden der Werte am oberen/unteren Rand
        maskImage:
          'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)'
      }}
    >
      <div style={{ paddingTop: PAD, paddingBottom: PAD }}>
        {items.map((n) => {
          const sel = n === selected
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(n)}
              style={{ height: ITEM_H }}
              className={
                'flex w-full items-center justify-center tabular-nums transition-all duration-100 ' +
                (sel
                  ? 'text-primary font-semibold text-lg scale-105'
                  : 'text-on-surface-variant/45 text-sm hover:text-on-surface')
              }
            >
              {pad(n)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TimePicker({
  value,
  onChange,
  className = '',
  minuteStep = 1
}: TimePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { h, m } = parse(value)

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)

  // Klick außerhalb schließt das Dropdown.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const setH = (nh: number): void => onChange(`${pad(nh)}:${pad(m)}`)
  const setM = (nm: number): void => onChange(`${pad(h)}:${pad(nm)}`)

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        readOnly
        value={`${pad(h)}:${pad(m)}`}
        onClick={() => setOpen((o) => !o)}
        className={className + ' cursor-pointer'}
      />
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-outline-variant/40 bg-surface-container px-2 py-1.5 shadow-2xl ring-1 ring-black/20">
          <div className="relative flex items-stretch gap-1">
            {/* zentrales Auswahl-Band */}
            <div
              className="pointer-events-none absolute inset-x-0 z-0 rounded-lg bg-primary/12 ring-1 ring-inset ring-primary/30"
              style={{ top: PAD, height: ITEM_H }}
            />
            <Column items={hours} selected={h} onSelect={setH} />
            <div className="z-10 flex items-center px-0.5 text-lg font-semibold text-on-surface-variant/50">
              :
            </div>
            <Column items={minutes} selected={m} onSelect={setM} />
          </div>
        </div>
      )}
    </div>
  )
}

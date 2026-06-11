import { useRef, useEffect, useState } from 'react'

interface MenuPos { x: number; y: number }

const COLORS = [
  { label: 'Schwarz',      v: '#000000' },
  { label: 'Dunkelgrau',   v: '#424242' },
  { label: 'Dunkelrot',    v: '#b71c1c' },
  { label: 'Rot',          v: '#e53935' },
  { label: 'Blau',         v: '#1e88e5' },
  { label: 'Grün',         v: '#43a047' },
  { label: 'Orange',       v: '#fb8c00' },
  { label: 'Lila',         v: '#8e24aa' },
  { label: 'Grau',         v: '#78909c' },
  { label: 'Hellblau',     v: '#81d4fa' },
  { label: 'Hellgrün',     v: '#a5d6a7' },
  { label: 'Gelb',         v: '#fff176' },
  { label: 'Hellgrau',     v: '#e0e0e0' },
  { label: 'Weiß',         v: '#ffffff' },
]

const SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24]

const FONTS = [
  { label: 'Standard',        v: '' },
  { label: 'Arial',           v: 'Arial, sans-serif' },
  { label: 'Calibri',         v: 'Calibri, sans-serif' },
  { label: 'Segoe UI',        v: '"Segoe UI", sans-serif' },
  { label: 'Tahoma',          v: 'Tahoma, sans-serif' },
  { label: 'Verdana',         v: 'Verdana, sans-serif' },
  { label: 'Times New Roman', v: '"Times New Roman", serif' },
  { label: 'Georgia',         v: 'Georgia, serif' },
  { label: 'Courier New',     v: '"Courier New", monospace' },
  { label: 'Comic Sans MS',   v: '"Comic Sans MS", cursive' },
]

// Hintergrund-/Markierungsfarben (Highlight)
const BG_COLORS = [
  { label: 'Keine',     v: 'transparent' },
  { label: 'Gelb',      v: '#fff59d' },
  { label: 'Grün',      v: '#c5e1a5' },
  { label: 'Blau',      v: '#90caf9' },
  { label: 'Pink',      v: '#f48fb1' },
  { label: 'Orange',    v: '#ffcc80' },
  { label: 'Lila',      v: '#ce93d8' },
  { label: 'Grau',      v: '#cfd8dc' },
  { label: 'Rot',       v: '#ef9a9a' },
  { label: 'Türkis',    v: '#80deea' },
]

const editorCls =
  'w-full border border-outline-variant rounded-lg px-2.5 py-1.5 bg-surface-container ' +
  'focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface text-[13px] ' +
  'overflow-y-auto word-break-all'

export default function RichEditor({
  value,
  onChange,
  rows = 5,
  placeholder
}: {
  value: string
  onChange: (html: string) => void
  rows?: number
  placeholder?: string
}): JSX.Element {
  const editorRef  = useRef<HTMLDivElement>(null)
  const lastVal    = useRef(value)
  const savedRange = useRef<Range | null>(null)

  const [menu,      setMenu]      = useState<MenuPos | null>(null)
  const [showSizes, setShowSizes] = useState(false)
  const [showFonts, setShowFonts] = useState(false)
  const [showBg,    setShowBg]    = useState(false)
  const [emoji,     setEmoji]     = useState('')
  const [isEmpty,   setIsEmpty]   = useState(!value)

  // Initial load
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    el.innerHTML = value ?? ''
    lastVal.current = value
    setIsEmpty(!(el.textContent?.trim()))
    document.execCommand('styleWithCSS', false, 'true')
  }, [])

  // Sync when value changes externally (e.g. new record loaded)
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (value !== lastVal.current) {
      el.innerHTML = value ?? ''
      lastVal.current = value
      setIsEmpty(!(el.textContent?.trim()))
    }
  }, [value])

  // Close menu on outside click
  useEffect(() => {
    if (!menu) return
    function onDown(e: MouseEvent): void {
      const t = e.target as HTMLElement
      if (!t.closest('[data-richmenu]')) {
        setMenu(null); setShowSizes(false); setShowFonts(false); setShowBg(false); setEmoji('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menu])

  function notify(): void {
    const el = editorRef.current
    if (!el) return
    const html = el.innerHTML
    lastVal.current = html
    setIsEmpty(!(el.textContent?.trim()))
    onChange(html)
  }

  function saveRange(): void {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
  }

  function restoreRange(): void {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
  }

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault()
    saveRange()
    setMenu({ x: e.clientX, y: e.clientY })
    setShowSizes(false); setShowFonts(false); setShowBg(false)
    setEmoji('')
  }

  function execCmd(cmd: string, val?: string): void {
    restoreRange()
    document.execCommand(cmd, false, val)
    notify()
    setMenu(null); setShowSizes(false)
  }

  function wrapSpan(style: Partial<CSSStyleDeclaration>): void {
    restoreRange()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    const span = document.createElement('span')
    Object.assign(span.style, style)
    try {
      range.surroundContents(span)
    } catch {
      const frag = range.extractContents()
      span.appendChild(frag)
      range.insertNode(span)
    }
    notify()
    setMenu(null); setShowSizes(false)
  }

  function applyFontSize(size: number): void {
    restoreRange()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    const span = document.createElement('span')
    span.style.fontSize = `${size}px`
    const frag = range.extractContents()
    frag.querySelectorAll<HTMLElement>('[style]').forEach(el => {
      el.style.fontSize = ''
    })
    span.appendChild(frag)
    range.insertNode(span)
    notify()
    setMenu(null); setShowSizes(false)
  }

  function applyFontFamily(font: string): void {
    restoreRange()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    const span = document.createElement('span')
    span.style.fontFamily = font || 'inherit'
    const frag = range.extractContents()
    frag.querySelectorAll<HTMLElement>('[style]').forEach(el => {
      el.style.fontFamily = ''
    })
    span.appendChild(frag)
    range.insertNode(span)
    notify()
    setMenu(null); setShowFonts(false)
  }

  function applyBgColor(color: string): void {
    restoreRange()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    const span = document.createElement('span')
    span.style.backgroundColor = color === 'transparent' ? 'transparent' : color
    const frag = range.extractContents()
    frag.querySelectorAll<HTMLElement>('[style]').forEach(el => {
      el.style.backgroundColor = ''
    })
    span.appendChild(frag)
    range.insertNode(span)
    notify()
    setMenu(null); setShowBg(false)
  }

  function insertLink(): void {
    const url = prompt('URL eingeben:')
    if (!url) { setMenu(null); return }
    restoreRange()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { setMenu(null); return }
    const range = sel.getRangeAt(0)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.style.color = '#60a5fa'
    anchor.style.textDecoration = 'underline'
    if (!range.collapsed) {
      try {
        const content = range.extractContents()
        anchor.appendChild(content)
        range.insertNode(anchor)
      } catch {
        anchor.textContent = url
        range.insertNode(anchor)
      }
    } else {
      anchor.textContent = url
      range.insertNode(anchor)
      const nr = document.createRange()
      nr.setStartAfter(anchor); nr.collapse(true)
      sel.removeAllRanges(); sel.addRange(nr)
    }
    notify()
    setMenu(null)
  }

  function handleClick(e: React.MouseEvent): void {
    const a = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
    if (!a?.href) return
    e.preventDefault()
    window.open(a.href, '_blank')
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key !== ' ' && e.key !== 'Enter') return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (!range.collapsed) return
    const node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE) return
    if ((node.parentElement as HTMLElement)?.closest('a')) return
    const text = node.textContent ?? ''
    const urlMatch = text.slice(0, range.startOffset).match(/(https?:\/\/[^\s]+)$/)
    if (!urlMatch) return
    e.preventDefault()
    const url = urlMatch[1]
    const urlStart = range.startOffset - url.length
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.textContent = url
    anchor.style.color = '#60a5fa'
    anchor.style.textDecoration = 'underline'
    const tr = document.createRange()
    tr.setStart(node, urlStart); tr.setEnd(node, range.startOffset)
    tr.deleteContents(); tr.insertNode(anchor)
    const nr = document.createRange()
    nr.setStartAfter(anchor); nr.collapse(true)
    sel.removeAllRanges(); sel.addRange(nr)
    if (e.key === 'Enter') {
      document.execCommand('insertParagraph', false)
    } else {
      document.execCommand('insertText', false, ' ')
    }
    notify()
  }

  function insertEmoji(): void {
    if (!emoji.trim()) return
    restoreRange()
    document.execCommand('insertText', false, emoji.trim())
    notify()
    setMenu(null); setEmoji('')
  }

  const minH = `${rows * 1.6 + 0.4}em`

  const menuTop  = Math.max(8, Math.min((menu?.y ?? 0), window.innerHeight - 540))
  const menuLeft = Math.min((menu?.x ?? 0), window.innerWidth  - 230)

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={notify}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={editorCls}
        style={{ minHeight: minH, wordBreak: 'break-word' }}
      />

      {isEmpty && placeholder && (
        <span className="absolute top-1.5 left-2.5 text-[13px] text-on-surface-variant/40 pointer-events-none select-none">
          {placeholder}
        </span>
      )}

      {menu && (
        <div
          data-richmenu
          className="fixed z-[300] bg-surface-container-high border border-outline-variant/60 rounded-xl shadow-2xl py-1 w-56 select-none"
          style={{ top: menuTop, left: menuLeft }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <MBtn onClick={() => execCmd('bold')} hint="Strg+B">
            <strong>B</strong> Fett
          </MBtn>
          <MBtn onClick={() => execCmd('underline')} hint="Strg+U">
            <span style={{ textDecoration: 'underline' }}>U</span> Unterstrichen
          </MBtn>
          <MBtn onClick={() => wrapSpan({ textDecoration: 'underline double' })}>
            <span style={{ textDecoration: 'underline double' }}>U=</span> Doppelt unterstr.
          </MBtn>
          <MBtn onClick={() => execCmd('strikeThrough')}>
            <span style={{ textDecoration: 'line-through' }}>S</span> Durchgestrichen
          </MBtn>

          <hr className="border-outline-variant/40 my-1" />
          <div className="px-3 py-0.5 text-[10px] text-on-surface-variant/60 font-semibold uppercase tracking-wide">
            Farbe
          </div>
          <div className="flex flex-wrap gap-1 px-3 pb-1.5">
            {COLORS.map((c) => (
              <button
                key={c.v}
                title={c.label}
                onClick={() => execCmd('foreColor', c.v)}
                className="w-5 h-5 rounded border border-outline-variant/50 hover:scale-110 transition-transform"
                style={{ background: c.v }}
              />
            ))}
            <label title="Eigene Farbe" className="w-5 h-5 rounded border border-outline-variant/50 overflow-hidden cursor-pointer hover:scale-110 transition-transform">
              <input
                type="color"
                className="opacity-0 w-8 h-8 -ml-1.5 -mt-1.5 cursor-pointer"
                onChange={(e) => { saveRange(); execCmd('foreColor', e.target.value) }}
              />
            </label>
          </div>

          <hr className="border-outline-variant/40 my-1" />
          <MBtn onClick={() => { setShowBg(b => !b); setShowFonts(false); setShowSizes(false) }}>
            <span className="font-mono" style={{ background: '#fff59d', color: '#000', padding: '0 2px', borderRadius: 2 }}>ab</span> Hintergrundfarbe {showBg ? '▲' : '▼'}
          </MBtn>
          {showBg && (
          <div className="flex flex-wrap gap-1 px-3 pb-1.5">
            {BG_COLORS.map((c) => (
              <button
                key={c.v}
                title={c.label}
                onClick={() => applyBgColor(c.v)}
                className={
                  'w-5 h-5 rounded border border-outline-variant/50 hover:scale-110 transition-transform ' +
                  (c.v === 'transparent' ? 'relative overflow-hidden' : '')
                }
                style={{ background: c.v === 'transparent' ? 'var(--fp-surface-container, #fff)' : c.v }}
              >
                {c.v === 'transparent' && (
                  <span className="absolute inset-0 block" style={{ background: 'linear-gradient(to top left, transparent 45%, #e53935 47%, #e53935 53%, transparent 55%)' }} />
                )}
              </button>
            ))}
            <label title="Eigene Hintergrundfarbe" className="w-5 h-5 rounded border border-outline-variant/50 overflow-hidden cursor-pointer hover:scale-110 transition-transform">
              <input
                type="color"
                className="opacity-0 w-8 h-8 -ml-1.5 -mt-1.5 cursor-pointer"
                onChange={(e) => { saveRange(); applyBgColor(e.target.value) }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </label>
          </div>
          )}

          <hr className="border-outline-variant/40 my-1" />
          <MBtn onClick={() => { setShowFonts(f => !f); setShowSizes(false); setShowBg(false) }}>
            <span className="font-mono">Aa</span> Schriftart {showFonts ? '▲' : '▼'}
          </MBtn>
          {showFonts && (
            <div className="flex flex-col px-1.5 pb-1.5 max-h-44 overflow-y-auto">
              {FONTS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => applyFontFamily(f.v)}
                  className="text-left px-1.5 py-1 text-[12px] rounded text-on-surface hover:bg-surface-container-high"
                  style={{ fontFamily: f.v || 'inherit' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <hr className="border-outline-variant/40 my-1" />
          <MBtn onClick={() => { setShowSizes(s => !s); setShowFonts(false); setShowBg(false) }}>
            <span className="font-mono">A↑</span> Schriftgröße {showSizes ? '▲' : '▼'}
          </MBtn>
          {showSizes && (
            <div className="flex flex-wrap gap-1 px-3 pb-1.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => applyFontSize(s)}
                  className="px-1.5 py-0.5 text-[10px] rounded border border-outline-variant text-on-surface hover:bg-surface-container-high"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <hr className="border-outline-variant/40 my-1" />
          <MBtn onClick={insertLink}>🔗 Link einfügen</MBtn>

          <hr className="border-outline-variant/40 my-1" />
          <div className="px-3 py-0.5 text-[10px] text-on-surface-variant/60 font-semibold uppercase tracking-wide">
            Emoji
          </div>
          <div className="flex gap-1 px-3 pb-2">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertEmoji() } }}
              className="flex-1 text-sm border border-outline-variant rounded px-1.5 py-0.5 bg-surface-container text-on-surface"
              placeholder="😀"
              onMouseDown={(e) => e.stopPropagation()}
            />
            <button
              onClick={insertEmoji}
              className="px-2 py-0.5 text-xs rounded bg-primary text-on-primary"
            >
              ↵
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MBtn({
  children,
  onClick,
  hint
}: {
  children: React.ReactNode
  onClick: () => void
  hint?: string
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 w-full px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high transition-colors text-left"
    >
      <span className="flex-1">{children}</span>
      {hint && <span className="text-[10px] text-on-surface-variant/50">{hint}</span>}
    </button>
  )
}

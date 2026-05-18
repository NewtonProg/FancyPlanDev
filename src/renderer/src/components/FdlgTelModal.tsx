import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Tel = Record<string, unknown>

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function initials(first: unknown, last: unknown): string {
  const f = String(first ?? '').trim()[0] ?? ''
  const l = String(last ?? '').trim()[0] ?? ''
  return (f + l).toUpperCase() || '?'
}

function fullName(c: Tel): string {
  return [c.FirstName, c.SurName].filter(Boolean).map(String).join(' ') || String(c.Company ?? '—')
}

export default function FdlgTelModal({
  excludeIds,
  onSelect,
  onClose
}: {
  excludeIds?: Set<number>
  onSelect: (contact: Tel) => void
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Tel[]>([])
  const [search, setSearch] = useState('')
  const [alphaFilter, setAlphaFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback((q: string) => {
    setLoading(true)
    window.db.tel.getAll(q).then((rows) => {
      setContacts(rows as Tel[])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(search), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, load])

  const visible = contacts.filter((c) => {
    if (excludeIds?.has(Number(c.id))) return false
    if (alphaFilter) {
      const first = String(c.SurName ?? c.FirstName ?? c.Company ?? '').trim()[0]?.toUpperCase()
      return first === alphaFilter
    }
    return true
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={onClose}>
      <div
        className="bg-surface-container-high rounded-2xl shadow-2xl w-80 flex flex-col overflow-hidden border border-outline-variant/40 max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-outline-variant/40 flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-semibold text-on-surface">{t('contacts.selectContact')}</h3>
          <button onClick={onClose} className="text-on-surface-variant/60 hover:text-on-surface text-lg leading-none">✕</button>
        </div>

        {/* Search + count */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm select-none">⌕</span>
            <input
              className="w-full pl-7 pr-6 py-1.5 text-sm border border-outline-variant rounded-lg bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/40"
              placeholder={t('contacts.searchPh')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setAlphaFilter('') }}
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-xs hover:text-on-surface-variant transition-colors">✕</button>
            )}
          </div>
          <p className="text-xs text-on-surface-variant/50 mt-1.5 px-0.5">
            {t('contacts.count', { count: visible.length })}
          </p>
        </div>

        {/* Alphabet filter */}
        <div className="px-2 pb-1.5 flex flex-wrap gap-0.5 flex-shrink-0">
          {ALPHA.map((l) => (
            <button key={l}
              onClick={() => { setAlphaFilter(alphaFilter === l ? '' : l); setSearch('') }}
              className={`w-5 h-5 text-[10px] rounded flex items-center justify-center transition-colors ${
                alphaFilter === l
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant/60 hover:bg-surface-container-highest'
              }`}>
              {l}
            </button>
          ))}
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto border-t border-outline-variant/20">
          {loading ? (
            <p className="p-4 text-xs text-on-surface-variant/60 text-center">{t('common.searching')}</p>
          ) : visible.length === 0 ? (
            <p className="p-4 text-xs text-on-surface-variant/40 italic text-center">{t('contacts.noContacts')}</p>
          ) : visible.map((c) => (
            <button key={c.id as number}
              onClick={() => onSelect(c)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-outline-variant/20 last:border-0 transition-colors hover:bg-surface-container">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold bg-primary/20 text-primary">
                {initials(c.FirstName, c.SurName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{fullName(c)}</p>
                {(c.FirstName || c.SurName) && c.Company && (
                  <p className="text-xs text-on-surface-variant/60 truncate">{String(c.Company)}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

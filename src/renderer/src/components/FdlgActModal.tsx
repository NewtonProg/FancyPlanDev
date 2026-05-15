import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Row = Record<string, unknown>

export default function FdlgActModal({
  currentId,
  currentTitle,
  onConfirm,
  onClose
}: {
  currentId: number
  currentTitle: string
  onConfirm: (id: number, title: string) => void
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [acts, setActs] = useState<Row[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedTitle, setSelectedTitle] = useState('')

  useEffect(() => {
    window.db.act.getAll().then((rows) => {
      setActs((rows as Row[]).filter((r) => Number(r.id) !== currentId))
    })
  }, [currentId])

  const filtered = acts.filter((r) =>
    !search.trim() || String(r.Title ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function confirm(): void {
    if (selectedId === null) return
    onConfirm(selectedId, selectedTitle)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface-container-high rounded-2xl shadow-2xl w-[480px] flex flex-col overflow-hidden border border-outline-variant/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="font-semibold text-on-surface">{t('fdlgact.title')}</h3>
          <button onClick={onClose} className="text-on-surface-variant/60 hover:text-on-surface text-lg leading-none">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="text-center py-3 px-4 bg-surface-container-low rounded-xl border border-outline-variant/40">
            <p className="text-sm font-medium text-on-surface-variant mb-1">{t('fdlgact.selectActivity')}</p>
          </div>

          <div className="flex items-start gap-3">
            <label className="w-28 flex-shrink-0 text-sm text-on-surface-variant pt-1.5">{t('fdlgact.activity')}</label>
            <div className="flex-1 text-sm border border-outline-variant rounded-lg px-2.5 py-1.5 bg-surface-container-low text-on-surface-variant truncate">
              {currentTitle || '—'}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <label className="w-28 flex-shrink-0 text-sm text-on-surface-variant pt-1.5">{t('fdlgact.targetActivity')}</label>
            <div className="flex-1 flex flex-col gap-1.5">
              <input
                className="w-full text-sm border border-outline-variant rounded-lg px-2.5 py-1.5 bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40"
                placeholder={t('fdlgact.searchPh')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <div className="border border-outline-variant rounded-lg overflow-y-auto max-h-48 bg-surface-container">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-on-surface-variant/60 text-center italic">{t('fdlgact.noResults')}</p>
                ) : (
                  filtered.map((r) => {
                    const id = Number(r.id)
                    const title = String(r.Title ?? '')
                    const active = selectedId === id
                    return (
                      <button
                        key={id}
                        onClick={() => { setSelectedId(id); setSelectedTitle(title) }}
                        className={`w-full text-left px-3 py-1.5 text-sm border-b border-outline-variant/20 last:border-0 transition-colors ${
                          active ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {title}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-outline-variant/40 flex justify-between">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-container-high"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={confirm}
            disabled={selectedId === null}
            className="px-5 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('common.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}

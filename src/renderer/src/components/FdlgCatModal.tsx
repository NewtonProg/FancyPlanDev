import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type Row = Record<string, unknown>

export default function FdlgCatModal({
  cats,
  current,
  onConfirm,
  onClose
}: {
  cats: Row[]
  current: string
  onConfirm: (val: string) => void
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(current.split(';').map((s) => s.trim()).filter(Boolean))
  )

  function toggle(cat: string): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function confirm(): void {
    onConfirm(Array.from(selected).join(';'))
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface-container-high rounded-2xl shadow-2xl w-[520px] max-h-[600px] flex flex-col overflow-hidden border border-outline-variant/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="font-semibold text-on-surface">{t('fdlgcat.title')}</h3>
          <button onClick={onClose} className="text-on-surface-variant/60 hover:text-on-surface text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cats.length === 0 ? (
            <p className="text-sm text-on-surface-variant/60 italic">{t('fdlgcat.noCats')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cats.map((cat) => {
                const name   = String(cat.Cat ?? '')
                const active = selected.has(name)
                return (
                  <button
                    key={String(cat.id)}
                    onClick={() => toggle(name)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container text-on-surface border-outline-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-outline-variant/40 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant/60">
            {selected.size > 0 ? Array.from(selected).join(' ; ') : t('fdlgcat.none')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-container-high"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirm}
              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-blue-600"
            >
              {t('common.ok')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

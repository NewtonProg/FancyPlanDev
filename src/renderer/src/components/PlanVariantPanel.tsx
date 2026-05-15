import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Variant = Record<string, unknown>

export default function PlanVariantPanel({
  currentActIds,
  onLoaded,
  onClose
}: {
  currentActIds: number[]
  onLoaded: () => void
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [variants, setVariants] = useState<Variant[]>([])
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{ id: number; items: Variant[] } | null>(null)

  useEffect(() => {
    window.db.planvariant.getAll().then(setVariants)
  }, [])

  const handleSave = async (): Promise<void> => {
    if (!saveName.trim() || currentActIds.length === 0) return
    setSaving(true)
    await window.db.planvariant.save(saveName.trim(), currentActIds)
    const updated = await window.db.planvariant.getAll()
    setVariants(updated)
    setSaveName('')
    setSaving(false)
  }

  const handleLoad = async (variantId: number): Promise<void> => {
    setLoading(true)
    await window.db.planvariant.load(variantId)
    setLoading(false)
    onLoaded()
    onClose()
  }

  const handleDelete = async (variantId: number): Promise<void> => {
    await window.db.planvariant.delete(variantId)
    setVariants((prev) => prev.filter((v) => v.id !== variantId))
    if (preview?.id === variantId) setPreview(null)
  }

  const handlePreview = async (v: Variant): Promise<void> => {
    if (preview?.id === v.id) { setPreview(null); return }
    const items = await window.db.planvariant.getItems(v.id as number)
    setPreview({ id: v.id as number, items })
  }

  return (
    <div className="absolute top-full right-0 mt-1 w-80 bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant/40 z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-outline-variant/40">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
          {t('planvariant.saveTitle', { count: currentActIds.length })}
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-outline-variant rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder={t('planvariant.namePh')}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={!saveName.trim() || currentActIds.length === 0 || saving}
            className="px-3 py-1.5 text-xs bg-primary text-on-primary rounded-lg hover:bg-blue-600 disabled:opacity-40"
          >
            {saving ? t('planvariant.saving') : t('planvariant.save')}
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {variants.length === 0 ? (
          <p className="px-4 py-6 text-xs text-on-surface-variant/60 text-center">{t('planvariant.noVariants')}</p>
        ) : (
          variants.map((v) => (
            <div key={v.id as number}>
              <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container-high group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{String(v.name)}</p>
                  <p className="text-xs text-on-surface-variant/60">{String(v.created_at ?? '').slice(0, 10)}</p>
                </div>
                <button
                  onClick={() => handlePreview(v)}
                  className="text-xs text-on-surface-variant/60 hover:text-on-surface px-1"
                >
                  {preview?.id === v.id ? '▲' : '▼'}
                </button>
                <button
                  onClick={() => handleLoad(v.id as number)}
                  disabled={loading}
                  className="text-xs bg-primary/5 text-primary hover:bg-primary/10 px-2.5 py-1 rounded-lg"
                >
                  {t('planvariant.load')}
                </button>
                <button
                  onClick={() => handleDelete(v.id as number)}
                  className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
              {preview?.id === v.id && (
                <div className="px-4 pb-2 bg-surface-container-low border-b border-outline-variant/40">
                  <p className="text-xs font-medium text-on-surface-variant mb-1">{t('planvariant.activities', { count: preview.items.length })}</p>
                  <ul className="flex flex-col gap-0.5">
                    {preview.items.map((item) => (
                      <li key={item.IDTAct as number} className="text-xs text-on-surface-variant truncate">
                        · {String(item.Title ?? '—')}
                        <span className="text-on-surface-variant/60 ml-1">({String(item.AreaName ?? '')})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-outline-variant/40">
        <button onClick={onClose} className="text-xs text-on-surface-variant/60 hover:text-on-surface">{t('planvariant.close')}</button>
      </div>
    </div>
  )
}

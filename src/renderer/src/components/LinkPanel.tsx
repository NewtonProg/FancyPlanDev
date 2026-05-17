import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Link = { id: number; entity_type: string; entity_id: number; link_type: string; url: string; label: string | null; seq: number }

const LINK_TYPES = [
  { value: 'web',       label: 'Web' },
  { value: 'mail',      label: 'E-Mail' },
  { value: 'file',      label: 'Datei' },
  { value: 'network',   label: 'Netzwerk' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'twitter',   label: 'X/Twitter' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'youtube',   label: 'YouTube' },
]

const TYPE_ICONS: Record<string, string> = {
  web: '🌐', mail: '✉️', file: '📄', network: '🗂️',
  instagram: '📸', tiktok: '🎵', linkedin: '💼',
  twitter: '𝕏', facebook: '👥', youtube: '▶️',
}

function chipColor(type: string): string {
  const map: Record<string, string> = {
    web: 'bg-blue-50 text-blue-700 border-blue-200',
    mail: 'bg-green-50 text-green-700 border-green-200',
    file: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    network: 'bg-orange-50 text-orange-700 border-orange-200',
    instagram: 'bg-pink-50 text-pink-700 border-pink-200',
    tiktok: 'bg-purple-50 text-purple-700 border-purple-200',
    linkedin: 'bg-sky-50 text-sky-700 border-sky-200',
    twitter: 'bg-slate-50 text-slate-700 border-slate-200',
    facebook: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    youtube: 'bg-red-50 text-red-700 border-red-200',
  }
  return map[type] ?? 'bg-surface-container-low text-on-surface border-outline-variant'
}

const linkinp = 'text-xs border border-outline-variant rounded px-2 py-1 text-gray-800 placeholder-gray-500'

export default function LinkPanel({ entityType, entityId }: { entityType: 'tel' | 'tree'; entityId: number }): JSX.Element {
  const { t } = useTranslation()
  const [links, setLinks] = useState<Link[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ link_type: 'web', url: '', label: '' })
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ link_type: 'web', url: '', label: '' })

  const load = async (): Promise<void> => {
    const rows = await window.db.links.getByEntity(entityType, entityId) as Link[]
    setLinks(rows)
  }

  useEffect(() => { load() }, [entityType, entityId])

  const handleOpen = (link: Link): void => {
    window.db.links.open(link.url, link.link_type)
  }

  const handleAdd = async (): Promise<void> => {
    if (!form.url.trim()) return
    await window.db.links.create({
      entity_type: entityType, entity_id: entityId,
      link_type: form.link_type, url: form.url.trim(),
      label: form.label.trim() || null
    })
    setForm({ link_type: 'web', url: '', label: '' })
    setAdding(false)
    load()
  }

  const handleDelete = async (id: number): Promise<void> => {
    await window.db.links.delete(id)
    load()
  }

  const startEdit = (link: Link): void => {
    setEditId(link.id)
    setEditForm({ link_type: link.link_type, url: link.url, label: link.label ?? '' })
  }

  const handleEditSave = async (): Promise<void> => {
    if (editId === null) return
    await window.db.links.update(editId, {
      link_type: editForm.link_type,
      url: editForm.url.trim(),
      label: editForm.label.trim() || null
    })
    setEditId(null)
    load()
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{t('links.title')}</span>
        <button onClick={() => setAdding((v) => !v)}
          className="text-primary hover:text-primary/70 text-sm leading-none" title={t('links.addTitle')}>+</button>
      </div>

      {adding && (
        <div className="bg-surface-container-low rounded-lg p-2 mb-2 flex flex-col gap-1.5">
          <select value={form.link_type} onChange={(e) => setForm({ ...form, link_type: e.target.value })}
            className="text-xs border border-outline-variant rounded px-2 py-1 bg-surface-container">
            {LINK_TYPES.map((tp) => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
          </select>
          <input placeholder={t('links.urlPh')} value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className={linkinp} />
          <input placeholder={t('links.labelPh')} value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            className={linkinp} />
          <div className="flex gap-1.5">
            <button onClick={handleAdd}
              className="flex-1 text-xs bg-primary text-on-primary rounded px-2 py-1 hover:bg-blue-600">{t('links.add')}</button>
            <button onClick={() => setAdding(false)}
              className="text-xs text-on-surface-variant/60 hover:text-on-surface px-2 py-1">{t('links.cancel')}</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {links.length === 0 && !adding && (
          <p className="text-xs text-on-surface-variant/40 italic">{t('links.noLinks')}</p>
        )}
        {links.map((link) =>
          editId === link.id ? (
            <div key={link.id} className="w-full bg-surface-container-low rounded-lg p-2 flex flex-col gap-1.5">
              <select value={editForm.link_type} onChange={(e) => setEditForm({ ...editForm, link_type: e.target.value })}
                className="text-xs border border-outline-variant rounded px-2 py-1 bg-surface-container">
                {LINK_TYPES.map((tp) => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
              </select>
              <input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                className={linkinp} />
              <input value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                placeholder={t('links.labelPh')}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave() }}
                className={linkinp} />
              <div className="flex gap-1.5">
                <button onClick={handleEditSave}
                  className="flex-1 text-xs bg-primary text-on-primary rounded px-2 py-1 hover:bg-blue-600">{t('links.save')}</button>
                <button onClick={() => setEditId(null)}
                  className="text-xs text-on-surface-variant/60 hover:text-on-surface px-2 py-1">{t('links.cancel')}</button>
              </div>
            </div>
          ) : (
            <div key={link.id}
              className={`group flex items-center gap-1 text-xs border rounded-full px-2.5 py-1 ${chipColor(link.link_type)}`}>
              <span>{TYPE_ICONS[link.link_type] ?? '🔗'}</span>
              <button onClick={() => handleOpen(link)} className="hover:underline max-w-[160px] truncate" title={link.url}>
                {link.label || link.url}
              </button>
              <span className="hidden group-hover:flex items-center gap-0.5 ml-1">
                <button onClick={() => startEdit(link)} className="opacity-50 hover:opacity-100" title={t('links.edit')}>✏️</button>
                <button onClick={() => handleDelete(link.id)} className="opacity-50 hover:opacity-100 text-error" title={t('links.delete')}>✕</button>
              </span>
            </div>
          )
        )}
      </div>
    </div>
  )
}

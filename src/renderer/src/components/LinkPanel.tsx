import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Link = { id: number; entity_type: string; entity_id: number; link_type: string; url: string; label: string | null; password: string | null; seq: number }

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

const linkinp = 'text-xs border border-outline-variant rounded px-2 py-1 bg-surface-container-high text-on-surface placeholder-on-surface-variant/40'

function PasswordBadge({ password, t }: { password: string; t: (k: string) => string }): JSX.Element {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <span className="inline-flex items-center gap-1 ml-1.5">
      <button
        onClick={() => setVisible((v) => !v)}
        title={visible ? t('links.hidePassword') : t('links.showPassword')}
        className="opacity-60 hover:opacity-100 text-xs leading-none select-none"
      >
        🔑
      </button>
      {visible && (
        <span className="inline-flex items-center gap-1 bg-black/80 text-white rounded px-2.5 py-1 text-base font-mono break-all">
          {password}
          <button
            onClick={handleCopy}
            title={t('links.copyPassword')}
            className="ml-1 opacity-70 hover:opacity-100 text-sm leading-none"
          >
            {copied ? '✓' : '⎘'}
          </button>
        </span>
      )}
    </span>
  )
}

export default function LinkPanel({ entityType, entityId }: { entityType: 'tel' | 'tree' | 'act' | 'mydata'; entityId: number }): JSX.Element {
  const { t } = useTranslation()
  const [links, setLinks] = useState<Link[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ link_type: 'web', url: '', label: '', password: '' })
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ link_type: 'web', url: '', label: '', password: '' })

  const load = async (): Promise<void> => {
    const rows = await window.db.links.getByEntity(entityType, entityId) as Link[]
    setLinks(rows)
  }

  useEffect(() => { load() }, [entityType, entityId])

  const handleOpen = (link: Link): void => {
    window.db.links.open(link.url, link.link_type)
  }

  const isPathType = (type: string): boolean => type === 'file' || type === 'network'

  const pickPath = async (
    setter: (path: string) => void,
    opts?: { defaultPath?: string; mode?: 'file' | 'directory' | 'both' }
  ): Promise<void> => {
    const result = await window.db.links.pickPath({
      defaultPath: opts?.defaultPath?.trim() || undefined,
      mode: opts?.mode
    })
    if (result.path) setter(result.path)
  }

  function normalizeUrl(url: string, linkType: string): string {
    const u = url.trim()
    if (!u || /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(u)) return u
    if (linkType === 'mail') return `mailto:${u}`
    return `https://${u}`
  }

  const handleAdd = async (): Promise<void> => {
    if (!form.url.trim()) return
    await window.db.links.create({
      entity_type: entityType, entity_id: entityId,
      link_type: form.link_type, url: normalizeUrl(form.url, form.link_type),
      label: form.label.trim() || null,
      password: form.password.trim() || null
    })
    setForm({ link_type: 'web', url: '', label: '', password: '' })
    setAdding(false)
    load()
  }

  const handleDelete = async (id: number): Promise<void> => {
    await window.db.links.delete(id)
    load()
  }

  const startEdit = (link: Link): void => {
    setEditId(link.id)
    setEditForm({ link_type: link.link_type, url: link.url, label: link.label ?? '', password: link.password ?? '' })
  }

  const handleEditSave = async (): Promise<void> => {
    if (editId === null) return
    await window.db.links.update(editId, {
      link_type: editForm.link_type,
      url: normalizeUrl(editForm.url, editForm.link_type),
      label: editForm.label.trim() || null,
      password: editForm.password.trim() || null
    })
    setEditId(null)
    load()
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">{t('links.title')}</span>
        <button onClick={() => setAdding((v) => !v)}
          className="text-primary hover:text-primary/70 text-xl leading-none" title={t('links.addTitle')}>+</button>
      </div>

      {adding && (
        <div className="bg-surface-container-low rounded-lg p-2 mb-2 flex flex-col gap-1.5">
          <select value={form.link_type} onChange={(e) => setForm({ ...form, link_type: e.target.value })}
            className="text-xs border border-outline-variant rounded px-2 py-1 bg-surface-container">
            {LINK_TYPES.map((tp) => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
          </select>
          <div className="flex gap-1">
            <input placeholder={t('links.urlPh')} value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              onDoubleClick={isPathType(form.link_type) && form.url.trim()
                ? () => window.db.links.open(form.url.trim(), form.link_type)
                : undefined}
              title={isPathType(form.link_type) ? t('links.openFolderHint') : undefined}
              className={`${linkinp} flex-1 min-w-0`} />
            {isPathType(form.link_type) && (
              <button onClick={() => pickPath((p) => setForm((f) => ({ ...f, url: p })))}
                title="Datei oder Ordner auswählen"
                className="px-2 py-1 text-sm border border-outline-variant rounded hover:bg-surface-container-high">📁</button>
            )}
          </div>
          <input placeholder={t('links.labelPh')} value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className={linkinp} />
          <input placeholder={t('links.passwordPh')} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              <div className="flex gap-1">
                <input value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  onDoubleClick={isPathType(editForm.link_type) && editForm.url.trim()
                    ? () => window.db.links.open(editForm.url.trim(), editForm.link_type)
                    : undefined}
                  title={isPathType(editForm.link_type) ? t('links.openFolderHint') : undefined}
                  className={`${linkinp} flex-1 min-w-0`} />
                {isPathType(editForm.link_type) && (
                  <button onClick={() => pickPath((p) => setEditForm((f) => ({ ...f, url: p })))}
                    title="Datei oder Ordner auswählen"
                    className="px-2 py-1 text-sm border border-outline-variant rounded hover:bg-surface-container-high">📁</button>
                )}
              </div>
              <input value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                placeholder={t('links.labelPh')}
                className={linkinp} />
              <input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder={t('links.passwordPh')}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave() }}
                className={linkinp} />
              <div className="flex gap-1.5">
                <button onClick={handleEditSave}
                  className="flex-1 text-xs bg-primary text-on-primary rounded px-2 py-1 hover:bg-blue-600">{t('links.save')}</button>
                <button onClick={() => setEditId(null)}
                  className="text-xs text-on-surface-variant/60 hover:text-on-surface px-2 py-1">{t('links.cancel')}</button>
                <button onClick={() => { handleDelete(link.id); setEditId(null) }}
                  className="text-xs text-error hover:bg-error/10 rounded px-2 py-1">{t('links.delete')}</button>
              </div>
            </div>
          ) : (
            <div key={link.id}
              className={`group flex items-center gap-1 text-base border rounded-full px-2 py-px ${chipColor(link.link_type)}`}>
              <span style={{ fontSize: '0.43rem' }}>{TYPE_ICONS[link.link_type] ?? '🔗'}</span>
              <button onClick={() => handleOpen(link)} className="hover:underline max-w-[240px] truncate" style={{ fontSize: '0.96rem' }} title={link.url}>
                {link.label || link.url}
              </button>
              {link.password && <PasswordBadge password={link.password} t={t} />}
              <span className="hidden group-hover:flex items-center gap-1 ml-2">
                <button onClick={() => startEdit(link)} className="opacity-50 hover:opacity-100 text-lg" title={t('links.edit')}>✏️</button>
                <button onClick={() => handleDelete(link.id)} className="opacity-50 hover:opacity-100 text-lg text-error" title={t('links.delete')}>✕</button>
              </span>
            </div>
          )
        )}
      </div>
    </div>
  )
}

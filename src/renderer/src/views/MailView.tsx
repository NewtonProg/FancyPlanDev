import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Mail = Record<string, unknown>

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })
  }
  const diff = now.getTime() - d.getTime()
  if (diff < 7 * 24 * 3600 * 1000) {
    return d.toLocaleDateString('de', { weekday: 'short', day: '2-digit', month: '2-digit' })
  }
  return d.toLocaleDateString('de', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtDateFull(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('de', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function MailItem({ mail, active, onClick }: { mail: Mail; active: boolean; onClick: () => void }): JSX.Element {
  const { t } = useTranslation()
  const unread = !mail.is_read
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-2.5 border-b border-outline-variant/20 hover:bg-surface-container-high transition-colors ${active ? 'bg-primary/5' : ''}`}>
      <div className="flex items-start gap-1.5 mb-0.5">
        {unread && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
        <span className={`flex-1 text-sm truncate ${unread ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
          {String(mail.from_name || mail.from_addr || '—')}
        </span>
        {mail.has_attachment ? <span className="text-on-surface-variant/50 text-xs flex-shrink-0 mt-0.5">📎</span> : null}
        <span className="text-xs text-on-surface-variant/40 flex-shrink-0 mt-0.5">{fmtDate(mail.date_received as string)}</span>
      </div>
      <p className={`text-xs truncate mb-0.5 ml-3 ${unread ? 'font-medium text-on-surface' : 'text-on-surface-variant'}`}>
        {String(mail.subject ?? t('mail.noSubject'))}
      </p>
      <p className="text-xs text-on-surface-variant/60 truncate ml-3">{String(mail.snippet ?? '')}</p>
    </button>
  )
}

function ComposePanel({ fromEmail, onClose }: { fromEmail: string; onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSend = async (): Promise<void> => {
    setSending(true)
    const result = await window.db.mail.send({ to, subject, body, cc: cc || undefined })
    setSending(false)
    if (result.ok) {
      setMsg(t('mail.sent'))
      setTimeout(onClose, 1500)
    } else {
      setMsg(t('common.error', { msg: result.error }))
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant/40">
        <span className="text-sm font-semibold text-on-surface">{t('mail.compose')}</span>
        <button onClick={onClose} className="text-on-surface-variant/60 hover:text-on-surface text-base leading-none">✕</button>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="border-b border-outline-variant/40">
          <div className="flex items-center px-6 py-2 gap-3">
            <span className="text-xs text-on-surface-variant/60 w-14 flex-shrink-0">{t('mail.from')}</span>
            <span className="text-sm text-on-surface-variant">{fromEmail}</span>
          </div>
          <div className="flex items-center px-6 py-2 gap-3 border-t border-outline-variant/20">
            <span className="text-xs text-on-surface-variant/60 w-14 flex-shrink-0">{t('mail.to')}</span>
            <input className="flex-1 text-sm focus:outline-none" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t('mail.toPh')} autoFocus />
            <button onClick={() => setShowCc(!showCc)} className="text-xs text-on-surface-variant/60 hover:text-on-surface">{t('mail.cc')}</button>
          </div>
          {showCc && (
            <div className="flex items-center px-6 py-2 gap-3 border-t border-outline-variant/20">
              <span className="text-xs text-on-surface-variant/60 w-14 flex-shrink-0">{t('mail.cc')}</span>
              <input className="flex-1 text-sm focus:outline-none" value={cc} onChange={(e) => setCc(e.target.value)} placeholder={t('mail.ccPh')} />
            </div>
          )}
          <div className="flex items-center px-6 py-2 gap-3 border-t border-outline-variant/20">
            <span className="text-xs text-on-surface-variant/60 w-14 flex-shrink-0">{t('mail.subject')}</span>
            <input className="flex-1 text-sm focus:outline-none" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('mail.subjectPh')} />
          </div>
        </div>
        <textarea
          className="flex-1 px-6 py-4 text-sm focus:outline-none resize-none min-h-[200px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('mail.bodyPh')}
        />
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant/40">
        <span className={`text-xs ${msg.startsWith('Fehler') ? 'text-error' : 'text-secondary-fixed-dim'}`}>{msg}</span>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high">{t('mail.cancel')}</button>
          <button onClick={handleSend} disabled={sending || !to.trim() || !subject.trim()}
            className="px-4 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
            {sending ? t('mail.sending') : t('mail.send')}
          </button>
        </div>
      </div>
    </div>
  )
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MailDetail({ mail, detail }: { mail: Mail; detail: Mail | null }): JSX.Element {
  const { t } = useTranslation()
  const [attachments, setAttachments] = useState<Mail[]>([])
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    if (detail && Number(detail.has_attachment)) {
      window.db.mail.getAttachments(mail.id as number).then(setAttachments)
    } else {
      setAttachments([])
    }
  }, [detail, mail.id])

  const handleDownload = async (attId: number): Promise<void> => {
    setDownloading(attId)
    await window.db.mail.downloadAttachment(attId)
    setDownloading(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-outline-variant/40 flex-shrink-0">
        <h2 className="text-base font-semibold text-on-surface mb-2">
          {String(mail.subject ?? t('mail.noSubject'))}
        </h2>
        <div className="flex flex-col gap-0.5 text-xs">
          <p className="text-on-surface-variant">
            <span className="text-on-surface-variant/60">{t('mail.fromLabel')} </span>
            {mail.from_name ? `${mail.from_name} <${mail.from_addr}>` : String(mail.from_addr ?? '')}
          </p>
          <p className="text-on-surface-variant">
            <span className="text-on-surface-variant/60">{t('mail.toLabel')} </span>
            {String(mail.to_addr ?? '')}
          </p>
          <p className="text-on-surface-variant/60">{fmtDateFull(mail.date_received as string)}</p>
        </div>
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <button
                key={att.id as number}
                onClick={() => handleDownload(att.id as number)}
                disabled={downloading === (att.id as number)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-outline-variant text-xs text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 transition-colors"
              >
                <span>📎</span>
                <span className="max-w-[160px] truncate">{String(att.filename ?? 'Anhang')}</span>
                <span className="text-on-surface-variant/50">{fmtSize(Number(att.size ?? 0))}</span>
                {downloading === (att.id as number) && <span>…</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {!detail ? (
          <div className="flex items-center justify-center h-full text-on-surface-variant/40 text-sm">{t('mail.loading')}</div>
        ) : detail.body_html ? (
          <iframe
            srcDoc={String(detail.body_html)}
            sandbox="allow-same-origin"
            className="w-full h-full border-0"
            title="Email"
          />
        ) : (
          <div className="p-6 overflow-y-auto h-full">
            <pre className="text-sm text-on-surface whitespace-pre-wrap font-sans leading-relaxed">
              {String(detail.body_text ?? mail.snippet ?? '')}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MailView(): JSX.Element {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Mail[]>([])
  const [selected, setSelected] = useState<Mail | null>(null)
  const [detail, setDetail] = useState<Mail | null>(null)
  const [composing, setComposing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [authStatus, setAuthStatus] = useState<{ configured: boolean; email: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.db.mail.authStatus().then(setAuthStatus)
    loadMessages()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadMessages(search || undefined), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const loadMessages = async (q?: string): Promise<void> => {
    const rows = await window.db.mail.list(q ? { search: q } : undefined)
    setMessages(rows)
  }

  const handleSync = async (): Promise<void> => {
    setSyncing(true)
    setSyncMsg('')
    const result = await window.db.mail.sync()
    setSyncing(false)
    if (result.error) {
      setSyncMsg(t('common.error', { msg: result.error }))
    } else {
      setSyncMsg(result.count > 0 ? t('mail.newMessages', { count: result.count }) : t('mail.noNew'))
      loadMessages(search || undefined)
    }
    setTimeout(() => setSyncMsg(''), 5000)
  }

  const handleSelect = async (mail: Mail): Promise<void> => {
    setSelected(mail)
    setComposing(false)
    setDetail(null)
    const d = await window.db.mail.get(mail.id as number)
    setDetail(d)
    if (!mail.is_read) {
      await window.db.mail.markRead(mail.id as number)
      setMessages((prev) => prev.map((m) => (m.id === mail.id ? { ...m, is_read: 1 } : m)))
    }
  }

  if (authStatus && !authStatus.configured) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-2">
        <p className="text-on-surface-variant text-sm font-medium">{t('mail.notConfigured')}</p>
        <p className="text-xs text-on-surface-variant/40">{t('mail.configHint')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-outline-variant/40">
        <div className="px-3 py-2 border-b border-outline-variant/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-on-surface">{t('mail.inbox')}</span>
            <div className="flex gap-1.5">
              <button onClick={handleSync} disabled={syncing}
                className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40">
                {syncing ? '…' : '↻'}
              </button>
              <button onClick={() => { setComposing(true); setSelected(null) }}
                className="px-2.5 py-1 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600">
                {t('mail.new')}
              </button>
            </div>
          </div>
          {syncMsg && <p className="text-xs text-on-surface-variant/60 mb-1">{syncMsg}</p>}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm">⌕</span>
            <input
              className="w-full pl-7 pr-2 py-1 text-sm border border-outline-variant rounded-lg bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary/40"
              placeholder={t('mail.searchPh')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-on-surface-variant/60 mt-1">{t('mail.count', { count: messages.length })}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-on-surface-variant/60 text-sm mb-2">{t('mail.noMessages')}</p>
              <button onClick={handleSync} className="text-primary text-xs hover:underline">{t('mail.syncStart')}</button>
            </div>
          ) : (
            messages.map((m) => (
              <MailItem key={m.id as number} mail={m} active={selected?.id === m.id} onClick={() => handleSelect(m)} />
            ))
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {composing ? (
          <ComposePanel fromEmail={authStatus?.email ?? ''} onClose={() => setComposing(false)} />
        ) : selected === null ? (
          <div className="flex items-center justify-center h-full text-on-surface-variant/40 text-sm">
            {t('mail.selectMessage')}
          </div>
        ) : (
          <MailDetail mail={selected} detail={detail} />
        )}
      </div>
    </div>
  )
}

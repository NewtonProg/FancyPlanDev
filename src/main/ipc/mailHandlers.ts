import { ipcMain } from 'electron'
import { getDb } from '../db/database'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'

function getSetting(key: string): string {
  const row = getDb().prepare('SELECT value FROM TSettings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? ''
}

function imapConfig() {
  return {
    host: getSetting('mail_imap_host') || 'imap.gmail.com',
    port: Number(getSetting('mail_imap_port') || 993),
    secure: getSetting('mail_imap_tls') !== '0',
    auth: { user: getSetting('mail_imap_user'), pass: getSetting('mail_imap_password') },
    logger: false
  }
}

function smtpConfig() {
  const port = Number(getSetting('mail_smtp_port') || 587)
  return {
    host: getSetting('mail_smtp_host') || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: getSetting('mail_smtp_user'), pass: getSetting('mail_smtp_password') }
  }
}

// Auth status — check if IMAP credentials are configured
ipcMain.handle('mail:auth:status', () => {
  const user = getSetting('mail_imap_user')
  const pass = getSetting('mail_imap_password')
  const host = getSetting('mail_imap_host')
  return { configured: !!(user && pass && host), email: user }
})

// Test IMAP connection
ipcMain.handle('mail:config:test', async () => {
  const client = new ImapFlow(imapConfig())
  try {
    await client.connect()
    await client.logout()
    return { ok: true }
  } catch (err) {
    return { error: String(err) }
  }
})

// Sync: fetch new messages via IMAP
ipcMain.handle('mail:sync', async () => {
  const cfg = imapConfig()
  if (!cfg.auth.user || !cfg.auth.pass) return { error: 'Nicht konfiguriert', count: 0 }

  const db = getDb()
  const client = new ImapFlow(cfg)

  try {
    await client.connect()
    const mb = await client.mailboxOpen('INBOX')
    const total = mb.exists

    if (total === 0) { await client.logout(); return { count: 0 } }

    // Fetch last 100 messages (highest UIDs)
    const seqStart = Math.max(1, total - 99)
    const range = `${seqStart}:*`

    const existingUids = new Set(
      (db.prepare('SELECT msg_uid FROM TMailReceive').all() as { msg_uid: string }[])
        .map((r) => r.msg_uid)
    )

    const insert = db.prepare(`
      INSERT OR IGNORE INTO TMailReceive
        (msg_uid, subject, from_addr, from_name, to_addr, date_received, snippet, is_read, has_attachment)
      VALUES
        (@msg_uid, @subject, @from_addr, @from_name, @to_addr, @date_received, @snippet, @is_read, @has_attachment)
    `)

    let inserted = 0
    const prefix = `${cfg.host}:${cfg.port}:`

    for await (const msg of client.fetch(range, { uid: true, envelope: true, flags: true })) {
      const uid = `${prefix}${msg.uid}`
      if (existingUids.has(uid)) continue

      const env = msg.envelope
      const from = env?.from?.[0]
      const isRead = msg.flags?.has('\\Seen') ? 1 : 0

      insert.run({
        msg_uid: uid,
        subject: env?.subject ?? '(kein Betreff)',
        from_addr: from?.address ?? '',
        from_name: from?.name ?? '',
        to_addr: env?.to?.map((t) => t.address).filter(Boolean).join(', ') ?? '',
        date_received: env?.date?.toISOString() ?? new Date().toISOString(),
        snippet: '',
        is_read: isRead,
        has_attachment: 0
      })
      inserted++
    }

    await client.logout()
    return { count: inserted }
  } catch (err) {
    try { await client.logout() } catch {}
    return { error: String(err), count: 0 }
  }
})

// List messages from local DB
ipcMain.handle('mail:list', (_e, filter?: { search?: string; unreadOnly?: boolean }) => {
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter?.unreadOnly) conditions.push('is_read = 0')
  if (filter?.search) {
    conditions.push('(subject LIKE ? OR from_addr LIKE ? OR from_name LIKE ? OR snippet LIKE ?)')
    const q = `%${filter.search}%`
    params.push(q, q, q, q)
  }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
  return db
    .prepare(`SELECT id, msg_uid, subject, from_addr, from_name, to_addr, date_received, snippet, is_read, has_attachment FROM TMailReceive${where} ORDER BY date_received DESC LIMIT 300`)
    .all(...params)
})

// Get single message — fetch body from IMAP if not yet cached
ipcMain.handle('mail:get', async (_e, id: number) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM TMailReceive WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  if (row.body_html || row.body_text) return row

  // Parse UID from msg_uid field (format "host:port:uid")
  const parts = String(row.msg_uid).split(':')
  const uid = Number(parts[parts.length - 1])
  if (!uid) return row

  const client = new ImapFlow(imapConfig())
  try {
    await client.connect()
    await client.mailboxOpen('INBOX')

    const msgData = await client.fetchOne(`${uid}`, { source: true }, { uid: true })
    if (msgData?.source) {
      const parsed = await simpleParser(msgData.source)
      const html = parsed.html || ''
      const text = parsed.text || ''
      const snippet = text.slice(0, 200).replace(/\s+/g, ' ')

      db.prepare('UPDATE TMailReceive SET body_html = ?, body_text = ?, snippet = ? WHERE id = ?')
        .run(html || null, text || null, snippet, id)

      await client.logout()
      return { ...row, body_html: html, body_text: text, snippet }
    }
    await client.logout()
  } catch {
    try { await client.logout() } catch {}
  }
  return row
})

// Mark as read — locally + IMAP flag
ipcMain.handle('mail:markRead', async (_e, id: number) => {
  const db = getDb()
  const row = db.prepare('SELECT msg_uid FROM TMailReceive WHERE id = ?').get(id) as { msg_uid: string } | undefined
  if (!row) return { ok: false }

  db.prepare('UPDATE TMailReceive SET is_read = 1 WHERE id = ?').run(id)

  const parts = row.msg_uid.split(':')
  const uid = Number(parts[parts.length - 1])
  if (uid) {
    const client = new ImapFlow(imapConfig())
    try {
      await client.connect()
      await client.mailboxOpen('INBOX')
      await client.messageFlagsAdd({ uid: `${uid}` }, ['\\Seen'], { uid: true })
      await client.logout()
    } catch {
      try { await client.logout() } catch {}
    }
  }
  return { ok: true }
})

// Send via SMTP
ipcMain.handle('mail:send', async (_e, data: { to: string; subject: string; body: string; cc?: string }) => {
  const transporter = nodemailer.createTransport(smtpConfig())
  const fromEmail = getSetting('mail_smtp_user')
  const fromName = getSetting('mail_from_name')
  try {
    await transporter.sendMail({
      from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
      to: data.to,
      cc: data.cc || undefined,
      subject: data.subject,
      html: data.body.replace(/\n/g, '<br>'),
      text: data.body
    })
    return { ok: true }
  } catch (err) {
    return { error: String(err) }
  }
})

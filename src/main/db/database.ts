import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

export function initDb(): void {
  const userDataPath = app.getPath('userData')
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  const dbPath = path.join(userDataPath, 'fancyplan.db')
  db = new Database(dbPath)

  db.exec(SCHEMA_SQL)

  // Column migrations for existing databases
  const tcalCols = db.prepare('PRAGMA table_info(TCalendar)').all() as { name: string }[]
  if (!tcalCols.some((c) => c.name === 'source')) {
    db.exec("ALTER TABLE TCalendar ADD COLUMN source TEXT DEFAULT 'caldav'")
  }

  const tgrpCols = db.prepare('PRAGMA table_info(TGroupValues)').all() as { name: string }[]
  if (!tgrpCols.some((c) => c.name === 'IDFormName')) {
    db.exec("ALTER TABLE TGroupValues ADD COLUMN IDFormName TEXT NOT NULL DEFAULT '*'")
  }

  const tthemeCols = db.prepare('PRAGMA table_info(TTheme)').all() as { name: string }[]
  if (!tthemeCols.some((c) => c.name === 'IDFormName')) {
    db.exec("ALTER TABLE TTheme ADD COLUMN IDFormName TEXT DEFAULT '*'")
  }
  if (!tthemeCols.some((c) => c.name === 'IDArea')) {
    db.exec('ALTER TABLE TTheme ADD COLUMN IDArea INTEGER DEFAULT 0')
  }

  const tactCols = db.prepare('PRAGMA table_info(TAct)').all() as { name: string }[]
  if (!tactCols.some((c) => c.name === 'TodayEdited')) {
    db.exec('ALTER TABLE TAct ADD COLUMN TodayEdited TEXT')
  }
  if (!tactCols.some((c) => c.name === 'ProjektName')) {
    db.exec('ALTER TABLE TAct ADD COLUMN ProjektName TEXT')
  }

  const tcatCols = db.prepare('PRAGMA table_info(TCat)').all() as { name: string }[]
  if (!tcatCols.some((c) => c.name === 'IDTheme')) {
    db.exec('ALTER TABLE TCat ADD COLUMN IDTheme INTEGER DEFAULT 0')
    db.exec(`UPDATE TCat SET IDTheme = COALESCE((SELECT id FROM TTheme WHERE ThemeName = TCat.CatGrp LIMIT 1), 0) WHERE CatGrp IS NOT NULL AND CatGrp != '*'`)
  }

  const tacttelCols = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='TActTel'").get()
  if (!tacttelCols) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS TActTel (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        IDTAct     INTEGER NOT NULL,
        IDTTel     INTEGER NOT NULL,
        role       TEXT,
        Com        TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(IDTAct, IDTTel)
      );
      CREATE INDEX IF NOT EXISTS idx_tacttel_act ON TActTel(IDTAct);
      CREATE INDEX IF NOT EXISTS idx_tacttel_tel ON TActTel(IDTTel);
    `)
  } else {
    const tacttelColumns = (db.prepare("PRAGMA table_info(TActTel)").all() as { name: string }[]).map(c => c.name)
    if (!tacttelColumns.includes('Com')) db.exec("ALTER TABLE TActTel ADD COLUMN Com TEXT")
  }

  const ttelemailTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='TTelEmail'").get()
  if (!ttelemailTable) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS TTelEmail (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        tel_id       INTEGER NOT NULL,
        EMail        TEXT NOT NULL DEFAULT '',
        bSender      INTEGER DEFAULT 0,
        bFavorit     INTEGER DEFAULT 0,
        bIsImap      INTEGER DEFAULT 0,
        Com          TEXT,
        Pwd          TEXT,
        MailProvider TEXT,
        sort_order   INTEGER DEFAULT 0,
        created_at   TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ttelemail_tel ON TTelEmail(tel_id);
    `)
    const telRows = db.prepare(`
      SELECT id, EMail1, bSender1, bMailFavo1, bIsImap1, EMail1Com, EMAil1Pwd, MailProvider1,
             EMail2, bSender2, bMailFavo2, bIsImap2, EMail2Com, EMail2Pwd, MailProvider2,
             EMail3, bSender3, bMailFavo3, bIsImap3, EMail3Com, EMail3Pwd, MailProvider3
      FROM TTel
    `).all() as Record<string, unknown>[]
    const insert = db.prepare(
      'INSERT INTO TTelEmail (tel_id, EMail, bSender, bFavorit, bIsImap, Com, Pwd, MailProvider, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const migrate = db.transaction(() => {
      for (const r of telRows) {
        for (const n of [1, 2, 3] as const) {
          const email = r[`EMail${n}`] as string | null
          if (email && String(email).trim()) {
            insert.run(
              r.id,
              email,
              r[`bSender${n}`] ?? 0,
              r[`bMailFavo${n}`] ?? 0,
              r[`bIsImap${n}`] ?? 0,
              r[n === 1 ? 'EMail1Com' : n === 2 ? 'EMail2Com' : 'EMail3Com'] ?? null,
              r[n === 1 ? 'EMAil1Pwd' : n === 2 ? 'EMail2Pwd' : 'EMail3Pwd'] ?? null,
              r[`MailProvider${n}`] ?? null,
              n - 1
            )
          }
        }
      }
    })
    migrate()
  }

  const ttelwebTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='TTelWeb'").get()
  if (!ttelwebTable) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS TTelWeb (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        tel_id       INTEGER NOT NULL,
        Url          TEXT NOT NULL DEFAULT '',
        Com          TEXT,
        sort_order   INTEGER DEFAULT 0,
        created_at   TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ttelweb_tel ON TTelWeb(tel_id);
    `)
    const telWebRows = db.prepare('SELECT id, www1, www1Com, www2, www2Com, www3, www3Com FROM TTel').all() as Record<string, unknown>[]
    const insertWeb = db.prepare('INSERT INTO TTelWeb (tel_id, Url, Com, sort_order) VALUES (?, ?, ?, ?)')
    const migrateWeb = db.transaction(() => {
      for (const r of telWebRows) {
        for (const n of [1, 2, 3] as const) {
          const url = r[`www${n}`] as string | null
          if (url && String(url).trim()) {
            insertWeb.run(r.id, url, r[`www${n}Com`] ?? null, n - 1)
          }
        }
      }
    })
    migrateWeb()
  }

  const tfcmCols = (db.prepare('PRAGMA table_info(TFCMStatus)').all() as { name: string }[]).map(c => c.name)
  if (!tfcmCols.includes('text1')) db.exec('ALTER TABLE TFCMStatus ADD COLUMN text1 TEXT')
  if (!tfcmCols.includes('text2')) db.exec('ALTER TABLE TFCMStatus ADD COLUMN text2 TEXT')

  const tterminCols = (db.prepare('PRAGMA table_info(TTermin)').all() as { name: string }[]).map(c => c.name)
  if (!tterminCols.includes('meet_url'))     db.exec('ALTER TABLE TTermin ADD COLUMN meet_url TEXT')
  if (!tterminCols.includes('meet_comment')) db.exec('ALTER TABLE TTermin ADD COLUMN meet_comment TEXT')
  if (!tterminCols.includes('meet_key'))     db.exec('ALTER TABLE TTermin ADD COLUMN meet_key TEXT')
  if (!tterminCols.includes('meet_phone'))   db.exec('ALTER TABLE TTermin ADD COLUMN meet_phone TEXT')
  if (!tterminCols.includes('cat'))          db.exec('ALTER TABLE TTermin ADD COLUMN cat TEXT')

  const row = db.prepare("SELECT value FROM db_meta WHERE key = 'schema_version'").get() as
    | { value: string }
    | undefined

  if (!row) {
    db.prepare("INSERT INTO db_meta (key, value) VALUES ('schema_version', ?)").run(
      String(SCHEMA_VERSION)
    )
  }
}

export function closeDb(): void {
  db?.close()
  db = null
}

export function backupDb(): string {
  const userDataPath = app.getPath('userData')
  const backupDir = path.join(userDataPath, 'backups')
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const destPath = path.join(backupDir, `fancyplan_${ts}.db`)
  fs.copyFileSync(path.join(userDataPath, 'fancyplan.db'), destPath)
  const files = fs.readdirSync(backupDir)
    .filter((f) => f.startsWith('fancyplan_') && f.endsWith('.db'))
    .sort()
  if (files.length > 7) {
    files.slice(0, files.length - 7).forEach((f) => fs.unlinkSync(path.join(backupDir, f)))
  }
  return destPath
}

// ── Generic helpers ────────────────────────────────────────────────────────

export function dbAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T[] {
  return getDb().prepare(sql).all(...params) as T[]
}

export function dbGet<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined
}

export function dbRun(
  sql: string,
  params: unknown[] = []
): Database.RunResult {
  return getDb().prepare(sql).run(...params)
}

import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema'
import { seedDefaults } from './seed'

let db: Database.Database | null = null

// ── Config file (userData/fancyplan-config.json) ──────────────────────────
// Stored outside the DB so it can be read before initDb() runs.

function configFilePath(): string {
  return path.join(app.getPath('userData'), 'fancyplan-config.json')
}

function readConfig(): Record<string, string> {
  try { return JSON.parse(fs.readFileSync(configFilePath(), 'utf-8')) } catch { return {} }
}

export function writeConfig(data: Record<string, string>): void {
  fs.writeFileSync(configFilePath(), JSON.stringify({ ...readConfig(), ...data }, null, 2))
}

export function getDbPath(): string {
  return readConfig().dbPath ?? path.join(app.getPath('userData'), 'fancyplan.db')
}

// ─────────────────────────────────────────────────────────────────────────────

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

export function initDb(): void {
  const dbPath = getDbPath()
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

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
  if (!tterminCols.includes('cal_uid'))      db.exec('ALTER TABLE TTermin ADD COLUMN cal_uid TEXT')
  if (!tterminCols.includes('is_owner'))     db.exec('ALTER TABLE TTermin ADD COLUMN is_owner INTEGER DEFAULT 1')
  if (!tterminCols.includes('rec_master'))   db.exec('ALTER TABLE TTermin ADD COLUMN rec_master TEXT')
  if (!tterminCols.includes('rec_rule'))      db.exec('ALTER TABLE TTermin ADD COLUMN rec_rule TEXT')
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_ttermin_cal_uid ON TTermin(cal_uid) WHERE cal_uid IS NOT NULL')
  db.exec('CREATE INDEX IF NOT EXISTS idx_ttermin_rec_master ON TTermin(rec_master) WHERE rec_master IS NOT NULL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS TGcalTombstone (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      cal_uid       TEXT,
      master_id     TEXT,
      title         TEXT,
      from_date     TEXT,
      deleted_at    TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_gcaltomb_uid    ON TGcalTombstone(cal_uid);
    CREATE INDEX IF NOT EXISTS idx_gcaltomb_master ON TGcalTombstone(master_id);
    CREATE INDEX IF NOT EXISTS idx_gcaltomb_title  ON TGcalTombstone(title);
  `)

  const tlinksCols = (db.prepare('PRAGMA table_info(TLinks)').all() as { name: string }[]).map(c => c.name)
  if (!tlinksCols.includes('password')) db.exec('ALTER TABLE TLinks ADD COLUMN password TEXT')

  // Remove NOT NULL constraint from IDProfile in TPrio1/2/3 (profile no longer used as key)
  for (const level of [1, 2, 3] as const) {
    const tbl  = `TPrio${level}`
    const iCol = `IDPrio${level}`
    const pCol = `Prio${level}`
    const tCol = `${pCol}Txt`
    const info = db.prepare(`PRAGMA table_info(${tbl})`).all() as { name: string; notnull: number }[]
    if (info.find(c => c.name === 'IDProfile')?.notnull === 1) {
      db.exec(`
        CREATE TABLE ${tbl}_mig (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          ${iCol}    INTEGER,
          IDFormName TEXT NOT NULL,
          IDProfile  TEXT DEFAULT '*',
          Action     TEXT,
          ${pCol}    INTEGER,
          ${tCol}    TEXT
        );
        INSERT INTO ${tbl}_mig SELECT id, ${iCol}, IDFormName, COALESCE(IDProfile, '*'), Action, ${pCol}, ${tCol} FROM ${tbl};
        DROP TABLE ${tbl};
        ALTER TABLE ${tbl}_mig RENAME TO ${tbl};
      `)
    }
  }

  const row = db.prepare("SELECT value FROM db_meta WHERE key = 'schema_version'").get() as
    | { value: string }
    | undefined

  if (!row) {
    db.prepare("INSERT INTO db_meta (key, value) VALUES ('schema_version', ?)").run(
      String(SCHEMA_VERSION)
    )
  }

  // Migration: "Test 1"-Platzhalter → "Willkommen bei FancyPlan"
  const testActRow = db.prepare("SELECT id FROM TAct WHERE Title = 'Test 1' LIMIT 1").get() as { id: number } | undefined
  if (testActRow) {
    const totalActs = (db.prepare('SELECT COUNT(*) AS n FROM TAct').get() as { n: number }).n
    if (totalActs === 1) {
      const ref = db.prepare(`
        SELECT c.Cat AS cat, t.ThemeName AS theme, a.AreaName AS area
        FROM TCat c
        JOIN TTheme t ON t.id = c.IDTheme
        JOIN TArea  a ON a.id = t.IDArea
        WHERE c.IDTheme IS NOT NULL AND c.IDTheme != 0
          AND t.IDArea  IS NOT NULL AND t.IDArea  != 0
        ORDER BY c.id ASC LIMIT 1
      `).get() as { cat: string; theme: string; area: string } | undefined
      const statusRow = db.prepare(`
        SELECT Status AS status FROM TStatus
        WHERE Status IS NOT NULL AND Status != '' AND Status != 'Archiv'
        ORDER BY (Status = 'in Arbeit') DESC, (Status = 'Info') DESC, seq ASC, id ASC LIMIT 1
      `).get() as { status: string } | undefined
      if (ref) {
        db.prepare(`
          UPDATE TAct SET Title = ?, AreaName = ?, ThemeName = ?, Cat = ?, Status = ?,
            Pl1Beg = '2026-01-01', Pl1End = '2028-12-31',
            Com = 'Beispielaktivität – du kannst sie bearbeiten oder löschen.',
            Prio1 = 10, Prio2 = 10
          WHERE id = ?
        `).run('Willkommen bei FancyPlan', ref.area, ref.theme, ref.cat, statusRow?.status ?? 'Info', testActRow.id)
      }
    }
  }

  // Migration: Prio1Txt / Prio2Txt für bestehende Zeilen ohne Text nachfüllen
  const prio1Defaults: Record<number, string> = { 5:'Sofort', 10:'Dringend', 20:'Wichtig', 25:'Warte', 30:'Normal', 50:'Irgendwann' }
  const prio2Defaults: Record<number, string> = { 1:'Neu', 2:'In Arbeit', 3:'Warten', 4:'erledigen', 5:'Fertig' }
  for (const row of db.prepare("SELECT id, Prio1 FROM TPrio1 WHERE Prio1Txt IS NULL OR Prio1Txt = ''").all() as { id: number; Prio1: number }[]) {
    const txt = prio1Defaults[row.Prio1]
    if (txt) db.prepare('UPDATE TPrio1 SET Prio1Txt = ? WHERE id = ?').run(txt, row.id)
  }
  for (const row of db.prepare("SELECT id, Prio2 FROM TPrio2 WHERE Prio2Txt IS NULL OR Prio2Txt = ''").all() as { id: number; Prio2: number }[]) {
    const txt = prio2Defaults[row.Prio2]
    if (txt) db.prepare('UPDATE TPrio2 SET Prio2Txt = ? WHERE id = ?').run(txt, row.id)
  }

  // Auslieferungs-Standardwerte (einmalig bei frischer DB)
  seedDefaults(db)
}

export function closeDb(): void {
  db?.close()
  db = null
}

export function backupDb(): string {
  const backupDir = path.join(app.getPath('userData'), 'backups')
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const destPath = path.join(backupDir, `fancyplan_${ts}.db`)
  fs.copyFileSync(getDbPath(), destPath)
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

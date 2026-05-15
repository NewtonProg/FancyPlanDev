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

  const tcatCols = db.prepare('PRAGMA table_info(TCat)').all() as { name: string }[]
  if (!tcatCols.some((c) => c.name === 'IDTheme')) {
    db.exec('ALTER TABLE TCat ADD COLUMN IDTheme INTEGER DEFAULT 0')
    db.exec(`UPDATE TCat SET IDTheme = COALESCE((SELECT id FROM TTheme WHERE ThemeName = TCat.CatGrp LIMIT 1), 0) WHERE CatGrp IS NOT NULL AND CatGrp != '*'`)
  }

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

// Generiert src/main/db/seedData.ts aus der LIVE-FancyPlan-SQLite-DB.
//
// Quelle ist nicht mehr die Access-Referenz, sondern die vom Nutzer gepflegte
// Auslieferungs-DB (Bereiche, Themen, Status UND Kategorien für den kostenlosen
// Nutzer). better-sqlite3 ist ein natives Electron-Modul, daher muss dieses
// Skript über die Electron-Node-Runtime laufen:
//
//   ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron scripts/gen-seed-data.mjs [pfad-zur.db]
//
// Ohne Pfad-Argument wird die Standard-Live-DB unter %APPDATA%/fancyplan benutzt.
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const dbPath =
  process.argv[2] ?? path.join(homedir(), 'AppData', 'Roaming', 'fancyplan', 'fancyplan.db')
const db = new Database(dbPath, { readonly: true })

// ── Bereiche (nicht archiviert) ──────────────────────────────────────────────
const areas = db
  .prepare('SELECT AreaName, seq1 FROM TArea WHERE binArchiv = 0 ORDER BY seq1, AreaName')
  .all()
  .map((a) => ({ name: String(a.AreaName), seq: Number(a.seq1 ?? 999) }))

// ── Themen (nicht archiviert) — Primärbereich über TTheme.IDArea → TArea.id ───
const themes = db
  .prepare(
    `SELECT t.ThemeName, t.seq1, a.AreaName AS area
       FROM TTheme t
       LEFT JOIN TArea a ON a.id = t.IDArea
      WHERE t.binArchiv = 0
      ORDER BY t.seq1, t.ThemeName`
  )
  .all()
  .map((t) => ({
    name: String(t.ThemeName),
    seq: Number(t.seq1 ?? 999),
    area: t.area ? String(t.area) : null // null = global (IDArea = 0)
  }))

// ── Status — global (IDTheme = 0) oder themenspezifisch ──────────────────────
const status = db
  .prepare(
    `SELECT s.Status, s.seq, s.IDFormName, t.ThemeName AS theme
       FROM TStatus s
       LEFT JOIN TTheme t ON t.id = s.IDTheme
      ORDER BY s.seq, s.Status`
  )
  .all()
  .map((s) => ({
    name: String(s.Status),
    seq: Number(s.seq ?? 0),
    form: s.IDFormName ? String(s.IDFormName) : '*',
    theme: s.theme ? String(s.theme) : null
  }))

// ── Kategorien — Verknüpfung zum Thema über IDTheme; CatGrp bleibt als Label ──
const cats = db
  .prepare(
    `SELECT c.Cat, c.CatGrp, c.IDFormName, c.bActive, t.ThemeName AS theme
       FROM TCat c
       LEFT JOIN TTheme t ON t.id = c.IDTheme
      ORDER BY c.id`
  )
  .all()
  .map((c) => ({
    cat: String(c.Cat ?? ''),
    grp: c.CatGrp == null ? null : String(c.CatGrp),
    form: c.IDFormName ? String(c.IDFormName) : '*',
    active: c.bActive ? 1 : 0,
    theme: c.theme ? String(c.theme) : null
  }))

// ── TS-Datei schreiben ───────────────────────────────────────────────────────
const banner = `// AUTOMATISCH GENERIERT aus der gepflegten FancyPlan-Auslieferungs-DB (SQLite).
// Quelle: ${dbPath.replace(/\\/g, '/')}
// Neu erzeugen:
//   ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron scripts/gen-seed-data.mjs [db]
// Inhalt: Auslieferungs-Standardwerte (Bereiche, Themen, Status, Kategorien).
`
const out = `${banner}
export interface SeedArea { name: string; seq: number }
export interface SeedTheme { name: string; seq: number; area: string | null }
export interface SeedStatus { name: string; seq: number; form: string; theme: string | null }
export interface SeedCat { cat: string; grp: string | null; form: string; active: number; theme: string | null }

export const SEED_AREAS: SeedArea[] = ${JSON.stringify(areas, null, 2)}

export const SEED_THEMES: SeedTheme[] = ${JSON.stringify(themes, null, 2)}

export const SEED_STATUS: SeedStatus[] = ${JSON.stringify(status, null, 2)}

export const SEED_CATS: SeedCat[] = ${JSON.stringify(cats, null, 2)}
`

writeFileSync('src/main/db/seedData.ts', out)
console.log(
  `Areas: ${areas.length}, Themes: ${themes.length}, Status: ${status.length}, Cats: ${cats.length}`
)
console.log('-> src/main/db/seedData.ts geschrieben')

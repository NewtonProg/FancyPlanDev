import type Database from 'better-sqlite3'
import { SEED_AREAS, SEED_THEMES, SEED_STATUS, SEED_CATS } from './seedData'

// ─────────────────────────────────────────────────────────────────────────────
// Auslieferungs-Standardwerte (Erstinstallation).
//
// Quelle: die vom Nutzer gepflegte Auslieferungs-DB (Bereiche, Themen, Status,
// Kategorien). Die Daten liegen in ./seedData.ts und werden mit
//   ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron scripts/gen-seed-data.mjs
// neu erzeugt.
//
// Läuft EINMALIG bei einer frischen Datenbank (Flag 'seeded_defaults' in db_meta)
// und befüllt jede Sektion zusätzlich nur, wenn die jeweilige Tabelle leer ist –
// eine bereits angelegte (Test-)DB wird also nie überschrieben.
//
// Verknüpfungen werden beim Seeding über NAMEN aufgelöst (IDs werden frisch
// vergeben): Thema→Bereich über TTheme.IDArea = TArea.id, Status/Kategorie→Thema
// über IDTheme = TTheme.id. area/theme = null bedeutet global.
// ─────────────────────────────────────────────────────────────────────────────

function isEmpty(db: Database.Database, table: string): boolean {
  const r = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }
  return r.n === 0
}

export function seedDefaults(db: Database.Database): void {
  const flag = db
    .prepare("SELECT value FROM db_meta WHERE key = 'seeded_defaults'")
    .get() as { value: string } | undefined
  if (flag) return

  const run = db.transaction(() => {
    // ── Bereiche / Themen ──────────────────────────────────────────────────────
    if (isEmpty(db, 'TArea') && isEmpty(db, 'TTheme')) {
      const insArea = db.prepare(
        'INSERT INTO TArea (AreaName, IDArea, seq1, AreaCreated) VALUES (?, 0, ?, CURRENT_TIMESTAMP)'
      )
      const setAreaId = db.prepare('UPDATE TArea SET IDArea = ? WHERE id = ?')
      const insTheme = db.prepare(
        "INSERT INTO TTheme (ThemeName, IDArea, IDFormName, seq1, ThemeCreated) VALUES (?, ?, '*', ?, CURRENT_TIMESTAMP)"
      )
      const setThemeId = db.prepare('UPDATE TTheme SET IDTheme = ? WHERE id = ?')

      const areaId = new Map<string, number>()
      for (const a of SEED_AREAS) {
        const id = Number(insArea.run(a.name, a.seq).lastInsertRowid)
        setAreaId.run(id, id)
        areaId.set(a.name, id)
      }

      for (const t of SEED_THEMES) {
        const ida = t.area ? areaId.get(t.area) ?? 0 : 0
        const id = Number(insTheme.run(t.name, ida, t.seq).lastInsertRowid)
        setThemeId.run(id, id)
      }
    }

    // Thema-Namen → id (frisch oder bereits vorhanden) für Status & Kategorien
    const themeId = new Map<string, number>()
    for (const r of db.prepare('SELECT id, ThemeName FROM TTheme').all() as {
      id: number
      ThemeName: string
    }[]) {
      themeId.set(r.ThemeName, r.id)
    }

    // ── Status (global oder themenspezifisch) ──────────────────────────────────
    if (isEmpty(db, 'TStatus')) {
      const insStatus = db.prepare(
        'INSERT INTO TStatus (IDFormName, IDTheme, Status, StatusGrp, seq, binArchiv) VALUES (?, ?, ?, NULL, ?, 0)'
      )
      for (const s of SEED_STATUS) {
        const tid = s.theme ? themeId.get(s.theme) ?? 0 : 0
        insStatus.run(s.form, tid, s.name, s.seq)
      }
    }

    // ── Kategorien (Verknüpfung zum Thema über IDTheme, CatGrp als Label) ──────
    if (isEmpty(db, 'TCat')) {
      const insCat = db.prepare(
        'INSERT INTO TCat (Cat, CatGrp, IDFormName, bActive, IDTheme, CatCreated) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
      )
      for (const c of SEED_CATS) {
        const tid = c.theme ? themeId.get(c.theme) ?? 0 : 0
        insCat.run(c.cat, c.grp, c.form, c.active, tid)
      }
    }

    // ── Beispielaktivität (nur in eine noch leere TAct) ────────────────────────
    // Bereich/Thema/Kategorie/Status werden aus den soeben eingespielten
    // Auslieferungsdaten abgeleitet (TAct speichert sie als Namen, nicht als IDs),
    // damit die Verknüpfungen garantiert gültig sind. Plan-Zeitraum 01.01.2026–31.12.2028.
    if (isEmpty(db, 'TAct')) {
      const ref = db.prepare(`
        SELECT c.Cat AS cat, t.ThemeName AS theme, a.AreaName AS area
        FROM TCat c
        JOIN TTheme t ON t.id = c.IDTheme
        JOIN TArea  a ON a.id = t.IDArea
        WHERE c.IDTheme IS NOT NULL AND c.IDTheme != 0
          AND t.IDArea  IS NOT NULL AND t.IDArea  != 0
        ORDER BY c.id ASC
        LIMIT 1
      `).get() as { cat: string; theme: string; area: string } | undefined

      if (ref) {
        const statusRow = db.prepare(`
          SELECT Status AS status FROM TStatus
          WHERE Status IS NOT NULL AND Status != '' AND Status != 'Archiv'
          ORDER BY (Status = 'in Arbeit') DESC, (Status = 'Info') DESC, seq ASC, id ASC
          LIMIT 1
        `).get() as { status: string } | undefined

        db.prepare(`
          INSERT INTO TAct (Title, AreaName, ThemeName, Cat, Status, Pl1Beg, Pl1End, Com, Prio1, Prio2, Sdone, SToday, Sdel)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 10, 10, 0, 0, 0)
        `).run(
          'Willkommen bei FancyPlan',
          ref.area,
          ref.theme,
          ref.cat,
          statusRow?.status ?? 'Info',
          '2026-01-01',
          '2028-12-31',
          'Beispielaktivität – du kannst sie bearbeiten oder löschen.'
        )
      }
    }

    // ── TPrio1 / TPrio2 Standardwerte ─────────────────────────────────────────
    if (isEmpty(db, 'TPrio1')) {
      const ins1 = db.prepare(
        "INSERT INTO TPrio1 (IDFormName, IDProfile, Prio1, Prio1Txt) VALUES ('*', '*', ?, ?)"
      )
      for (const [num, txt] of [[5,'Sofort'],[10,'Dringend'],[20,'Wichtig'],[25,'Warte'],[30,'Normal'],[50,'Irgendwann']] as [number,string][]) {
        ins1.run(num, txt)
      }
    }
    if (isEmpty(db, 'TPrio2')) {
      const ins2 = db.prepare(
        "INSERT INTO TPrio2 (IDFormName, IDProfile, Prio2, Prio2Txt) VALUES ('*', '*', ?, ?)"
      )
      for (const [num, txt] of [[5,'Sofort'],[10,'Dringend'],[20,'Wichtig'],[25,'Warte'],[30,'Normal'],[50,'Irgendwann']] as [number,string][]) {
        ins2.run(num, txt)
      }
    }

    db.prepare("INSERT INTO db_meta (key, value) VALUES ('seeded_defaults', ?)").run(
      new Date().toISOString()
    )
  })

  run()
}

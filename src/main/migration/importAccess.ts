import { readFileSync } from 'fs'
import { getDb } from '../db/database'

export type MigrationResult = {
  canceled?: boolean
  success?: boolean
  counts?: Record<string, number>
  errors?: string[]
  catMatched?: number
  catUnmatched?: number
}

type ColumnValue = string | number | boolean | Date | Buffer | null

const TABLES_TO_MIGRATE = [
  'TArea', 'TTheme', 'TCat', 'TGroup1',
  'TPrio1', 'TPrio2', 'TPrio3',
  'TTel', 'TAct'
]

const AUTO_COLS = new Set(['id', 'created_at', 'updated_at'])

export async function importFromAccess(accdbPath: string): Promise<MigrationResult> {
  // Dynamic import keeps mdb-reader (ESM-only) out of the CJS bundle
  const { default: MDBReader } = await import('mdb-reader')

  const buffer = readFileSync(accdbPath)
  const reader = new MDBReader(buffer)

  const db = getDb()
  const availableTables = new Set(reader.getTableNames())
  const counts: Record<string, number> = {}
  const errors: string[] = []

  for (const tableName of TABLES_TO_MIGRATE) {
    if (!availableTables.has(tableName)) {
      errors.push(`${tableName}: Tabelle nicht in Access-Datenbank gefunden`)
      continue
    }

    try {
      const accessTable = reader.getTable(tableName)
      const rows = accessTable.getData() as Record<string, ColumnValue>[]

      const pragmaRows = db
        .prepare(`PRAGMA table_info(${tableName})`)
        .all() as { name: string }[]
      const sqliteCols = new Set(
        pragmaRows.map((r) => r.name).filter((n) => !AUTO_COLS.has(n))
      )

      const accessCols = accessTable.getColumnNames()
      const cols = accessCols.filter((c) => sqliteCols.has(c))

      if (cols.length === 0) {
        errors.push(`${tableName}: Keine übereinstimmenden Spalten gefunden`)
        continue
      }

      const placeholders = cols.map(() => '?').join(', ')
      const stmt = db.prepare(
        `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`
      )

      const doImport = db.transaction(() => {
        db.prepare(`DELETE FROM ${tableName}`).run()
        for (const row of rows) {
          const values = cols.map((col) => {
            const val = row[col]
            if (val === null || val === undefined) return null
            if (typeof val === 'boolean') return val ? 1 : 0
            if (val instanceof Date) return val.toISOString().replace('T', ' ').split('.')[0]
            if (Buffer.isBuffer(val)) return null
            return val
          })
          stmt.run(...values)
        }
      })

      doImport()
      counts[tableName] = rows.length
    } catch (e: unknown) {
      errors.push(`${tableName}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Fix TCat.IDTheme from CatGrp string after import (IDTheme is not in Access)
  let catMatched: number | undefined
  let catUnmatched: number | undefined
  if (counts['TCat'] !== undefined) {
    try {
      db.prepare(`
        UPDATE TCat
        SET IDTheme = COALESCE(
          (SELECT id FROM TTheme WHERE ThemeName = TCat.CatGrp LIMIT 1), 0
        )
        WHERE CatGrp IS NOT NULL AND CatGrp != '*'
      `).run()
      catMatched   = (db.prepare('SELECT COUNT(*) as c FROM TCat WHERE IDTheme != 0').get() as { c: number }).c
      catUnmatched = (db.prepare("SELECT COUNT(*) as c FROM TCat WHERE IDTheme = 0 AND CatGrp IS NOT NULL AND CatGrp != '*'").get() as { c: number }).c
    } catch (e) {
      errors.push(`TCat-Zuordnung: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { success: errors.length === 0, counts, errors, catMatched, catUnmatched }
}

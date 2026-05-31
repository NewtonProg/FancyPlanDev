import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type ImportState = 'idle' | 'running' | 'done' | 'error'
type JsonState = 'idle' | 'running' | 'done' | 'error'

type ImportResult = {
  canceled?: boolean
  success?: boolean
  counts?: Record<string, number>
  errors?: string[]
  catMatched?: number
  catUnmatched?: number
}

const TABLE_LABELS: Record<string, string> = {
  TArea:   'Bereiche',
  TTheme:  'Themen',
  TCat:    'Kategorien',
  TGroup1: 'Gruppen',
  TPrio1:  'Prioritäten 1',
  TPrio2:  'Prioritäten 2',
  TPrio3:  'Prioritäten 3',
  TTel:    'Kontakte',
  TAct:    'Aktivitäten',
}

export default function ImportView(): JSX.Element {
  const { t } = useTranslation()
  const [state, setState] = useState<ImportState>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [jsonExState, setJsonExState] = useState<JsonState>('idle')
  const [jsonExMsg, setJsonExMsg] = useState<string | null>(null)
  const [jsonImState, setJsonImState] = useState<JsonState>('idle')
  const [jsonImCounts, setJsonImCounts] = useState<Record<string, number> | null>(null)
  const [jsonImError, setJsonImError] = useState<string | null>(null)

  async function handleImport(): Promise<void> {
    setState('running')
    setResult(null)
    try {
      const res = await window.db.migrate.fromAccess()
      if (res.canceled) {
        setState('idle')
        return
      }
      setResult(res)
      setState(res.success ? 'done' : 'error')
    } catch (e) {
      setResult({ errors: [String(e)] })
      setState('error')
    }
  }

  const totalRows =
    result?.counts ? Object.values(result.counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-semibold text-on-surface mb-2">
        {t('import.title')}
      </h2>
      <p className="text-sm text-on-surface-variant/60 mb-8">
        {t('import.description')}
      </p>

      <div className="rounded-apple bg-surface-container-low shadow-apple-sm p-6 mb-6">
        <p className="text-sm text-on-surface-variant mb-4">
          {t('import.tables')}
        </p>
        <button
          onClick={handleImport}
          disabled={state === 'running'}
          className="px-4 py-2 rounded-apple-sm bg-apple-blue text-white text-sm font-medium
                     hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {state === 'running' ? t('import.importing') : t('import.selectFile')}
        </button>
      </div>

      {state === 'done' && result && (
        <div className="rounded-apple border border-secondary-container/30 bg-secondary-container/10 p-5">
          <p className="text-sm font-medium text-secondary-fixed-dim mb-3">
            Import abgeschlossen — {totalRows.toLocaleString('de')} Datensätze
          </p>
          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="text-left text-secondary-fixed-dim">
                <th className="pb-1">{t('import.colTable')}</th>
                <th className="pb-1 text-right">{t('import.colRows')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.counts ?? {}).map(([table, count]) => (
                <tr key={table} className="border-t border-secondary-container/30">
                  <td className="py-1 text-secondary-fixed-dim">{TABLE_LABELS[table] ?? table}</td>
                  <td className="py-1 text-right text-secondary-fixed-dim">
                    {count.toLocaleString('de')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(result.catUnmatched ?? 0) > 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 mb-2">
              <p className="text-xs text-amber-400 font-medium mb-0.5">
                {result.catMatched ?? 0} von {(result.counts?.['TCat'] ?? 0).toLocaleString('de')} Kategorien einem Thema zugeordnet
              </p>
              <p className="text-xs text-on-surface-variant/70">
                {result.catUnmatched} Kategorien ohne Zuordnung — in Werte-Liste → Kategorien korrigierbar.
              </p>
            </div>
          )}
          {(result.catUnmatched ?? 0) === 0 && (result.catMatched ?? 0) > 0 && (
            <p className="text-xs text-secondary-fixed-dim/70 mb-2">
              Alle {result.catMatched} Kategorien einem Thema zugeordnet.
            </p>
          )}
          {(result.errors?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-tertiary mb-1">{t('import.notes')}</p>
              {result.errors!.map((e, i) => (
                <p key={i} className="text-xs text-tertiary">• {e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {state === 'error' && result && (
        <div className="rounded-apple border border-red-200 bg-error-container/10 p-5">
          <p className="text-sm font-medium text-error mb-2">{t('import.error')}</p>
          {result.errors?.map((e, i) => (
            <p key={i} className="text-xs text-error">• {e}</p>
          ))}
        </div>
      )}

      {/* ── JSON Export ────────────────────────────────────────────────── */}
      <div className="rounded-apple bg-surface-container-low shadow-apple-sm p-6 mb-4 mt-8">
        <h3 className="text-base font-semibold text-on-surface mb-1">JSON-Export</h3>
        <p className="text-xs text-on-surface-variant/60 mb-4">
          Alle Daten als JSON-Datei speichern (Vollsicherung, lesbar, versioniert).
        </p>
        <button
          onClick={async () => {
            setJsonExState('running'); setJsonExMsg(null)
            const r = await window.db.export.jsonExport()
            if (r.canceled) { setJsonExState('idle'); return }
            if (r.ok) { setJsonExState('done'); setJsonExMsg(`${r.total?.toLocaleString('de')} Datensätze exportiert → ${r.path}`) }
            else { setJsonExState('error'); setJsonExMsg(r.error ?? 'Fehler') }
          }}
          disabled={jsonExState === 'running'}
          className="px-4 py-2 rounded-apple-sm bg-apple-blue text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {jsonExState === 'running' ? 'Exportiert…' : '↓ JSON exportieren'}
        </button>
        {jsonExMsg && (
          <p className={`text-xs mt-3 ${jsonExState === 'error' ? 'text-error' : 'text-secondary-fixed-dim'}`}>
            {jsonExMsg}
          </p>
        )}
      </div>

      {/* ── JSON Import ────────────────────────────────────────────────── */}
      <div className="rounded-apple bg-surface-container-low shadow-apple-sm p-6 mb-4">
        <h3 className="text-base font-semibold text-on-surface mb-1">JSON-Import</h3>
        <p className="text-xs text-on-surface-variant/60 mb-1">
          Zuvor exportierte JSON-Datei einlesen. Bestehende Datensätze werden überschrieben (INSERT OR REPLACE).
        </p>
        <p className="text-xs text-error/80 mb-4">⚠ Vorher eine Sicherung erstellen.</p>
        <button
          onClick={async () => {
            setJsonImState('running'); setJsonImCounts(null); setJsonImError(null)
            const r = await window.db.export.jsonImport()
            if (r.canceled) { setJsonImState('idle'); return }
            if (r.ok) { setJsonImState('done'); setJsonImCounts(r.counts ?? {}) }
            else { setJsonImState('error'); setJsonImError(r.error ?? 'Fehler') }
          }}
          disabled={jsonImState === 'running'}
          className="px-4 py-2 rounded-apple-sm bg-apple-blue text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {jsonImState === 'running' ? 'Importiert…' : '↑ JSON importieren'}
        </button>

        {jsonImState === 'done' && jsonImCounts && (
          <div className="mt-4 border border-secondary-container/30 bg-secondary-container/10 rounded-lg p-4">
            <p className="text-sm font-medium text-secondary-fixed-dim mb-2">
              Import abgeschlossen — {Object.values(jsonImCounts).reduce((a, b) => a + b, 0).toLocaleString('de')} Datensätze
            </p>
            <table className="w-full text-xs">
              <tbody>
                {Object.entries(jsonImCounts).map(([tbl, cnt]) => (
                  <tr key={tbl} className="border-t border-secondary-container/20">
                    <td className="py-0.5 text-secondary-fixed-dim">{tbl}</td>
                    <td className="py-0.5 text-right text-secondary-fixed-dim">{cnt.toLocaleString('de')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {jsonImState === 'error' && (
          <p className="text-xs text-error mt-3">{jsonImError}</p>
        )}
      </div>
    </div>
  )
}

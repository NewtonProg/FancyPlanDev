import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type ImportState = 'idle' | 'running' | 'done' | 'error'

type ImportResult = {
  canceled?: boolean
  success?: boolean
  counts?: Record<string, number>
  errors?: string[]
}

export default function ImportView(): JSX.Element {
  const { t } = useTranslation()
  const [state, setState] = useState<ImportState>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)

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
            {t('import.completed', { count: totalRows.toLocaleString('de') })}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-secondary-fixed-dim">
                <th className="pb-1">{t('import.colTable')}</th>
                <th className="pb-1 text-right">{t('import.colRows')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.counts ?? {}).map(([table, count]) => (
                <tr key={table} className="border-t border-secondary-container/30">
                  <td className="py-1 text-secondary-fixed-dim">{table}</td>
                  <td className="py-1 text-right text-secondary-fixed-dim">
                    {count.toLocaleString('de')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  )
}

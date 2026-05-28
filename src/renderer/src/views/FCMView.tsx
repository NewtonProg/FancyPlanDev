import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import FCMValueView from './FCMValueView'
import FCMStatusView from './FCMStatusView'

type FCMSubView = 'hub' | 'values' | 'fcmstatus'

interface FCMViewProps { onLabelChange?: (label: string | null) => void }

export default function FCMView({ onLabelChange }: FCMViewProps) {
  const { t } = useTranslation()
  const [subView, setSubView] = useState<FCMSubView>('hub')

  useEffect(() => {
    const labels: Record<FCMSubView, string | null> = {
      hub:       null,
      values:    t('fcmval.title'),
      fcmstatus: t('fcmst.title'),
    }
    onLabelChange?.(labels[subView])
  }, [subView, t, onLabelChange])

  if (subView === 'values')    return <FCMValueView  onBack={() => setSubView('hub')} />
  if (subView === 'fcmstatus') return <FCMStatusView onBack={() => setSubView('hub')} />

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40">
        <h1 className="text-2xl font-semibold text-on-surface">{t('fcm.title')}</h1>
        <span className="text-xs text-on-surface-variant/60 bg-surface-container-high px-2 py-1 rounded-full">{t('fcm.vip')}</span>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col gap-4 w-72 p-6 border border-outline-variant/40 rounded-xl">
            <button onClick={() => setSubView('fcmstatus')} className="btn-secondary text-base py-3">
              {t('fcm.statusControl')}
            </button>
            <button onClick={() => setSubView('values')} className="btn-secondary text-base py-3">
              {t('fcm.values')}
            </button>
          </div>
        </div>

        <div className="border-t border-outline-variant/40 px-8 py-5">
          <p className="text-sm text-on-surface-variant mb-3">{t('fcm.helpDesc')}</p>
          <button
            onClick={() => window.db.fcm.help.open('DE_FCM_Customizing.docx')}
            className="btn-secondary w-48"
          >
            {t('fcm.helpBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}

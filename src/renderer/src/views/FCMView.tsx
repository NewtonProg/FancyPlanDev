import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLicense } from '../hooks/useLicense'
import FCMValueView from './FCMValueView'
import FCMStatusView from './FCMStatusView'

type FCMSubView = 'hub' | 'values' | 'fcmstatus'

interface FCMViewProps {
  onLabelChange?: (label: string | null) => void
  initialSubView?: FCMSubView
  onProHint?: (feature: string) => void
  onExitValues?: () => void
}

export default function FCMView({ onLabelChange, initialSubView, onProHint, onExitValues }: FCMViewProps) {
  const { t } = useTranslation()
  const { isVip } = useLicense()
  const [subView, setSubView] = useState<FCMSubView>(initialSubView && isVip ? initialSubView : 'hub')

  // Tiefenstart (z.B. aus FNow „Werte") nur für VIP übernehmen.
  useEffect(() => {
    if (initialSubView && isVip) setSubView(initialSubView)
  }, [initialSubView, isVip])

  useEffect(() => {
    const labels: Record<FCMSubView, string | null> = {
      hub:       null,
      values:    t('fcmval.title'),
      fcmstatus: t('fcmst.title'),
    }
    onLabelChange?.(labels[subView])
  }, [subView, t, onLabelChange])

  // Klick auf ein VIP-Modul: VIP öffnet, kostenlose App zeigt den Pro-Hinweis.
  const openModule = (target: 'values' | 'fcmstatus', feature: string): void => {
    if (isVip) setSubView(target)
    else onProHint?.(feature)
  }

  if (subView === 'values')    return <FCMValueView  onBack={() => { if (onExitValues) onExitValues(); else setSubView('hub') }} />
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
            <button onClick={() => openModule('fcmstatus', t('fcm.statusControl'))} className="btn-secondary text-base py-3">
              {t('fcm.statusControl')}
            </button>
            <button onClick={() => openModule('values', t('fcm.values'))} className="btn-secondary text-base py-3">
              {t('fcm.values')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

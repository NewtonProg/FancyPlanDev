import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLicense } from '../hooks/useLicense'
import { useTheme } from '../hooks/useTheme'
import FCMValueView from './FCMValueView'
import FCMStatusView from './FCMStatusView'

type FCMSubView = 'hub' | 'values' | 'fcmstatus' | 'design'

const DESIGN_THEMES = [
  { id: '',                  label: 'Midnight Executive', dot: '#adc6ff', bg: '#0d1017', surface: '#1a1d28', accent: '#adc6ff', text: '#e3e8f0' },
  { id: 'erdfarben',         label: 'Erdfarben',          dot: '#b56646', bg: '#f5f1ea', surface: '#ede8e0', accent: '#7d6355', text: '#3d2e26' },
  { id: 'tactile-precision', label: 'Tactile Precision',  dot: '#004492', bg: '#edeeef', surface: '#dde0e5', accent: '#004492', text: '#1a1d24' },
]

interface FCMViewProps {
  onLabelChange?: (label: string | null) => void
  initialSubView?: FCMSubView
  onProHint?: (feature: string) => void
  onExitValues?: () => void
}

export default function FCMView({ onLabelChange, initialSubView, onProHint, onExitValues }: FCMViewProps) {
  const { t } = useTranslation()
  const { isVip } = useLicense()
  const { theme, setTheme } = useTheme()
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
      design:    'Farbdesign',
    }
    onLabelChange?.(labels[subView])
  }, [subView, t, onLabelChange])

  // Klick auf ein VIP-Modul: VIP öffnet, kostenlose App zeigt den Pro-Hinweis.
  const openModule = (target: 'values' | 'fcmstatus' | 'design', feature: string): void => {
    if (isVip) setSubView(target)
    else onProHint?.(feature)
  }

  if (subView === 'values')    return <FCMValueView  onBack={() => { if (onExitValues) onExitValues(); else setSubView('hub') }} />
  if (subView === 'fcmstatus') return <FCMStatusView onBack={() => setSubView('hub')} />

  if (subView === 'design') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/40">
          <button onClick={() => setSubView('hub')}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high flex items-center gap-1">
            ← Zurück
          </button>
          <h1 className="text-xl font-semibold text-on-surface">Farbdesign</h1>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            {DESIGN_THEMES.map((d) => (
              <button
                key={d.id}
                onClick={() => setTheme(d.id)}
                className={`flex flex-col rounded-xl overflow-hidden border-2 transition-colors text-left ${theme === d.id ? 'border-primary' : 'border-outline-variant/40 hover:border-outline-variant'}`}
              >
                <div style={{ background: d.bg, height: 80, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ background: d.surface, borderRadius: 4, height: 10, width: '100%', opacity: 0.9 }} />
                  <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                    <div style={{ background: d.accent, borderRadius: 3, width: '28%', opacity: 0.7 }} />
                    <div style={{ background: d.surface, borderRadius: 3, flex: 1, padding: '4px 5px', display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
                      <span style={{ fontSize: 7, color: d.text, opacity: 0.75, fontWeight: 600, letterSpacing: '0.02em' }}>Mein Design</span>
                      <div style={{ background: d.text, borderRadius: 2, height: 2.5, opacity: 0.2, width: '70%' }} />
                      <div style={{ background: d.accent, borderRadius: 2, height: 2.5, opacity: 0.6, width: '45%' }} />
                    </div>
                  </div>
                </div>
                <div style={{ background: d.surface, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: d.text, opacity: 0.85, fontWeight: 600, flex: 1 }}>{d.label}</span>
                  {theme === d.id && <span style={{ fontSize: 10, color: d.accent }}>✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

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
            <button onClick={() => openModule('design', 'Farbdesign')} className="btn-secondary text-base py-3">
              Farbdesign
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

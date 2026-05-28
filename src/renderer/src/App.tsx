import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLicense } from './hooks/useLicense'
import { useBrand } from './hooks/useBrand'
import ErrorBoundary from './components/ErrorBoundary'
import BrandLogo from './components/BrandLogo'
import { LicenseModal } from './components/LicenseModal'
import FNowModal from './views/FNowModal'
import TodayView from './views/TodayView'
import PrioritiesView from './views/PrioritiesView'
import ActivitiesView from './views/ActivitiesView'
import ContactsView from './views/ContactsView'
import TreeView from './views/TreeView'
import MailView from './views/MailView'
import CalendarView from './views/CalendarView'
import SettingsView from './views/SettingsView'
import AcquisitionView from './views/AcquisitionView'
import FMyDataView from './views/FMyDataView'
import FCMView from './views/FCMView'

type NavView = 'today' | 'priorities' | 'activities' | 'contacts' | 'tree' | 'mail' | 'calendar' | 'acquis' | 'mydata' | 'settings' | 'fcm'

function App(): JSX.Element {
  const { t } = useTranslation()
  const { isVip, trialExpired, reload: reloadLicense } = useLicense()
  const { appName } = useBrand()
  const [activeView, setActiveView] = useState<NavView>('today')
  const [showLicense, setShowLicense] = useState(false)
  const [subViewLabel, setSubViewLabel] = useState<string | null>(null)
  const [navOpen, setNavOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [openContactId, setOpenContactId] = useState<number | null>(null)
  const [returnActId,   setReturnActId]   = useState<number | null>(null)
  const [globalActId,   setGlobalActId]   = useState<number | null>(null)
  const [returnView,    setReturnView]    = useState<NavView | null>(null)
  const [acquisFrom,    setAcquisFrom]    = useState<NavView>('today')
  useEffect(() => { setSubViewLabel(null) }, [activeView])

  useEffect(() => {
    const handler = (e: Event): void => {
      const { telId, actId } = (e as CustomEvent<{ telId: number; actId: number }>).detail
      setReturnActId(actId ?? null)
      setOpenContactId(telId)
      setActiveView('contacts')
    }
    window.addEventListener('fp:open-contact', handler)
    return () => window.removeEventListener('fp:open-contact', handler)
  }, [])

  const navItems: { id: NavView; label: string }[] = [
    { id: 'today',      label: t('nav.today') },
    { id: 'priorities', label: t('nav.priorities') },
    { id: 'activities', label: t('nav.activities') },
    { id: 'contacts',   label: t('nav.contacts') },
    { id: 'tree',       label: t('nav.tree') },
    { id: 'mail',       label: t('nav.mail') },
    { id: 'calendar',   label: t('nav.calendar') },
    { id: 'acquis',     label: t('nav.acquis') },
    { id: 'mydata',     label: t('nav.mydata') }
  ]

  const allViewLabels: Partial<Record<NavView, string>> = {
    settings: t('nav.settings'),
    fcm:      t('nav.fcm'),
  }

  const activeLabel = subViewLabel ?? navItems.find(n => n.id === activeView)?.label ?? allViewLabels[activeView] ?? activeView

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-background text-on-surface">
      <aside
        className={`flex-shrink-0 border-r border-outline-variant/40 flex flex-col overflow-hidden transition-all duration-200 ${navOpen ? 'w-52 py-5 px-3' : 'w-8 py-3 px-0'}`}
        style={{ backgroundColor: 'rgb(var(--fp-surface-container-low))' }}
      >
        {/* Eingeklappt: nur Expand-Button */}
        {!navOpen && (
          <button
            onClick={() => setNavOpen(true)}
            title="Navigation ausklappen"
            className="w-full flex items-center justify-center py-2 text-on-surface-variant/60 hover:bg-surface-container-highest hover:text-on-surface transition-colors text-base">
            ›
          </button>
        )}

        {/* Ausgeklappt: volle Navigation */}
        {navOpen && (
          <>
            <div className="mb-4 px-3 flex items-center gap-2">
              <BrandLogo imgClassName="h-8 w-8 object-contain flex-shrink-0" />
              <span className="text-sm font-bold text-primary tracking-tight truncate">{appName || 'FancyPlan'}</span>
            </div>
            <div className="mb-4 px-3 flex items-center justify-between">
              <h1 className="text-base font-semibold text-primary tracking-tight truncate">{activeLabel}</h1>
              <button
                onClick={() => setNavOpen(false)}
                title="Navigation einklappen"
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-on-surface-variant/50 hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm ml-1">
                ‹
              </button>
            </div>
            <nav className="flex flex-col gap-0.5 flex-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'acquis' && activeView !== 'acquis') setAcquisFrom(activeView)
                    setActiveView(item.id)
                  }}
                  className={`sidebar-item${activeView === item.id ? ' active' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="border-t border-outline-variant/40 pt-2 mt-2 flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setActiveView('settings')
                  setSettingsOpen((o) => !o)
                }}
                className={`sidebar-item${activeView === 'settings' || activeView === 'fcm' ? ' active' : ''}`}
              >
                <span className="flex-1 text-left">{t('nav.settings')}</span>
                <span className="material-symbols-outlined text-[14px] opacity-60">
                  {settingsOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {settingsOpen && (
                <button
                  onClick={() => setActiveView('fcm')}
                  className={`sidebar-item pl-7 text-xs${activeView === 'fcm' ? ' active' : ''}`}
                >
                  {t('nav.fcm')}
                </button>
              )}
            </div>
          </>
        )}
      </aside>

      <main className="flex-1 overflow-hidden bg-background">
        <ErrorBoundary key={activeView} label={t('nav.viewError', { label: activeLabel })}>
        {activeView === 'settings' ? (
          <SettingsView onLicense={() => setShowLicense(true)} />
        ) : activeView === 'today' ? (
          <TodayView />
        ) : activeView === 'priorities' ? (
          <PrioritiesView />
        ) : activeView === 'activities' ? (
          <ActivitiesView />
        ) : activeView === 'contacts' ? (
          <ContactsView
            initialTelId={openContactId ?? undefined}
            onContactOpened={() => setOpenContactId(null)}
            returnActId={returnActId ?? undefined}
            returnLabel={returnView === 'acquis' ? t('nav.acquis') : undefined}
            onNavigateBack={() => {
              if (returnView) { setActiveView(returnView); setReturnView(null) }
              else { setGlobalActId(returnActId); setReturnActId(null) }
            }}
          />
        ) : activeView === 'tree' ? (
          <TreeView />
        ) : activeView === 'mail' ? (
          <MailView />
        ) : activeView === 'calendar' ? (
          <CalendarView />
        ) : activeView === 'acquis' ? (
          <AcquisitionView
            onBack={() => setActiveView(acquisFrom)}
            onOpenContact={(id) => { setOpenContactId(id); setReturnView('acquis'); setActiveView('contacts') }}
          />
        ) : activeView === 'mydata' ? (
          <FMyDataView />
        ) : activeView === 'fcm' ? (
          // TODO GoLive: VIP-Gate wieder aktivieren (isVip ? <FCMView> : locked-Message)
          <FCMView onLabelChange={setSubViewLabel} />
        ) : null}
        </ErrorBoundary>
      </main>

      {globalActId !== null && (
        <FNowModal
          actId={globalActId}
          onClose={() => setGlobalActId(null)}
          onSaved={() => setGlobalActId(null)}
        />
      )}

      {/* Trial abgelaufen — blockierendes Modal */}
      {trialExpired && (
        <LicenseModal forceOpen onActivated={reloadLicense} />
      )}

      {/* Lizenz-Dialog manuell geöffnet */}
      {showLicense && !trialExpired && (
        <LicenseModal onClose={() => setShowLicense(false)} onActivated={() => { reloadLicense(); setShowLicense(false) }} />
      )}
    </div>
  )
}

export default App

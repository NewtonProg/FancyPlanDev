import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import FCMBtnView from './FCMBtnView'
import FCMValueView from './FCMValueView'
import FCMStatusView from './FCMStatusView'

type FCMSubView = 'hub' | 'fcmbtn' | 'values' | 'fcmstatus'
type FCMTab = 'profile' | 'anwendung' | 'system' | 'hilfe'

interface Profile {
  id: number
  profile_name: string
  seq: number
}

export default function FCMView() {
  const { t } = useTranslation()
  const [subView, setSubView] = useState<FCMSubView>('hub')
  const [activeTab, setActiveTab] = useState<FCMTab>('profile')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [newProfileName, setNewProfileName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => { loadProfiles() }, [])

  async function loadProfiles() {
    const rows = await window.db.fcm.profile.getAll()
    setProfiles(rows as Profile[])
  }

  async function handleCreate() {
    if (!newProfileName.trim()) return
    await window.db.fcm.profile.create(newProfileName.trim())
    setNewProfileName('')
    loadProfiles()
  }

  async function handleRename(id: number) {
    if (!editingName.trim()) return
    await window.db.fcm.profile.update(id, { profile_name: editingName.trim() })
    setEditingId(null)
    loadProfiles()
  }

  async function handleDelete(id: number) {
    await window.db.fcm.profile.delete(id)
    loadProfiles()
  }

  if (subView === 'fcmbtn')    return <FCMBtnView    onBack={() => setSubView('hub')} />
  if (subView === 'values')    return <FCMValueView  onBack={() => setSubView('hub')} />
  if (subView === 'fcmstatus') return <FCMStatusView onBack={() => setSubView('hub')} />

  const tabs: { id: FCMTab; label: string }[] = [
    { id: 'profile', label: t('fcm.profileTab') },
    { id: 'anwendung', label: t('fcm.appTab') },
    { id: 'system', label: t('fcm.systemTab') },
    { id: 'hilfe', label: t('fcm.helpTab') }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40">
        <h1 className="text-2xl font-semibold text-on-surface">{t('fcm.title')}</h1>
        <span className="text-xs text-on-surface-variant/60 bg-surface-container-high px-2 py-1 rounded-full">{t('fcm.vip')}</span>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col gap-4 w-72 p-6 border border-outline-variant/40 rounded-xl">
            <button onClick={() => setSubView('fcmstatus')} className="btn-secondary text-base py-3">
              {t('fcm.statusControl')}
            </button>
            <button onClick={() => setSubView('fcmbtn')} className="btn-primary text-base py-3">
              {t('fcm.btnControl')}
            </button>
            <button className="btn-secondary text-base py-3 opacity-50 cursor-not-allowed" disabled>
              {t('fcm.formControl')}
            </button>
            <button onClick={() => setSubView('values')} className="btn-secondary text-base py-3">
              {t('fcm.values')}
            </button>
          </div>
        </div>

        <div className="border-t border-outline-variant/40 flex flex-col flex-1 overflow-hidden">
          <div className="flex border-b border-outline-variant/40">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-apple-blue text-apple-blue'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 overflow-auto flex-1">
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-4 max-w-lg">
                <div className="flex gap-2">
                  <input
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder={t('fcm.newProfilePh')}
                    className="input-field flex-1"
                  />
                  <button onClick={handleCreate} className="btn-primary">{t('fcm.create')}</button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-outline-variant/40">
                      <th className="pb-2 font-medium text-on-surface-variant">{t('fcm.profileName')}</th>
                      <th className="pb-2 font-medium text-on-surface-variant w-40 text-right">{t('fcm.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} className="border-b border-outline-variant/20">
                        <td className="py-2">
                          {editingId === p.id ? (
                            <input
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRename(p.id)
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              className="input-field w-full"
                              autoFocus
                            />
                          ) : (
                            <span className="text-on-surface">{p.profile_name}</span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {editingId === p.id ? (
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => handleRename(p.id)} className="btn-primary text-xs py-1 px-2">{t('fcm.ok')}</button>
                              <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1 px-2">{t('fcm.cancel')}</button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => { setEditingId(p.id); setEditingName(p.profile_name) }}
                                className="btn-secondary text-xs py-1 px-2"
                              >
                                {t('fcm.rename')}
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="btn-secondary text-xs py-1 px-2 text-error hover:bg-error-container/10"
                              >
                                {t('fcm.delete')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {profiles.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-6 text-center text-on-surface-variant/60 text-sm">
                          {t('fcm.noProfiles')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'anwendung' && (
              <div className="text-sm text-on-surface-variant">{t('fcm.appHint')}</div>
            )}

            {activeTab === 'system' && (
              <div className="text-sm text-on-surface-variant">{t('fcm.systemHint')}</div>
            )}

            {activeTab === 'hilfe' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-on-surface-variant">{t('fcm.helpDesc')}</p>
                <button
                  onClick={() => window.db.fcm.help.open('DE_FCM_Customizing.docx')}
                  className="btn-secondary w-48"
                >
                  {t('fcm.helpBtn')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

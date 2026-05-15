import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import FCMBtnDetailModal from './FCMBtnDetailModal'

interface TFCMBtn {
  id: number
  form_name: string
  profile_name: string
  nr: number
  bezeichnung: string | null
  methode: string | null
  ziel_form: string | null
  ziel_profil: string | null
  letztes_profil: number
  abfrage: string | null
  bereich: string | null
  thema: string | null
  kategorie: string | null
  status: string | null
  filter: string | null
  filtertext: string | null
  sub_form1: string | null
  sub_form2: string | null
  sichtbar: number
  nicht_schliessen: number
  neuen_datensatz: number
  user_funktion: string | null
  kein_parameter: number
  aktion: string | null
  param1: string | null
  param2: string | null
  param3: string | null
  hyper_link: string | null
  pic_path: string | null
  hilfetext: string | null
}

interface Profile {
  id: number
  profile_name: string
}

export default function FCMBtnView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const [forms, setForms] = useState<string[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeForm, setActiveForm] = useState('FAct')
  const [activeProfile, setActiveProfile] = useState('')
  const [buttons, setButtons] = useState<TFCMBtn[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailBtn, setDetailBtn] = useState<TFCMBtn | null>(null)

  useEffect(() => {
    Promise.all([
      window.db.fcm.btn.getForms(),
      window.db.fcm.profile.getAll()
    ]).then(([fs, ps]) => {
      setForms(fs as string[])
      const profileList = ps as Profile[]
      setProfiles(profileList)
      if (profileList.length > 0) setActiveProfile(profileList[0].profile_name)
    })
  }, [])

  useEffect(() => {
    if (activeForm && activeProfile) reload()
  }, [activeForm, activeProfile])

  function reload() {
    window.db.fcm.btn.getAll(activeForm, activeProfile).then(rows => setButtons(rows as TFCMBtn[]))
  }

  async function handleNew() {
    const maxNr = buttons.reduce((m, b) => Math.max(m, b.nr), -1)
    await window.db.fcm.btn.create({
      form_name: activeForm,
      profile_name: activeProfile,
      nr: maxNr + 1,
      bezeichnung: '',
      methode: 'OpenForm',
      sichtbar: 1
    })
    reload()
  }

  async function handleDelete(id: number) {
    await window.db.fcm.btn.delete(id)
    setSelectedId(null)
    reload()
  }

  const selectedBtn = buttons.find(b => b.id === selectedId) ?? null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-outline-variant/40">
        <button onClick={onBack} className="btn-secondary text-sm">{t('fcmbtn.back')}</button>
        <h1 className="text-xl font-semibold text-on-surface flex-1">{t('fcmbtn.title')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">{t('fcmbtn.activeForm')}</span>
            <select
              value={activeForm}
              onChange={e => setActiveForm(e.target.value)}
              className="input-field text-sm py-1"
            >
              {forms.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">{t('fcmbtn.profile')}</span>
            <select
              value={activeProfile}
              onChange={e => setActiveProfile(e.target.value)}
              className="input-field text-sm py-1"
            >
              {profiles.map(p => <option key={p.id} value={p.profile_name}>{p.profile_name}</option>)}
              {profiles.length === 0 && <option value="">{t('fcmbtn.noProfile')}</option>}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 border-r border-outline-variant/40 flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/40">
            <span className="text-xs font-semibold text-apple-blue">{t('fcmbtn.activeProfile')}</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-3 py-2 text-left text-xs text-on-surface-variant font-medium">{t('fcmbtn.nr')}</th>
                  <th className="px-3 py-2 text-left text-xs text-on-surface-variant font-medium">{t('fcmbtn.label')}</th>
                  <th className="px-3 py-2 text-left text-xs text-on-surface-variant font-medium">{t('fcmbtn.method')}</th>
                </tr>
              </thead>
              <tbody>
                {buttons.map(btn => (
                  <tr
                    key={btn.id}
                    onClick={() => setSelectedId(btn.id)}
                    className={`border-b border-outline-variant/20 cursor-pointer hover:bg-surface-container-high ${selectedId === btn.id ? 'bg-apple-blue/10' : ''}`}
                  >
                    <td className="px-3 py-2 text-on-surface-variant">{btn.nr}</td>
                    <td className="px-3 py-2 max-w-[80px] truncate">{btn.bezeichnung || '—'}</td>
                    <td className="px-3 py-2 text-xs text-on-surface-variant/60">{btn.methode || '—'}</td>
                  </tr>
                ))}
                {buttons.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-on-surface-variant/60 text-xs">
                      {t('fcmbtn.noButtons')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/40">
            <span className="text-xs font-semibold text-apple-blue">{t('fcmbtn.targetTitle')}</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low">
                  {[t('fcmbtn.colForm'), t('fcmbtn.colLastProfile'), t('fcmbtn.colProfile'), t('fcmbtn.colQuery'), t('fcmbtn.colArea'), t('fcmbtn.colTheme'), t('fcmbtn.colCategory'), ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs text-on-surface-variant font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buttons.map(btn => (
                  <tr
                    key={btn.id}
                    onClick={() => setSelectedId(btn.id)}
                    className={`border-b border-outline-variant/20 cursor-pointer hover:bg-surface-container-high ${selectedId === btn.id ? 'bg-apple-blue/10' : ''}`}
                  >
                    <td className="px-3 py-2">{btn.ziel_form || '—'}</td>
                    <td className="px-3 py-2 text-center">{btn.letztes_profil ? '✓' : ''}</td>
                    <td className="px-3 py-2">{btn.ziel_profil || '—'}</td>
                    <td className="px-3 py-2 text-xs text-on-surface-variant">{btn.abfrage || '—'}</td>
                    <td className="px-3 py-2">{btn.bereich || ''}</td>
                    <td className="px-3 py-2">{btn.thema || ''}</td>
                    <td className="px-3 py-2">{btn.kategorie || ''}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={e => { e.stopPropagation(); setDetailBtn(btn) }}
                        className="btn-secondary text-xs py-0.5 px-2"
                      >
                        {t('fcmbtn.detail')}
                      </button>
                    </td>
                  </tr>
                ))}
                {buttons.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-on-surface-variant/60 text-xs">
                      {t('fcmbtn.noEntries')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-outline-variant/40 bg-surface-container-low">
        <button onClick={handleNew} className="btn-primary text-sm" disabled={!activeProfile}>
          {t('fcmbtn.new')}
        </button>
        {selectedBtn && (
          <>
            <button onClick={() => setDetailBtn(selectedBtn)} className="btn-secondary text-sm">{t('fcmbtn.detail')}</button>
            <button
              onClick={() => handleDelete(selectedBtn.id)}
              className="btn-secondary text-sm text-error hover:bg-error-container/10"
            >
              {t('fcmbtn.delete')}
            </button>
          </>
        )}
        <div className="flex-1" />
        <button className="btn-secondary text-sm opacity-40 cursor-not-allowed" disabled>{t('fcmbtn.copy')}</button>
        <button className="btn-secondary text-sm opacity-40 cursor-not-allowed" disabled>{t('fcmbtn.design')}</button>
      </div>

      {detailBtn && (
        <FCMBtnDetailModal
          btn={detailBtn}
          onClose={() => setDetailBtn(null)}
          onSave={async data => {
            await window.db.fcm.btn.update(detailBtn.id, data)
            setDetailBtn(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

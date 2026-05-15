import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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

export default function FCMBtnDetailModal({
  btn, onClose, onSave
}: {
  btn: TFCMBtn
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
}) {
  const { t } = useTranslation()
  const [f, setF] = useState({
    bezeichnung: btn.bezeichnung ?? '',
    methode: btn.methode ?? 'OpenForm',
    ziel_form: btn.ziel_form ?? '',
    ziel_profil: btn.ziel_profil ?? '',
    letztes_profil: btn.letztes_profil === 1,
    abfrage: btn.abfrage ?? '',
    bereich: btn.bereich ?? '',
    thema: btn.thema ?? '',
    kategorie: btn.kategorie ?? '',
    status: btn.status ?? '',
    filter: btn.filter ?? '',
    filtertext: btn.filtertext ?? '',
    sub_form1: btn.sub_form1 ?? '',
    sub_form2: btn.sub_form2 ?? '',
    sichtbar: btn.sichtbar !== 0,
    nicht_schliessen: btn.nicht_schliessen === 1,
    neuen_datensatz: btn.neuen_datensatz === 1,
    user_funktion: btn.user_funktion ?? '',
    kein_parameter: btn.kein_parameter === 1,
    aktion: btn.aktion ?? '',
    param1: btn.param1 ?? '',
    param2: btn.param2 ?? '',
    param3: btn.param3 ?? '',
    hyper_link: btn.hyper_link ?? '',
    pic_path: btn.pic_path ?? '',
    hilfetext: btn.hilfetext ?? ''
  })

  const txt = (key: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setF(prev => ({ ...prev, [key]: e.target.value }))

  const chk = (key: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setF(prev => ({ ...prev, [key]: e.target.checked }))

  function handleSave() {
    onSave({
      bezeichnung:      f.bezeichnung || null,
      methode:          f.methode || null,
      ziel_form:        f.ziel_form || null,
      ziel_profil:      f.ziel_profil || null,
      letztes_profil:   f.letztes_profil ? 1 : 0,
      abfrage:          f.abfrage || null,
      bereich:          f.bereich || null,
      thema:            f.thema || null,
      kategorie:        f.kategorie || null,
      status:           f.status || null,
      filter:           f.filter || null,
      filtertext:       f.filtertext || null,
      sub_form1:        f.sub_form1 || null,
      sub_form2:        f.sub_form2 || null,
      sichtbar:         f.sichtbar ? 1 : 0,
      nicht_schliessen: f.nicht_schliessen ? 1 : 0,
      neuen_datensatz:  f.neuen_datensatz ? 1 : 0,
      user_funktion:    f.user_funktion || null,
      kein_parameter:   f.kein_parameter ? 1 : 0,
      aktion:           f.aktion || null,
      param1:           f.param1 || null,
      param2:           f.param2 || null,
      param3:           f.param3 || null,
      hyper_link:       f.hyper_link || null,
      pic_path:         f.pic_path || null,
      hilfetext:        f.hilfetext || null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-surface-container-high border border-outline-variant/40 rounded-xl shadow-xl w-[640px] max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-semibold text-on-surface mb-5">{t('fcmbtndetail.title')}</h2>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <label className="label-field">{t('fcmbtndetail.form')}</label>
            <input value={btn.form_name} readOnly className="input-field w-full bg-surface-container-low text-on-surface-variant" />
          </div>
          <div>
            <label className="label-field">{t('fcmbtndetail.profile')}</label>
            <input value={btn.profile_name} readOnly className="input-field w-full bg-surface-container-low text-on-surface-variant" />
          </div>

          <div>
            <label className="label-field">{t('fcmbtndetail.button')}</label>
            <input value={btn.nr} readOnly className="input-field w-full bg-surface-container-low text-on-surface-variant" />
          </div>
          <div>
            <label className="label-field">{t('fcmbtndetail.userFunc')}</label>
            <input value={f.user_funktion} onChange={txt('user_funktion')} className="input-field w-full" />
          </div>

          <div>
            <label className="label-field">{t('fcmbtndetail.status')}</label>
            <input value={f.status} onChange={txt('status')} className="input-field w-full" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={f.kein_parameter} onChange={chk('kein_parameter')} className="w-4 h-4" />
              {t('fcmbtndetail.noParam')}
            </label>
          </div>

          <div>
            <label className="label-field">{t('fcmbtndetail.filter')}</label>
            <input value={f.filter} onChange={txt('filter')} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">{t('fcmbtndetail.action')}</label>
            <input value={f.aktion} onChange={txt('aktion')} className="input-field w-full" />
          </div>

          <div>
            <label className="label-field">{t('fcmbtndetail.filtertext')}</label>
            <input value={f.filtertext} onChange={txt('filtertext')} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">{t('fcmbtndetail.param1')}</label>
            <input value={f.param1} onChange={txt('param1')} className="input-field w-full" />
          </div>

          <div>
            <label className="label-field">{t('fcmbtndetail.loadSubForm1')}</label>
            <input value={f.sub_form1} onChange={txt('sub_form1')} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">{t('fcmbtndetail.param2')}</label>
            <input value={f.param2} onChange={txt('param2')} className="input-field w-full" />
          </div>

          <div>
            <label className="label-field">{t('fcmbtndetail.loadSubForm2')}</label>
            <input value={f.sub_form2} onChange={txt('sub_form2')} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">{t('fcmbtndetail.param3')}</label>
            <input value={f.param3} onChange={txt('param3')} className="input-field w-full" />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={f.sichtbar} onChange={chk('sichtbar')} className="w-4 h-4" />
              {t('fcmbtndetail.visible')}
            </label>
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={f.nicht_schliessen} onChange={chk('nicht_schliessen')} className="w-4 h-4" />
              {t('fcmbtndetail.noClose')}
            </label>
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={f.neuen_datensatz} onChange={chk('neuen_datensatz')} className="w-4 h-4" />
              {t('fcmbtndetail.allowNew')}
            </label>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label-field">{t('fcmbtndetail.hyperLink')}</label>
              <input value={f.hyper_link} onChange={txt('hyper_link')} className="input-field w-full" />
            </div>
            <div>
              <label className="label-field">{t('fcmbtndetail.picPath')}</label>
              <input value={f.pic_path} onChange={txt('pic_path')} className="input-field w-full" />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="label-field">{t('fcmbtndetail.helptext')}</label>
          <input value={f.hilfetext} onChange={txt('hilfetext')} className="input-field w-full" />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-outline-variant/40">
          <button onClick={onClose} className="btn-secondary">{t('fcmbtndetail.cancel')}</button>
          <button onClick={handleSave} className="btn-primary">{t('fcmbtndetail.ok')}</button>
        </div>
      </div>
    </div>
  )
}

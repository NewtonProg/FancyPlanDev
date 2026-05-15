import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

type Row = Record<string, unknown>

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function contactLabel(c: Row): string {
  const parts = [c.FirstName, c.SurName].filter(Boolean)
  return parts.length ? parts.join(' ') : String(c.EMail1 ?? '–')
}

interface NewContactForm {
  firstName: string
  surName: string
  email: string
  headOffice: string
}

const emptyForm: NewContactForm = { firstName: '', surName: '', email: '', headOffice: '' }

export default function AcquisitionView(): JSX.Element {
  const { t } = useTranslation()
  const [letters, setLetters] = useState<string[]>([])
  const [selectedLetter, setSelectedLetter] = useState<string>('')
  const [companies, setCompanies] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [contacts, setContacts] = useState<Row[]>([])
  const [selectedContact, setSelectedContact] = useState<Row | null>(null)
  const [detailEdits, setDetailEdits] = useState<Row>({})
  const [saving, setSaving] = useState(false)
  const [bccToast, setBccToast] = useState<string | null>(null)

  const [quickEmail, setQuickEmail] = useState('')
  const quickRef = useRef<HTMLInputElement>(null)

  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState<NewContactForm>(emptyForm)
  const [newIsHeadOffice, setNewIsHeadOffice] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')

  const loadLetters = useCallback(async () => {
    const rows = await window.db.tel.getLetters()
    setLetters(rows.map((r) => r.letter).filter(Boolean))
  }, [])

  const loadCompanies = useCallback(async (letter: string) => {
    if (!letter) return
    const rows = await window.db.tel.getCompaniesByLetter(letter)
    setCompanies(rows.map((r) => r.Company).filter(Boolean))
    setSelectedCompany('')
    setContacts([])
    setSelectedContact(null)
  }, [])

  const loadContacts = useCallback(async (company: string) => {
    if (!company) return
    const rows = await window.db.tel.getByCompany(company)
    setContacts(rows)
    setSelectedContact(null)
  }, [])

  useEffect(() => { loadLetters() }, [loadLetters])
  useEffect(() => { if (selectedLetter) loadCompanies(selectedLetter) }, [selectedLetter, loadCompanies])
  useEffect(() => { if (selectedCompany) loadContacts(selectedCompany) }, [selectedCompany, loadContacts])

  const handleQuickSave = async (): Promise<void> => {
    if (!quickEmail.trim() || !selectedCompany) return
    await window.db.tel.create({
      EMail1: quickEmail.trim(),
      Company: selectedCompany,
      BegLet: selectedLetter
    })
    setQuickEmail('')
    quickRef.current?.focus()
    await loadContacts(selectedCompany)
    await loadLetters()
  }

  const handleSelectContact = (c: Row): void => {
    setSelectedContact(c)
    setDetailEdits({
      EMail1: c.EMail1 ?? '',
      txt1: c.txt1 ?? '',
      www1: c.www1 ?? '',
      Mobile1: c.Mobile1 ?? '',
      TelNr1: c.TelNr1 ?? '',
      Adress1: c.Adress1 ?? '',
      Country: c.Country ?? '',
      Grp1: c.Grp1 ?? '',
      Grp2: c.Grp2 ?? '',
      Prio1: c.Prio1 ?? '',
      InfoSource1: c.InfoSource1 ?? ''
    })
  }

  const handleDetailSave = async (): Promise<void> => {
    if (!selectedContact) return
    setSaving(true)
    await window.db.tel.update(selectedContact.id as number, detailEdits)
    setSaving(false)
    const updated = { ...selectedContact, ...detailEdits }
    setContacts((prev) => prev.map((c) => (c.id === selectedContact.id ? updated : c)))
    setSelectedContact(updated)
  }

  const handleDeleteContact = async (): Promise<void> => {
    if (!selectedContact) return
    if (!window.confirm(t('common.delete') + '?')) return
    await window.db.tel.delete(selectedContact.id as number)
    setSelectedContact(null)
    await loadContacts(selectedCompany)
    await loadLetters()
  }

  const handleBccCopy = async (): Promise<void> => {
    if (!selectedCompany) return
    const rows = await window.db.tel.getEmailsByCompany(selectedCompany)
    const seen = new Set<string>()
    for (const r of rows) {
      for (const field of ['EMail1', 'EMail2', 'EMail3'] as const) {
        const addr = String(r[field] ?? '').trim().toLowerCase()
        if (addr) seen.add(addr)
      }
    }
    if (seen.size === 0) return
    const unique = Array.from(seen)
    await navigator.clipboard.writeText(unique.join('; '))
    setBccToast(`✓ ${unique.length} Adresse${unique.length !== 1 ? 'n' : ''} kopiert`)
    setTimeout(() => setBccToast(null), 3000)
  }

  const handleNewSave = async (): Promise<void> => {
    const company = newIsHeadOffice ? newCompanyName.trim() : selectedCompany
    if (!company) return
    const letter = company.charAt(0).toUpperCase()
    await window.db.tel.create({
      FirstName: newForm.firstName.trim() || undefined,
      SurName: newForm.surName.trim() || undefined,
      EMail1: newForm.email.trim() || undefined,
      HeadOffice: newIsHeadOffice ? newForm.headOffice.trim() || company : undefined,
      Company: company,
      BegLet: letter
    })
    setShowNewForm(false)
    setNewForm(emptyForm)
    setNewCompanyName('')
    setNewIsHeadOffice(false)
    await loadLetters()
    if (company === selectedCompany) await loadContacts(company)
    else setSelectedLetter(letter)
  }

  const setField =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void =>
      setDetailEdits((p) => ({ ...p, [field]: e.target.value }))

  const inputCls =
    'px-2.5 py-1.5 text-xs border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 bg-surface-container w-full'

  const gridFields: [string, string][] = [
    ['www1', t('acquis.www')],
    ['Mobile1', t('acquis.mobile')],
    ['TelNr1', t('acquis.tel')],
    ['Adress1', t('acquis.city')],
    ['Country', t('acquis.country')],
    ['Grp1', t('acquis.group1')],
    ['Grp2', t('acquis.group2')],
    ['Prio1', t('acquis.priority')],
    ['InfoSource1', t('acquis.source')]
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-outline-variant/40 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-on-surface mr-2">{t('acquis.title')}</h2>
        <button
          onClick={() => { setShowNewForm(true); setNewIsHeadOffice(false) }}
          className="px-3 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600">
          {t('acquis.newContact')}
        </button>
        <button
          onClick={() => { setShowNewForm(true); setNewIsHeadOffice(true) }}
          className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">
          {t('acquis.newHeadOffice')}
        </button>
      </div>

      {/* New contact/HO modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/40 shadow-xl w-96 p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-on-surface">
              {newIsHeadOffice ? t('acquis.newHOTitle') : t('acquis.newContactTitle')}
            </h3>
            {newIsHeadOffice && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">{t('acquis.companyLabel')}</label>
                <input className="input-field" value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder={t('acquis.companyPh')} />
                <label className="text-xs text-on-surface-variant mt-1">{t('acquis.hoNameLabel')}</label>
                <input className="input-field" value={newForm.headOffice}
                  onChange={(e) => setNewForm((p) => ({ ...p, headOffice: e.target.value }))}
                  placeholder={t('acquis.hoNamePh')} />
              </div>
            )}
            {!newIsHeadOffice && selectedCompany && (
              <p className="text-xs text-on-surface-variant/60">
                {t('acquis.firmInfo')} <span className="font-medium text-on-surface">{selectedCompany}</span>
              </p>
            )}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-on-surface-variant">{t('acquis.firstName')}</label>
                <input className="input-field" value={newForm.firstName}
                  onChange={(e) => setNewForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder={t('acquis.firstName')} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-on-surface-variant">{t('acquis.lastName')}</label>
                <input className="input-field" value={newForm.surName}
                  onChange={(e) => setNewForm((p) => ({ ...p, surName: e.target.value }))}
                  placeholder={t('acquis.lastName')} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-on-surface-variant">{t('acquis.email')}</label>
              <input className="input-field" value={newForm.email}
                onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))}
                placeholder={t('acquis.emailPh')} type="email" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => { setShowNewForm(false); setNewForm(emptyForm); setNewCompanyName('') }}
                className="px-4 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high">
                {t('acquis.cancel')}
              </button>
              <button onClick={handleNewSave}
                className="px-4 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600">
                {t('acquis.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 4-column body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Alphabet strip */}
        <div className="w-10 flex-shrink-0 border-r border-outline-variant/40 overflow-y-auto py-2 flex flex-col items-center gap-0.5 bg-surface-container-low">
          {LETTERS.map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLetter(l)}
              disabled={!letters.includes(l)}
              className={`w-7 h-6 text-xs rounded font-medium transition-colors
                ${!letters.includes(l) ? 'text-on-surface-variant/40 cursor-default' : ''}
                ${selectedLetter === l
                  ? 'bg-primary text-on-primary'
                  : letters.includes(l)
                    ? 'text-on-surface hover:bg-surface-container-highest'
                    : ''}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Company list */}
        <div className="w-44 flex-shrink-0 border-r border-outline-variant/40 overflow-y-auto bg-surface-container">
          {selectedLetter && companies.length === 0 && (
            <p className="text-xs text-on-surface-variant/40 p-3">{t('acquis.noCompanies')}</p>
          )}
          {companies.map((company) => (
            <button
              key={company}
              onClick={() => setSelectedCompany(company)}
              className={`w-full text-left px-3 py-2 text-xs truncate border-b border-outline-variant/20 transition-colors
                ${selectedCompany === company
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-on-surface hover:bg-surface-container-high'}`}>
              {company}
            </button>
          ))}
        </div>

        {/* Contact list + quick capture */}
        <div className="w-52 flex-shrink-0 border-r border-outline-variant/40 flex flex-col overflow-hidden bg-surface-container">
          {selectedCompany ? (
            <>
              <div className="px-2.5 py-2 border-b border-outline-variant/40 flex items-center gap-1.5 bg-surface-container-low flex-shrink-0">
                <input
                  ref={quickRef}
                  className="flex-1 px-2 py-1 text-xs border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 bg-surface-container"
                  placeholder={t('acquis.quickPh')}
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuickSave() }}
                />
                <button
                  onClick={handleQuickSave}
                  disabled={!quickEmail.trim()}
                  className="px-2 py-1 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40 flex-shrink-0">
                  +
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 && (
                  <p className="text-xs text-on-surface-variant/40 p-3">
                    {t('acquis.noContacts', { company: selectedCompany })}
                  </p>
                )}
                {contacts.map((c) => (
                  <button
                    key={c.id as number}
                    onClick={() => handleSelectContact(c)}
                    className={`w-full text-left px-3 py-2 border-b border-outline-variant/20 transition-colors
                      ${selectedContact?.id === c.id ? 'bg-primary/5' : 'hover:bg-surface-container-high'}`}>
                    <div className="text-xs font-medium text-on-surface truncate">{contactLabel(c)}</div>
                    {c.EMail1 && (
                      <div className="text-xs text-on-surface-variant/60 truncate">{String(c.EMail1)}</div>
                    )}
                    {c.HeadOffice && (
                      <div className="text-xs text-primary/70 truncate">HQ: {String(c.HeadOffice)}</div>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-on-surface-variant/40 p-4 text-center">
              {t('acquis.selectHint')}
            </div>
          )}
        </div>

        {/* Contact detail panel */}
        <div className="flex-1 overflow-y-auto">
          {!selectedContact ? (
            <div className="flex items-center justify-center h-full text-xs text-on-surface-variant/40">
              {t('acquis.selectContactHint')}
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-4 max-w-xl">

              {/* Name + company */}
              <div>
                <div className="text-sm font-semibold text-on-surface">
                  {contactLabel(selectedContact)}
                </div>
                <div className="text-xs text-primary">{selectedCompany}</div>
              </div>

              {/* EMail */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">{t('acquis.email')}</label>
                <input
                  className={inputCls}
                  value={String(detailEdits.EMail1 ?? '')}
                  onChange={setField('EMail1')}
                  type="email"
                />
              </div>

              {/* txt1 notes/documents */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">{t('acquis.document')}</label>
                <textarea
                  className="px-2.5 py-1.5 text-xs border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 bg-surface-container resize-none w-full"
                  rows={4}
                  value={String(detailEdits.txt1 ?? '')}
                  onChange={setField('txt1')}
                />
              </div>

              {/* Grid of contact fields */}
              <div className="grid grid-cols-2 gap-3">
                {gridFields.map(([field, label]) => (
                  <div key={field} className="flex flex-col gap-0.5">
                    <label className="text-xs text-on-surface-variant/60">{label}</label>
                    <input
                      className={inputCls}
                      value={String(detailEdits[field] ?? '')}
                      onChange={setField(field)}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleBccCopy}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    bccToast
                      ? 'bg-secondary-container/10 border-green-300 text-secondary-fixed-dim'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                  }`}>
                  {bccToast ?? t('acquis.mailListBtn')}
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleDeleteContact}
                  className="text-xs text-error hover:text-red-600 px-2 py-1">
                  {t('acquis.delete')}
                </button>
                <button
                  onClick={handleDetailSave}
                  disabled={saving}
                  className="px-4 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40">
                  {saving ? t('acquis.savingBtn') : t('acquis.save')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

type Row = Record<string, unknown>

type TelEmail = {
  id: number | null
  EMail: string
  bSender: number
  bFavorit: number
  bIsImap: number
  Com: string
  Pwd: string
  MailProvider: string
  sort_order: number
  _deleted?: boolean
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function parseNameFromEmail(email: string): { first: string; last: string } {
  const local = email.split('@')[0] ?? ''
  // split on . _ -
  let parts = local.split(/[._-]/).filter(Boolean)
  if (parts.length < 2) {
    // try CamelCase split
    const camel = local.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')
    if (camel.length >= 2) parts = camel
  }
  const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  if (parts.length >= 2) return { first: cap(parts[0]), last: cap(parts[parts.length - 1]) }
  return { first: cap(local), last: '' }
}

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

interface Props {
  onOpenContact?: (id: number) => void
  onBack?: () => void
}

export default function AcquisitionView({ onOpenContact, onBack }: Props): JSX.Element {
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

  const txt1Ref = useRef<HTMLTextAreaElement>(null)

  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState<NewContactForm>(emptyForm)
  const [newIsHeadOffice, setNewIsHeadOffice] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')

  const [emails, setEmails] = useState<TelEmail[]>([])
  const [showCbx, setShowCbx] = useState(false)
  const [navOpen, setNavOpen] = useState(true)
  const [prio1Options, setPrio1Options] = useState<Row[]>([])
  const [noHOError, setNoHOError] = useState(false)

  useEffect(() => {
    window.db.prio.getAll(1, 'FAcquis').then(setPrio1Options)
  }, [])

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
  useEffect(() => {
    const el = txt1Ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [detailEdits.txt1])

  const handleSelectContact = (c: Row): void => {
    setSelectedContact(c)
    setDetailEdits({
      MrMrs: c.MrMrs ?? '',
      Title: c.Title ?? '',
      HeadOffice: c.HeadOffice ?? '',
      Country: c.Country ?? '',
      Company: c.Company ?? '',
      Mobile1: c.Mobile1 ?? '',
      TelNr1: c.TelNr1 ?? '',
      txt1: c.txt1 ?? '',
      Prio1: c.Prio1 ?? '',
    })
    if (c.id) {
      window.db.ttelmail.getByTel(c.id as number).then((rawMails: unknown) => {
        setEmails((rawMails as Row[]).map((r) => ({
          id: r.id as number,
          EMail: String(r.EMail ?? ''),
          bSender: Number(r.bSender ?? 0),
          bFavorit: Number(r.bFavorit ?? 0),
          bIsImap: Number(r.bIsImap ?? 0),
          Com: String(r.Com ?? ''),
          Pwd: String(r.Pwd ?? ''),
          MailProvider: String(r.MailProvider ?? ''),
          sort_order: Number(r.sort_order ?? 0),
        })))
      })
    } else {
      setEmails([])
    }
  }

  const handleDetailSave = async (): Promise<void> => {
    if (!selectedContact) return
    setSaving(true)
    await window.db.tel.update(selectedContact.id as number, detailEdits)

    const telId = selectedContact.id as number
    for (const e of emails) {
      if (e._deleted) {
        if (e.id !== null) await window.db.ttelmail.delete(e.id)
      } else if (e.id === null) {
        await window.db.ttelmail.create({ tel_id: telId, EMail: e.EMail, bSender: e.bSender, bFavorit: e.bFavorit, bIsImap: e.bIsImap, Com: e.Com, Pwd: e.Pwd, MailProvider: e.MailProvider, sort_order: e.sort_order })
      } else {
        await window.db.ttelmail.update(e.id, { EMail: e.EMail, bSender: e.bSender, bFavorit: e.bFavorit, bIsImap: e.bIsImap, Com: e.Com, Pwd: e.Pwd, MailProvider: e.MailProvider, sort_order: e.sort_order })
      }
    }
    setEmails((prev) => prev.filter((e) => !e._deleted).map((e, i) => ({ ...e, sort_order: i })))

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

  const addEmail = (): void => {
    const order = emails.filter((e) => !e._deleted).length
    setEmails((prev) => [...prev, { id: null, EMail: '', bSender: 0, bFavorit: 0, bIsImap: 0, Com: '', Pwd: '', MailProvider: '', sort_order: order }])
  }

  const updateEmail = (idx: number, field: keyof TelEmail, val: unknown): void => {
    setEmails((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e))
  }

  const removeEmail = (idx: number): void => {
    setEmails((prev) => prev.map((e, i) => i === idx ? { ...e, _deleted: true } : e))
  }

  const setField =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void =>
      setDetailEdits((p) => ({ ...p, [field]: e.target.value }))

  const inputCls =
    'px-2.5 py-1.5 text-xs border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 bg-surface-container w-full'

  const emailInputCls =
    'w-full text-xs border border-outline-variant rounded-lg px-2.5 py-1.5 bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/40'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-outline-variant/40 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="btn-secondary text-xs py-1 px-3">← {t('fcmval.back')}</button>
        )}
        <h2 className="text-sm font-semibold text-on-surface mr-2">{t('acquis.title')}</h2>
        <button
          onClick={() => {
            if (!selectedCompany) { setNoHOError(true); setTimeout(() => setNoHOError(false), 4000); return }
            setNoHOError(false)
            setShowNewForm(true)
            setNewIsHeadOffice(false)
          }}
          className="px-3 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600">
          {t('acquis.newContact')}
        </button>
        <button
          onClick={() => { setNoHOError(false); setShowNewForm(true); setNewIsHeadOffice(true) }}
          className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high">
          {t('acquis.newHeadOffice')}
        </button>
        {noHOError && (
          <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-1.5">
            Bitte wählen Sie ein Head Office oder legen Sie ein Head-Office an.
          </span>
        )}
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
                onBlur={(e) => {
                  const val = e.target.value.trim()
                  if (!val) return
                  setNewForm((p) => {
                    if (p.firstName || p.surName) return p
                    const { first, last } = parseNameFromEmail(val)
                    return { ...p, firstName: first, surName: last }
                  })
                }}
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

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Collapsible nav: Alphabet + Companies + Contacts */}
        <div className={`flex-shrink-0 flex border-r border-outline-variant/40 overflow-hidden transition-all duration-200 ${navOpen ? 'w-[27rem]' : 'w-8'}`}>

          {/* Collapsed: only expand button */}
          {!navOpen && (
            <button
              onClick={() => setNavOpen(true)}
              className="w-full flex items-center justify-center py-2.5 text-on-surface-variant/60 hover:bg-surface-container-highest hover:text-on-surface transition-colors text-base">
              ›
            </button>
          )}

          {/* Expanded: three columns */}
          {navOpen && (
            <>
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

              {/* Contact list */}
              <div className="w-52 flex-shrink-0 flex flex-col overflow-hidden bg-surface-container">
                {selectedCompany ? (
                  <>
                    <div className="px-2 py-2 border-b border-outline-variant/40 flex items-center justify-end bg-surface-container-low flex-shrink-0">
                      <button
                        onClick={() => setNavOpen(false)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-on-surface-variant/50 hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm">
                        ‹
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
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-end px-2 py-2 border-b border-outline-variant/40 bg-surface-container-low">
                      <button
                        onClick={() => setNavOpen(false)}
                        className="w-6 h-6 flex items-center justify-center rounded text-on-surface-variant/50 hover:bg-surface-container-highest hover:text-on-surface transition-colors text-sm">
                        ‹
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-xs text-on-surface-variant/40 p-4 text-center">
                      {t('acquis.selectHint')}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Contact detail panel */}
        <div className="flex-1 overflow-hidden flex justify-center p-6">
          {!selectedContact ? (
            <div className="flex items-center justify-center w-full text-xs text-on-surface-variant/40">
              {t('acquis.selectContactHint')}
            </div>
          ) : (
            <div className="w-full max-w-xl bg-surface-container-low rounded-xl border border-outline-variant/30 shadow-lg overflow-y-auto self-start">
            <div className="p-5 flex flex-col gap-4">

              {/* Name + company */}
              <div>
                <div
                  className={`text-sm font-semibold text-on-surface${onOpenContact ? ' cursor-pointer hover:text-primary' : ''}`}
                  title={onOpenContact ? 'Doppelklick: Kontakt öffnen' : undefined}
                  onDoubleClick={() => onOpenContact && selectedContact.id != null && onOpenContact(selectedContact.id as number)}
                >
                  {contactLabel(selectedContact)}
                </div>
                <div className="text-xs text-primary">{selectedCompany}</div>
              </div>

              {/* PRIMÄRE KONTAKTDATEN */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide mb-1">
                  {t('contacts.sectionPrimaryContact')}
                </p>

                {/* Anrede / Titel */}
                <div className="flex items-center gap-2">
                  <label className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 text-right">
                    {t('contacts.labelTitle')}
                  </label>
                  <input className={`${inputCls} w-24`} placeholder="Herr/Frau"
                    value={String(detailEdits.MrMrs ?? '')} onChange={setField('MrMrs')} />
                  <input className={inputCls} placeholder="Dr./Prof."
                    value={String(detailEdits.Title ?? '')} onChange={setField('Title')} />
                </div>

                {/* Head-Office + Land */}
                <div className="flex items-center gap-2">
                  <label className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 text-right">
                    {t('contacts.labelHeadOffice')}
                  </label>
                  <input className={inputCls}
                    value={String(detailEdits.HeadOffice ?? '')} onChange={setField('HeadOffice')} />
                  <input className={`${inputCls} w-20`} placeholder={t('contacts.countryPh')}
                    value={String(detailEdits.Country ?? '')} onChange={setField('Country')} />
                </div>

                {/* Firma */}
                <div className="flex items-center gap-2">
                  <label className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 text-right">
                    {t('contacts.labelCompany')}
                  </label>
                  <input className={inputCls}
                    value={String(detailEdits.Company ?? '')} onChange={setField('Company')} />
                </div>

                {/* Mobile 1 */}
                <div className="flex items-center gap-2">
                  <label className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 text-right">Mobile 1</label>
                  <input className={inputCls}
                    value={String(detailEdits.Mobile1 ?? '')} onChange={setField('Mobile1')} />
                </div>

                {/* Tel 1 */}
                <div className="flex items-center gap-2">
                  <label className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 text-right">Tel 1</label>
                  <input className={inputCls}
                    value={String(detailEdits.TelNr1 ?? '')} onChange={setField('TelNr1')} />
                </div>
              </div>

              {/* E-MAIL section */}
              <div className="border-t border-outline-variant/40 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wide">
                    {t('contacts.sectionEmail')}
                  </p>
                  <button onClick={() => setShowCbx((v) => !v)}
                    className="text-[10px] text-on-surface-variant/50 hover:text-on-surface-variant transition-colors px-1.5 py-0.5 rounded border border-outline-variant/30">
                    {showCbx ? t('contacts.hideCbx') : t('contacts.showCbx')}
                  </button>
                </div>
                {emails.filter((e) => !e._deleted).map((e, vi) => {
                  const realIdx = (() => {
                    let c = 0
                    for (let i = 0; i < emails.length; i++) {
                      if (!emails[i]._deleted) { if (c === vi) return i; c++ }
                    }
                    return -1
                  })()
                  return (
                    <div key={e.id ?? `new-${vi}`} className="mb-1.5">
                      <div className="flex items-center gap-1">
                        <input className={`${emailInputCls} flex-1`} value={e.EMail}
                          onChange={(ev) => updateEmail(realIdx, 'EMail', ev.target.value)}
                          placeholder={t('contacts.emailPh')} />
                        <button onClick={() => removeEmail(realIdx)}
                          className="flex-shrink-0 text-error/50 hover:text-error transition-colors text-xs px-1">✕</button>
                      </div>
                      {showCbx && (
                        <div className="flex gap-3 mt-0.5 ml-1">
                          <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                            <input type="checkbox" checked={e.bSender === 1}
                              onChange={(ev) => updateEmail(realIdx, 'bSender', ev.target.checked ? 1 : 0)} />
                            {t('contacts.senderRecip')}
                          </label>
                          <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                            <input type="checkbox" checked={e.bFavorit === 1}
                              onChange={(ev) => updateEmail(realIdx, 'bFavorit', ev.target.checked ? 1 : 0)} />
                            {t('contacts.favorite')}
                          </label>
                          <label className="flex items-center gap-1 text-xs text-on-surface-variant/60 cursor-pointer">
                            <input type="checkbox" checked={e.bIsImap === 1}
                              onChange={(ev) => updateEmail(realIdx, 'bIsImap', ev.target.checked ? 1 : 0)} />
                            {t('contacts.imap')}
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
                <button onClick={addEmail}
                  className="text-xs text-on-surface-variant/50 hover:text-on-surface-variant border border-dashed border-outline-variant/40 rounded-lg px-2 py-1 w-full transition-colors">
                  + {t('contacts.addEmail')}
                </button>
              </div>

              {/* Notizen */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">{t('acquis.document')}</label>
                <textarea
                  ref={txt1Ref}
                  className="px-2.5 py-1.5 text-xs border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 bg-surface-container resize-none w-full"
                  style={{ minHeight: '5.5rem', height: 'auto', overflow: 'hidden' }}
                  value={String(detailEdits.txt1 ?? '')}
                  onChange={setField('txt1')}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = `${el.scrollHeight}px`
                  }}
                />
              </div>

              {/* Priorität */}
              {prio1Options.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 text-right">
                    {t('prio.colPrio1')}
                  </label>
                  <select
                    className={`${inputCls} cursor-pointer`}
                    value={String(detailEdits.Prio1 ?? '')}
                    onChange={(e) => setDetailEdits((p) => ({ ...p, Prio1: e.target.value === '' ? null : Number(e.target.value) }))}
                  >
                    <option value="">–</option>
                    {prio1Options.map((o) => (
                      <option key={String(o.id)} value={String(o.Prio1)}>
                        {o.Prio1} {o.Prio1Txt ? `– ${String(o.Prio1Txt)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

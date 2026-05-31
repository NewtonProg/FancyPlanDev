import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TimePicker from '../components/TimePicker'

type CalEvent = Record<string, unknown>
type Termin   = Record<string, unknown>

// ── Recurrence (FancyPlan-interne Serientermine) ─────────────────────────────
type RecFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'
type Recurrence = { freq: RecFreq; interval: number; endMode: 'count' | 'until'; count: number; until: string }
type SaveOpts = { recurrence?: Recurrence; scope?: 'single' | 'series' }

const REC_FREQ_LABEL: Record<RecFreq, string> = {
  daily:   'Täglich',
  weekly:  'Wöchentlich',
  monthly: 'Monatlich',
  yearly:  'Jährlich'
}

// A FancyPlan-internal series is materialised locally and grouped by a "local:" master id
function isLocalSeries(tr: Termin): boolean {
  return String(tr.source ?? 'manual') !== 'gcal' && String(tr.rec_master ?? '').startsWith('local:')
}

function recSummary(rec_rule: unknown): string {
  try {
    const r = JSON.parse(String(rec_rule)) as Recurrence
    const every = r.interval > 1 ? `alle ${r.interval} ` : ''
    const unit = r.freq === 'daily' ? 'Tage' : r.freq === 'weekly' ? 'Wochen' : r.freq === 'monthly' ? 'Monate' : 'Jahre'
    const base = r.interval > 1 ? `${every}${unit}` : REC_FREQ_LABEL[r.freq]
    const end = r.endMode === 'count' ? `, ${r.count}×` : r.until ? `, bis ${r.until}` : ''
    return `${base}${end}`
  } catch {
    return 'Serie'
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date): Date   { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function calDays(month: Date): Date[] {
  const first   = startOfMonth(month)
  const last    = endOfMonth(month)
  const startWd = (first.getDay() + 6) % 7
  const days: Date[] = []
  for (let i = -startWd; i <= last.getDate() - 1 + (6 - (last.getDay() + 6) % 7); i++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), 1 + i))
  }
  return days
}

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return ''
  if (mins < 60) return `${mins} Min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h} Std`
}

type SrcCfg = { accent: string; badge: string; icon: string; label: string; dot: string; glow: string; hex: string }
function srcCfg(src: string): SrcCfg {
  if (src === 'gcal')   return { accent: 'border-l-tertiary',           badge: 'text-tertiary',            icon: 'language',      label: 'GOOGLE',  dot: 'bg-tertiary',            glow: 'shadow-tertiary/10',            hex: '#7965af' }
  if (src === 'caldav') return { accent: 'border-l-secondary-fixed-dim', badge: 'text-secondary-fixed-dim', icon: 'cloud_sync',    label: 'CALDAV',  dot: 'bg-secondary-fixed-dim', glow: 'shadow-secondary-fixed-dim/10', hex: '#4db6ac' }
  return                        { accent: 'border-l-primary',            badge: 'text-primary',             icon: 'edit_calendar', label: 'FancyPlan', dot: 'bg-primary',             glow: 'shadow-primary/10',             hex: '#6750A4' }
}

function calDotColor(ev: CalEvent): string {
  const s = String(ev.status ?? '').toLowerCase()
  if (s === 'cancelled') return 'bg-error'
  if (s === 'tentative') return 'bg-tertiary'
  const src = String(ev.source ?? '')
  if (src === 'gcal')   return 'bg-tertiary'
  if (src === 'caldav') return 'bg-secondary-fixed-dim'
  return 'bg-primary'
}

// ── Category colors + overlap ────────────────────────────────────────────────
const CAT_PALETTE = ['#7c5ccc','#0891b2','#059669','#d97706','#dc2626','#9333ea','#0284c7','#15803d','#b45309','#e11d48']
function catBorderColor(cat: string): string {
  let h = 0; for (const c of cat) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return CAT_PALETTE[h % CAT_PALETTE.length]
}
function addHour(t: string): string {
  const [h, m] = t.split(':').map(Number); const tot = h * 60 + m + 60
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`
}
function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number); return h * 60 + m
}
function groupOverlapping(events: Termin[]): Termin[][] {
  if (events.length <= 1) return events.map(e => [e])
  const out: Termin[][] = []; let cur: Termin[] = []; let maxEnd = ''
  for (const ev of events) {
    const s = String(ev.time_start ?? '00:00')
    const e = String(ev.time_end   ?? addHour(s))
    if (!cur.length || s >= maxEnd) { if (cur.length) out.push(cur); cur = [ev]; maxEnd = e }
    else { cur.push(ev); if (e > maxEnd) maxEnd = e }
  }
  if (cur.length) out.push(cur)
  return out
}

type EventSlot = { tr: Termin; col: number; totalCols: number }
function calcEventSlots(events: Termin[]): EventSlot[] {
  const sorted = [...events].sort((a, b) => String(a.time_start ?? '00:00').localeCompare(String(b.time_start ?? '00:00')))
  const slots: EventSlot[] = sorted.map(tr => ({ tr, col: 0, totalCols: 1 }))
  const colEnds: string[] = []
  for (let i = 0; i < sorted.length; i++) {
    const start = String(sorted[i].time_start ?? '00:00')
    const end   = String(sorted[i].time_end   ?? addHour(start))
    let placed = false
    for (let c = 0; c < colEnds.length; c++) {
      if (start >= colEnds[c]) { slots[i].col = c; colEnds[c] = end; placed = true; break }
    }
    if (!placed) { slots[i].col = colEnds.length; colEnds.push(end) }
  }
  const total = colEnds.length || 1
  for (const s of slots) s.totalCols = total
  return slots
}

// ── View mode ────────────────────────────────────────────────────────────────
type ViewMode = '1T' | '1W' | '2W' | '1M' | 'INT' | '1Y'
type DayGroup = { key: string; date: Date; allDay: Termin[]; timed: Termin[] }

const VIEW_BTNS: { mode: ViewMode; label: string }[] = [
  { mode: '1T',  label: '1 Tag'     },
  { mode: '1W',  label: '1 Woche'   },
  { mode: '2W',  label: '2 Wochen'  },
  { mode: '1M',  label: '1 Monat'   },
  { mode: 'INT', label: 'Intervall' },
  { mode: '1Y',  label: '1 Jahr'    },
]

function getViewRange(mode: ViewMode, sel: Date, intFrom: string, intTo: string): { from: Date; to: Date } {
  if (mode === '1T') return { from: new Date(sel.getFullYear(), sel.getMonth(), sel.getDate()), to: new Date(sel.getFullYear(), sel.getMonth(), sel.getDate()) }
  if (mode === '1W') {
    const wd = (sel.getDay() + 6) % 7
    const from = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - wd)
    return { from, to: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6) }
  }
  if (mode === '2W') {
    const wd = (sel.getDay() + 6) % 7
    const from = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - wd)
    return { from, to: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 13) }
  }
  if (mode === '1M') return { from: startOfMonth(sel), to: endOfMonth(sel) }
  if (mode === 'INT') {
    const from = intFrom ? new Date(intFrom + 'T00:00:00') : new Date(sel)
    const to   = intTo   ? new Date(intTo   + 'T00:00:00') : new Date(sel)
    return { from, to: to < from ? from : to }
  }
  return { from: new Date(sel.getFullYear(), 0, 1), to: new Date(sel.getFullYear(), 11, 31) }
}

function viewRangeTitle(mode: ViewMode, from: Date, to: Date): string {
  if (mode === '1T') return from.toLocaleDateString('de', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  if (mode === '1Y') return String(from.getFullYear())
  if (mode === '1M') return from.toLocaleDateString('de', { month: 'long', year: 'numeric' })
  const sameYear = from.getFullYear() === to.getFullYear()
  const fmt = (d: Date, yr: boolean): string =>
    d.toLocaleDateString('de', { day: 'numeric', month: 'short', ...(yr ? { year: 'numeric' } : {}) })
  return `${fmt(from, false)} – ${fmt(to, !sameYear)}${sameYear ? ' ' + from.getFullYear() : ''}`
}

function shiftSel(mode: ViewMode, sel: Date, dir: 1 | -1): Date {
  const d = new Date(sel)
  if (mode === '1T') { d.setDate(d.getDate() + dir);      return d }
  if (mode === '1W') { d.setDate(d.getDate() + dir * 7);  return d }
  if (mode === '2W') { d.setDate(d.getDate() + dir * 14); return d }
  if (mode === '1M') return new Date(d.getFullYear(), d.getMonth() + dir, 1)
  if (mode === '1Y') return new Date(d.getFullYear() + dir, 0, 1)
  return d
}

function shiftInterval(from: string, to: string, dir: 1 | -1): { from: string; to: string } {
  const f = new Date(from + 'T00:00:00')
  const t = new Date(to   + 'T00:00:00')
  const diff = Math.max(1, Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  f.setDate(f.getDate() + dir * diff)
  t.setDate(t.getDate() + dir * diff)
  return { from: isoDay(f), to: isoDay(t) }
}

// ── TerminModal (Erstellen + Bearbeiten) ─────────────────────────────────────
export function TerminModal({ date, termin, onSave, onClose }: {
  date: Date
  termin?: Termin
  onSave: (data: Record<string, unknown>, opts?: SaveOpts) => Promise<void>
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const isEdit  = !!termin
  const src     = String(termin?.source ?? 'manual')
  const isGcal  = src === 'gcal'
  const isCaldav = src === 'caldav'
  const recMaster = String(termin?.rec_master ?? '')
  // A pure FancyPlan series (never pushed to Google) edits "from this date" forward.
  const isLocalPureSeries = isEdit && recMaster.startsWith('local:') && !isGcal
  // Any series that touches Google — either a real recurring instance or a FancyPlan
  // series pushed up as individual gcal events (rec_master kept, source flipped to gcal).
  const isGcalSeriesEdit = isEdit && isGcal && recMaster !== ''
  const isOwner = (termin?.is_owner ?? 1) === 1
  // Whether the edit dialog should offer the single-vs-series scope choice
  const hasScopeChoice = isLocalPureSeries || isGcalSeriesEdit

  const [title,       setTitle]       = useState(isEdit ? String(termin!.title ?? '') : '')
  const [allDay,      setAllDay]      = useState(isEdit ? !termin!.time_start : false)
  const [timeStart,   setTimeStart]   = useState(isEdit ? String(termin!.time_start ?? '09:00') : '09:00')
  const [timeEnd,     setTimeEnd]     = useState(isEdit ? String(termin!.time_end   ?? '10:00') : '10:00')
  const [location,    setLocation]    = useState(isEdit ? String(termin!.location   ?? '') : '')
  const [notes,       setNotes]       = useState(isEdit ? String(termin!.notes      ?? '') : '')
  const [terminDate,  setTerminDate]  = useState(isEdit ? String(termin!.termin_date ?? isoDay(date)) : isoDay(date))
  const [cat,         setCat]         = useState(isEdit ? String(termin!.cat          ?? '') : '')
  const [meetUrl,     setMeetUrl]     = useState(isEdit ? String(termin!.meet_url     ?? '') : '')
  const [meetComment, setMeetComment] = useState(isEdit ? String(termin!.meet_comment ?? '') : '')
  const [meetKey,     setMeetKey]     = useState(isEdit ? String(termin!.meet_key     ?? '') : '')
  const [meetPhone,   setMeetPhone]   = useState(isEdit ? String(termin!.meet_phone   ?? '') : '')
  const [meetOpen,    setMeetOpen]    = useState(isEdit && !!(termin!.meet_url || termin!.meet_comment || termin!.meet_key || termin!.meet_phone))
  const [saving,      setSaving]      = useState(false)

  // Serientermin (nur FancyPlan-intern, nur beim Anlegen)
  const canRecur = !isEdit && !isGcal && !isCaldav
  const [recOn,       setRecOn]       = useState(false)
  const [recFreq,     setRecFreq]     = useState<RecFreq>('weekly')
  const [recInterval, setRecInterval] = useState(1)
  const [recEndMode,  setRecEndMode]  = useState<'count' | 'until'>('count')
  const [recCount,    setRecCount]    = useState(10)
  const [recUntil,    setRecUntil]    = useState('')
  // Bearbeitungs-Umfang bei bestehender Serie
  const [scope,       setScope]       = useState<'single' | 'series'>('single')

  const inp = 'w-full text-sm bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder-on-surface-variant/40 [&::-webkit-calendar-picker-indicator]:[filter:invert(0.7)] [&::-webkit-calendar-picker-indicator]:cursor-pointer'

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) return
    setSaving(true)
    const data: Record<string, unknown> = {
      title:        title.trim(),
      termin_date:  terminDate,
      time_start:   allDay ? null : timeStart,
      time_end:     allDay ? null : timeEnd,
      location:     location.trim()    || null,
      notes:        notes.trim()       || null,
      meet_url:     meetUrl.trim()     || null,
      meet_comment: meetComment.trim() || null,
      meet_key:     meetKey.trim()     || null,
      meet_phone:   meetPhone.trim()   || null,
      cat:          cat.trim()         || null,
      source:       isEdit ? termin!.source : 'manual',
    }
    if (isEdit) data.id = termin!.id
    const opts: SaveOpts = {}
    if (canRecur && recOn) {
      opts.recurrence = {
        freq:     recFreq,
        interval: Math.max(1, recInterval),
        endMode:  recEndMode,
        count:    Math.max(1, recCount),
        until:    recUntil || terminDate
      }
    }
    if (hasScopeChoice) opts.scope = scope
    await onSave(data, opts)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/30 shadow-2xl w-[420px] flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 sticky top-0 bg-surface-container-high z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">{isEdit ? 'edit_calendar' : 'calendar_add_on'}</span>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-on-surface truncate">{isEdit ? t('cal.editEvent') : t('cal.newEvent')}</span>
              <span className="flex items-center gap-1.5 mt-0.5">
                <span className={`material-symbols-outlined text-[12px] ${srcCfg(src).badge}`}>{srcCfg(src).icon}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${srcCfg(src).badge}`}>
                  {isGcal ? 'Google' : isCaldav ? 'CalDAV' : 'FancyPlan · Intern'}
                </span>
                {hasScopeChoice && (
                  <span className="flex items-center gap-1 text-[10px] text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-[12px]">repeat</span>
                    {termin?.rec_rule ? recSummary(termin.rec_rule) : 'Serie'}
                  </span>
                )}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant/50 hover:text-on-surface transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <input className={inp} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('cal.titlePh')} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />

          <div className="flex items-center gap-3 bg-surface-container/60 rounded-xl px-4 py-2">
            <span className="material-symbols-outlined text-primary/60 text-[18px] flex-shrink-0">calendar_month</span>
            <input
              type="date"
              className="flex-1 text-sm font-medium text-on-surface bg-transparent border-none outline-none focus:ring-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:[filter:invert(0.7)] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              value={terminDate}
              onChange={(e) => setTerminDate(e.target.value)}
            />
          </div>

          {hasScopeChoice && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                <span className="material-symbols-outlined text-[14px]">repeat</span>
                Serie – Umfang der Änderung
              </div>
              <label className="flex items-center gap-2.5 text-sm text-on-surface cursor-pointer select-none">
                <input type="radio" name="scope" checked={scope === 'single'} onChange={() => setScope('single')} className="accent-primary w-4 h-4" />
                Nur diesen Termin
              </label>
              <label className="flex items-center gap-2.5 text-sm text-on-surface cursor-pointer select-none">
                <input type="radio" name="scope" checked={scope === 'series'} onChange={() => setScope('series')} className="accent-primary w-4 h-4" />
                {isGcalSeriesEdit ? 'Ganze Serie (alle Termine)' : 'Ganze Serie ab diesem Termin'}
              </label>
              {scope === 'series' && (
                <p className="text-[10px] text-on-surface-variant/50 leading-snug">
                  {isGcalSeriesEdit
                    ? 'Titel, Zeit, Ort, Notiz, Kategorie & Meeting werden auf die gesamte Google-Serie übertragen. Das Datum bleibt je Termin erhalten.'
                    : 'Titel, Zeit, Ort, Notiz, Kategorie & Meeting werden auf alle folgenden Termine übertragen. Das Datum bleibt je Termin erhalten.'}
                </p>
              )}
              {isGcalSeriesEdit && !isOwner && (
                <p className="text-[10px] text-error/80 leading-snug flex items-start gap-1">
                  <span className="material-symbols-outlined text-[12px] mt-px">info</span>
                  Geteilte Google-Serie – Änderungen werden nur lokal gespeichert, der Google-Kalender bleibt unberührt.
                </p>
              )}
            </div>
          )}

          {isGcal && !isGcalSeriesEdit && !isOwner && (
            <p className="text-[10px] text-error/80 leading-snug flex items-start gap-1 -mt-1">
              <span className="material-symbols-outlined text-[12px] mt-px">info</span>
              Geteilter Google-Termin – Änderungen werden nur lokal gespeichert, der Google-Kalender bleibt unberührt.
            </p>
          )}

          <label className="flex items-center gap-3 text-sm text-on-surface cursor-pointer select-none">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-primary w-4 h-4" />
            {t('cal.allDay')}
          </label>

          {!allDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-on-surface-variant/60 mb-1.5 block">{t('cal.fromLabel')}</label>
                <TimePicker className={inp} value={timeStart} onChange={setTimeStart} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-on-surface-variant/60 mb-1.5 block">{t('cal.toLabel')}</label>
                <TimePicker className={inp} value={timeEnd} onChange={setTimeEnd} />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-on-surface-variant/60 mb-1.5 block">{t('cal.locationLabel')}</label>
            <input className={inp} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('cal.locationPh')} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant/60 mb-1.5 block">{t('cal.noteLabel')}</label>
            <textarea className={`${inp} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('cal.notePh')} />
          </div>

          <div>
            <label className="text-xs text-on-surface-variant/60 mb-1.5 block flex items-center gap-1.5">
              <span>{t('cal.catLabel')}</span>
              {cat && <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: catBorderColor(cat) }} />}
            </label>
            <input className={inp} value={cat} onChange={(e) => setCat(e.target.value)} placeholder={t('cal.catPh')} />
          </div>

          {/* ── Serientermin (nur FancyPlan-intern beim Anlegen) ────────── */}
          {canRecur && (
            <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
              <label className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container/50 hover:bg-surface-container-high/60 transition-colors cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">repeat</span>
                  <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wide">Serientermin</span>
                </div>
                <input type="checkbox" checked={recOn} onChange={(e) => setRecOn(e.target.checked)} className="accent-primary w-4 h-4" />
              </label>
              {recOn && (
                <div className="px-4 pb-4 pt-3 flex flex-col gap-3 bg-surface-container/20">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-on-surface-variant/60">Wiederholung alle</span>
                    <input type="number" min={1} value={recInterval}
                      onChange={(e) => setRecInterval(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 text-sm bg-surface-container border border-outline-variant/40 rounded-lg px-2 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40" />
                    <select value={recFreq} onChange={(e) => setRecFreq(e.target.value as RecFreq)}
                      className="flex-1 text-sm bg-surface-container border border-outline-variant/40 rounded-lg px-2 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40">
                      <option value="daily">{recInterval > 1 ? 'Tage' : 'Tag'}</option>
                      <option value="weekly">{recInterval > 1 ? 'Wochen' : 'Woche'}</option>
                      <option value="monthly">{recInterval > 1 ? 'Monate' : 'Monat'}</option>
                      <option value="yearly">{recInterval > 1 ? 'Jahre' : 'Jahr'}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 text-sm text-on-surface cursor-pointer select-none">
                      <input type="radio" name="recEnd" checked={recEndMode === 'count'} onChange={() => setRecEndMode('count')} className="accent-primary w-4 h-4" />
                      <span>Endet nach</span>
                      <input type="number" min={1} value={recCount} disabled={recEndMode !== 'count'}
                        onChange={(e) => setRecCount(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 text-sm bg-surface-container border border-outline-variant/40 rounded-lg px-2 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-40" />
                      <span className="text-on-surface-variant/60">Terminen</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-sm text-on-surface cursor-pointer select-none">
                      <input type="radio" name="recEnd" checked={recEndMode === 'until'} onChange={() => setRecEndMode('until')} className="accent-primary w-4 h-4" />
                      <span>Endet am</span>
                      <input type="date" value={recUntil} disabled={recEndMode !== 'until'}
                        onChange={(e) => setRecUntil(e.target.value)}
                        className={`${inp} flex-1 disabled:opacity-40`} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Online Meeting (aufklappbar) ────────────────────────────── */}
          <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setMeetOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container/50 hover:bg-surface-container-high/60 transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">video_call</span>
                <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wide">{t('cal.meetSection')}</span>
                {(meetUrl || meetComment || meetKey || meetPhone) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />
                )}
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40 transition-transform" style={{ transform: meetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>
            {meetOpen && (
              <div className="px-4 pb-4 pt-3 flex flex-col gap-3 bg-surface-container/20">
                <div>
                  <label className="text-xs text-on-surface-variant/60 mb-1.5 block">{t('cal.meetUrl')}</label>
                  <input className={inp} value={meetUrl} onChange={(e) => setMeetUrl(e.target.value)} placeholder={t('cal.meetUrlPh')} />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant/60 mb-1.5 block">{t('cal.meetComment')}</label>
                  <input className={inp} value={meetComment} onChange={(e) => setMeetComment(e.target.value)} placeholder={t('cal.meetCommentPh')} />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant/60 mb-1.5 block">{t('cal.meetKey')}</label>
                  <input className={inp} value={meetKey} onChange={(e) => setMeetKey(e.target.value)} placeholder={t('cal.meetKeyPh')} />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant/60 mb-1.5 block">{t('cal.meetPhone')}</label>
                  <input className={inp} value={meetPhone} onChange={(e) => setMeetPhone(e.target.value)} placeholder={t('cal.meetPhonePh')} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/30 sticky bottom-0 bg-surface-container-high">
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity">
            {saving ? t('cal.saving') : isEdit ? t('cal.save') : t('cal.create')}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant text-sm hover:bg-surface-container-high transition-colors">
            {t('cal.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AgendaCard ───────────────────────────────────────────────────────────────
function isGcalSeries(tr: Termin): boolean {
  const uid = String(tr.cal_uid ?? '')
  return uid.startsWith('gcal:') && /_\d{8}T\d{6}/.test(uid)
}

function isGcalEvent(tr: Termin): boolean {
  return String(tr.source ?? '') === 'gcal'
}

function AgendaCard({ tr, onDelete, onEdit, compact = false }: {
  tr: Termin
  onDelete: (tr: Termin) => void
  onEdit: (tr: Termin) => void
  compact?: boolean
}): JSX.Element {
  const src      = String(tr.source ?? 'manual')
  const cfg      = srcCfg(src)
  const cat      = String(tr.cat ?? '')
  const dur      = duration(tr.time_start as string | null, tr.time_end as string | null)
  const allD     = !tr.time_start
  const catColor = cat ? catBorderColor(cat) : undefined

  const glowColor = catColor ?? cfg.hex
  return (
    <div
      onDoubleClick={() => onEdit(tr)}
      style={{
        borderLeftColor: catColor ?? undefined,
        boxShadow: compact
          ? `0 4px 14px ${glowColor}1a, 0 1px 4px rgba(0,0,0,0.3)`
          : `0 6px 24px ${glowColor}22, 0 2px 8px rgba(0,0,0,0.35), 0 12px 28px ${glowColor}12, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
      className={`glass-card rounded-2xl border-l-[3px] ${catColor ? '' : cfg.accent} flex gap-4 group hover:scale-[1.005] transition-all duration-200 border border-outline-variant/10 cursor-pointer`}>

      {/* Time column */}
      <div className={`${compact ? 'w-24' : 'w-32'} flex-shrink-0 border-r border-outline-variant/20 flex flex-col justify-center py-3 pl-3 pr-2`}>
        {allD ? (
          <span className="text-on-surface-variant/50 text-xs uppercase font-medium">Ganztag</span>
        ) : (
          <span className={`text-on-surface font-bold leading-tight ${compact ? 'text-xs' : 'text-sm'}`}>
            {String(tr.time_start)}{tr.time_end ? ` - ${String(tr.time_end)}` : ''}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 py-3 min-w-0">
        {!compact ? (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`material-symbols-outlined text-[13px] ${cfg.badge}`}>{cfg.icon}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.badge}`}>{cfg.label}</span>
            {!!tr.rec_master && (
              <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40" title="Serientermin">repeat</span>
            )}
            {cat && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-outline-variant/30 text-on-surface-variant/60"
                style={{ borderColor: catColor ? catColor + '60' : undefined, color: catColor ?? undefined }}>
                {cat}
              </span>
            )}
          </div>
        ) : (
          cat && <span className="text-[10px] text-on-surface-variant/50 block mb-0.5">{cat}</span>
        )}
        <h4 className={`font-semibold text-on-surface leading-snug truncate pr-2 ${compact ? 'text-sm' : 'text-base mb-2'}`}>
          {String(tr.title ?? '')}
        </h4>
        {!compact && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {tr.location && (
              <div className="flex items-center gap-1.5 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                <span className="text-xs truncate max-w-[180px]">{String(tr.location)}</span>
              </div>
            )}
            {tr.meet_url && (
              <div className="flex items-center gap-1.5 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-[13px]">video_call</span>
                <span className="text-xs truncate max-w-[180px]">{String(tr.meet_url)}</span>
              </div>
            )}
            {tr.notes && (
              <p className="text-xs text-on-surface-variant/50 line-clamp-1 truncate max-w-[280px]">{String(tr.notes)}</p>
            )}
          </div>
        )}
        {compact && dur && <span className="text-[10px] text-on-surface-variant/40 mt-0.5 block">{dur}</span>}
      </div>

      {/* Actions */}
      <div className={`flex flex-col items-center justify-center gap-1 ${compact ? 'pr-2' : 'pr-4'} flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all`}>
        <button onClick={(e) => { e.stopPropagation(); onEdit(tr) }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-container/60 border border-outline-variant/20 text-on-surface-variant/40 hover:text-primary hover:border-primary/30 transition-all">
          <span className="material-symbols-outlined text-[14px]">edit</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(tr) }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-container/60 border border-outline-variant/20 text-on-surface-variant/40 hover:text-error hover:border-error/30 transition-all">
          <span className="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>
    </div>
  )
}

// ── DayGridView ──────────────────────────────────────────────────────────────
const HOUR_H   = 64  // px per hour
const PX_MIN   = HOUR_H / 60

function DayGridView({ termins, onDelete, onEdit }: {
  termins:  Termin[]
  onDelete: (tr: Termin) => void
  onEdit:   (tr: Termin) => void
}): JSX.Element {
  const timed  = termins.filter(tr => tr.time_start)
  const allDay = termins.filter(tr => !tr.time_start)
  const slots  = calcEventSlots(timed)

  const allMins = timed.flatMap(tr => {
    const s = String(tr.time_start)
    const e = String(tr.time_end ?? addHour(s))
    return [toMins(s), toMins(e)]
  })
  const clampStart = timed.length > 0 ? Math.max(0,  Math.min(Math.floor(Math.min(...allMins) / 60) - 1, 7))  : 7
  const clampEnd   = timed.length > 0 ? Math.min(24, Math.max(Math.ceil( Math.max(...allMins) / 60) + 1, 20)) : 20
  const hours = Array.from({ length: clampEnd - clampStart }, (_, i) => clampStart + i)
  const totalH     = hours.length * HOUR_H
  const startMins  = clampStart * 60

  return (
    <div className="flex flex-col h-full">
      {/* All-day row */}
      {allDay.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-outline-variant/20 flex-shrink-0">
          {allDay.map(tr => {
            const cfg = srcCfg(String(tr.source ?? 'manual'))
            return (
              <div key={tr.id as number}
                onDoubleClick={() => onEdit(tr)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-outline-variant/20 group cursor-pointer">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-sm text-on-surface">{String(tr.title ?? '')}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); onEdit(tr) }} className="text-on-surface-variant/40 hover:text-primary">
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); onDelete(tr) }} className="text-on-surface-variant/40 hover:text-error">
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: totalH }}>

          {/* Hour labels */}
          <div className="w-14 flex-shrink-0 relative select-none" style={{ height: totalH }}>
            {hours.map((h, i) => (
              <div key={h} className="absolute flex items-start justify-end pr-2 w-full"
                style={{ top: i * HOUR_H - 8, height: HOUR_H }}>
                <span className="text-[10px] text-on-surface-variant/40 font-medium mt-1">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Grid + events */}
          <div className="flex-1 relative" style={{ height: totalH }}>
            {/* Hour lines */}
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-4 border-t border-outline-variant/15"
                style={{ top: i * HOUR_H }} />
            ))}
            {/* Half-hour lines */}
            {hours.map((h, i) => (
              <div key={`h${h}`} className="absolute left-0 right-4 border-t border-outline-variant/8"
                style={{ top: i * HOUR_H + HOUR_H / 2, borderTopStyle: 'dashed' }} />
            ))}

            {/* Events */}
            {slots.map(({ tr, col, totalCols }) => {
              const start  = String(tr.time_start ?? '00:00')
              const end    = String(tr.time_end   ?? addHour(start))
              const top    = Math.max(0, (toMins(start) - startMins) * PX_MIN)
              const height = Math.max(28, (toMins(end) - toMins(start)) * PX_MIN)
              const cat    = String(tr.cat ?? '')
              const color  = cat ? catBorderColor(cat) : srcCfg(String(tr.source ?? 'manual')).hex
              const W      = 100 / totalCols
              return (
                <div key={tr.id as number}
                  onDoubleClick={() => onEdit(tr)}
                  className="absolute rounded-xl overflow-hidden cursor-pointer group transition-all hover:brightness-110"
                  style={{
                    top,
                    height,
                    left:       `calc(${col * W}% + 2px)`,
                    width:      `calc(${W}% - 6px)`,
                    borderLeft: `3px solid ${color}`,
                    background: `linear-gradient(160deg, ${color}a8 0%, ${color}80 50%, ${color}60 100%)`,
                    boxShadow:  `0 6px 22px ${color}35, 0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px ${color}55`,
                    zIndex:     col + 1,
                  }}>
                  <div className="flex flex-col h-full">
                    <div style={{ background: `linear-gradient(90deg, ${color}ff, ${color}99)`, height: '3px', flexShrink: 0 }} />
                    <div className="px-2 py-1 flex-1 flex flex-col justify-start overflow-hidden">
                      <span className="text-[18px] font-bold text-white leading-tight truncate" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{String(tr.title ?? '')}</span>
                      {height > 44 && (
                        <span className="text-[15px] text-white/75 mt-0.5 font-medium flex items-center gap-1.5 truncate">
                          <span className="whitespace-nowrap">{start} – {end}</span>
                          {tr.location && (
                            <>
                              <span className="text-white/40">·</span>
                              <span className="material-symbols-outlined text-[13px] text-white/55 flex-shrink-0">location_on</span>
                              <span className="truncate text-white/55">{String(tr.location)}</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity z-20">
                    <button onClick={e => { e.stopPropagation(); onEdit(tr) }}
                      className="w-5 h-5 rounded-full bg-surface-container/95 flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-[10px] text-on-surface-variant">edit</span>
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(tr) }}
                      className="w-5 h-5 rounded-full bg-surface-container/95 flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-[10px] text-error">delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── OverlapCluster ───────────────────────────────────────────────────────────
function OverlapCluster({ events, onDelete, onEdit }: {
  events: Termin[]
  onDelete: (tr: Termin) => void
  onEdit:   (tr: Termin) => void
}): JSX.Element {
  const slots = events.map(ev => {
    const start = String(ev.time_start ?? '00:00')
    const end   = String(ev.time_end   ?? addHour(start))
    const cat   = String(ev.cat    ?? '')
    const src   = String(ev.source ?? 'manual')
    const color = cat ? catBorderColor(cat) : srcCfg(src).hex
    return { start, end, cat, src, color }
  })
  const cStart = slots.reduce((a, s) => s.start < a ? s.start : a, slots[0].start)
  const cEnd   = slots.reduce((a, s) => s.end   > a ? s.end   : a, slots[0].end)
  const cDur   = Math.max(1, toMins(cEnd) - toMins(cStart))
  const dur    = duration(cStart, cEnd)
  const BAR_H  = 10  // px per event bar row

  return (
    <div className="rounded-2xl border border-outline-variant/20 overflow-hidden shadow-lg glass-card">

      {/* ── Cluster header with Gantt bars ── */}
      <div className="px-4 pt-3 pb-3 border-b border-outline-variant/15 bg-surface-container/30">

        {/* Header row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/50">schedule</span>
          <span className="text-xs font-semibold text-on-surface-variant/70">{cStart} – {cEnd}</span>
          {dur && <span className="text-xs text-on-surface-variant/40">({dur})</span>}
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/20 text-on-surface-variant/50 font-semibold uppercase tracking-wide">
            {events.length}× überlappend
          </span>
        </div>

        {/* Mini Gantt */}
        <div className="relative rounded-md overflow-hidden bg-surface-container-highest/20"
          style={{ height: `${events.length * BAR_H + 4}px` }}>
          {slots.map((s, i) => {
            const left  = ((toMins(s.start) - toMins(cStart)) / cDur) * 100
            const width = Math.max(2, ((toMins(s.end) - toMins(s.start)) / cDur) * 100)
            return (
              <div key={i}
                title={`${s.start} – ${s.end} · ${events[i].title ?? ''}`}
                style={{
                  left:       `${left}%`,
                  width:      `${width}%`,
                  top:        `${2 + i * BAR_H}px`,
                  height:     '8px',
                  background: `linear-gradient(90deg, ${s.color}ff 0%, ${s.color}cc 100%)`,
                  boxShadow:  `0 2px 10px ${s.color}70, 0 0 6px ${s.color}45, inset 0 1px 0 rgba(255,255,255,0.25)`,
                }}
                className="absolute rounded-full transition-all hover:brightness-125"
              />
            )
          })}
        </div>

        {/* Time labels */}
        <div className="flex gap-4 mt-2">
          {slots.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-on-surface-variant/60 font-medium whitespace-nowrap">
                {s.start} – {s.end}
              </span>
              <span className="text-[10px] text-on-surface-variant/40 truncate">
                {String(events[i].title ?? '').slice(0, 18)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Side-by-side cards ── */}
      <div className="flex divide-x divide-outline-variant/10">
        {events.map(tr => (
          <div key={tr.id as number} className="flex-1 min-w-0">
            <AgendaCard tr={tr} onDelete={onDelete} onEdit={onEdit} compact />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CalendarView ─────────────────────────────────────────────────────────────
export default function CalendarView(): JSX.Element {
  const { t } = useTranslation()
  const months   = t('cal.months',   { returnObjects: true }) as string[]
  const weekdays = t('cal.weekdays', { returnObjects: true }) as string[]

  const [month,         setMonth]         = useState(() => new Date())
  const [calEvents,     setCalEvents]     = useState<CalEvent[]>([])
  const [monthTermins,  setMonthTermins]  = useState<Termin[]>([])
  const [selectedDate,  setSelectedDate]  = useState<Date>(() => new Date())
  const [viewMode,      setViewMode]      = useState<ViewMode>('1M')
  const [intFrom,       setIntFrom]       = useState(() => isoDay(new Date()))
  const [intTo,         setIntTo]         = useState(() => isoDay(new Date()))
  const [viewTermins,   setViewTermins]   = useState<Termin[]>([])
  const [syncing,       setSyncing]       = useState(false)
  const [syncMsg,       setSyncMsg]       = useState('')
  const [calAuth,       setCalAuth]       = useState<{ configured: boolean; user: string } | null>(null)
  const [gcalAuth,      setGcalAuth]      = useState<{ configured: boolean; email: string } | null>(null)
  const [showNewModal,  setShowNewModal]  = useState(false)
  const [editingTermin, setEditingTermin] = useState<Termin | null>(null)
  const [catFilter,     setCatFilter]     = useState<string[]>([])
  const [srcFilter,    setSrcFilter]    = useState<string[]>([])
  const [caldavOpen,   setCaldavOpen]   = useState(false)
  const [gcalOpen,     setGcalOpen]     = useState(false)
  const [caldavUrl,    setCaldavUrl]    = useState('')
  const [caldavUser,   setCaldavUser]   = useState('')
  const [caldavPass,   setCaldavPass]   = useState('')
  const [caldavSaving, setCaldavSaving] = useState(false)
  const [gcalBusy,           setGcalBusy]           = useState(false)
  const [gcalError,          setGcalError]          = useState<string | null>(null)
  const [deleteSeriesTarget, setDeleteSeriesTarget] = useState<Termin | null>(null)
  const [deleteSeriesCount,  setDeleteSeriesCount]  = useState(0)
  const [deleteSeriesBusy,   setDeleteSeriesBusy]   = useState(false)
  const [deleteSeriesError,  setDeleteSeriesError]  = useState<string | null>(null)

  const today = new Date()

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadCalEvents = async (): Promise<void> => {
    const rows = await window.db.cal.list()
    setCalEvents(rows)
  }

  const loadMonthTermins = useCallback(async (): Promise<void> => {
    const rows = await window.db.termin.getByDateRange(isoDay(startOfMonth(month)), isoDay(endOfMonth(month)))
    setMonthTermins(rows)
  }, [month])

  const loadViewTermins = useCallback(async (): Promise<void> => {
    const { from, to } = getViewRange(viewMode, selectedDate, intFrom, intTo)
    const rows = await window.db.termin.getByDateRange(isoDay(from), isoDay(to))
    setViewTermins(rows)
  }, [viewMode, selectedDate, intFrom, intTo])

  useEffect(() => {
    window.db.cal.authStatus().then(setCalAuth)
    window.db.gcal.authStatus().then(setGcalAuth)
    loadCalEvents()
  }, [])
  useEffect(() => { loadMonthTermins() }, [loadMonthTermins])
  useEffect(() => { loadViewTermins()  }, [loadViewTermins])
  useEffect(() => {
    if (!caldavOpen) return
    Promise.all([
      window.db.settings.get('cal_caldav_url'),
      window.db.settings.get('cal_user'),
      window.db.settings.get('cal_password')
    ]).then(([url, user, pass]) => {
      setCaldavUrl((url as string | null) ?? '')
      setCaldavUser((user as string | null) ?? '')
      setCaldavPass((pass as string | null) ?? '')
    })
  }, [caldavOpen])

  // ── Derived ───────────────────────────────────────────────────────────────
  const days = useMemo(() => calDays(month), [month])

  const dotsByDay = useMemo(() => {
    const map = new Map<string, { color: string }[]>()
    const add = (d: string, color: string): void => {
      if (!map.has(d)) map.set(d, [])
      if (map.get(d)!.length < 3) map.get(d)!.push({ color })
    }
    // caldav events from TCalendar (gcal entries excluded — they are tracked via TTermin)
    for (const ev of calEvents) {
      if (String(ev.source ?? '') !== 'gcal') {
        add(isoDay(new Date(ev.dtstart as string)), calDotColor(ev))
      }
    }
    // all TTermin entries (manual + gcal) — single source of truth after deletion
    for (const tr of monthTermins) {
      add(String(tr.termin_date ?? ''), srcCfg(String(tr.source ?? 'manual')).dot)
    }
    return map
  }, [calEvents, monthTermins])

  const viewRange = useMemo(
    () => getViewRange(viewMode, selectedDate, intFrom, intTo),
    [viewMode, selectedDate, intFrom, intTo]
  )

  const cats = useMemo(() => {
    const s = new Set<string>()
    viewTermins.forEach(tr => { if (tr.cat) s.add(String(tr.cat)) })
    return [...s].sort()
  }, [viewTermins])

  const filteredTermins = useMemo(() => {
    let list = catFilter.length === 0 ? viewTermins : viewTermins.filter(tr => catFilter.includes(String(tr.cat ?? '')))
    if (srcFilter.length > 0) list = list.filter(tr => srcFilter.includes(String(tr.source ?? 'manual')))
    return list
  }, [viewTermins, catFilter, srcFilter])

  const groupedByDay = useMemo((): DayGroup[] => {
    const { from, to } = viewRange
    const showAllDays  = viewMode === '1W' || viewMode === '2W'
    const map          = new Map<string, DayGroup>()

    if (showAllDays) {
      const cur = new Date(from)
      while (cur <= to) {
        const key = isoDay(cur)
        map.set(key, { key, date: new Date(cur), allDay: [], timed: [] })
        cur.setDate(cur.getDate() + 1)
      }
    }

    for (const tr of filteredTermins) {
      const key = String(tr.termin_date ?? '')
      if (!map.has(key)) map.set(key, { key, date: new Date(key + 'T00:00:00'), allDay: [], timed: [] })
      const g = map.get(key)!
      if (tr.time_start) g.timed.push(tr); else g.allDay.push(tr)
    }

    for (const g of map.values()) {
      g.timed.sort((a, b) => String(a.time_start).localeCompare(String(b.time_start)))
    }

    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
  }, [filteredTermins, viewMode, viewRange])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSync = async (): Promise<void> => {
    setSyncing(true); setSyncMsg('')
    let count = 0
    const r1 = await window.db.cal.sync()
    if (!r1.error) count += r1.count
    if (gcalAuth?.configured) {
      const r2 = await window.db.gcal.sync()
      if (r2.error) { setSyncing(false); setSyncMsg(`Google Sync Fehler: ${r2.error}`); setTimeout(() => setSyncMsg(''), 8000); loadCalEvents(); loadMonthTermins(); loadViewTermins(); return }
      count += (r2.count ?? 0)
    }
    setSyncing(false)
    setSyncMsg(`${count} Termine synchronisiert`)
    loadCalEvents(); loadMonthTermins(); loadViewTermins()
    setTimeout(() => setSyncMsg(''), 4000)
  }

  const handleModalSave = async (data: Record<string, unknown>, opts?: SaveOpts): Promise<void> => {
    if (opts?.recurrence) {
      // FancyPlan-interne Serie anlegen
      await window.db.termin.createSeries(data, opts.recurrence as unknown as Record<string, unknown>)
    } else if (data.id) {
      const { id, ...fields } = data
      const recMaster = String(editingTermin?.rec_master ?? data.rec_master ?? '')
      const isGcalRow = String(editingTermin?.source ?? data.source ?? '') === 'gcal'
      if (opts?.scope === 'series' && recMaster.startsWith('local:') && !isGcalRow) {
        // Pure FancyPlan series — edit this occurrence and all following (no Google)
        const fromDate = String(data.termin_date ?? editingTermin?.termin_date)
        await window.db.termin.updateLocalSeriesFromDate(recMaster, fromDate, fields)
      } else if (opts?.scope === 'series' && recMaster !== '') {
        // Google series (real recurring or pushed FancyPlan series) — update all + propagate
        await window.db.termin.updateGcalSeries(recMaster, fields)
      } else {
        await window.db.termin.update(id as number, fields)
      }
    } else {
      await window.db.termin.create(data)
    }
    setEditingTermin(null)
    setShowNewModal(false)
    loadViewTermins(); loadMonthTermins()
  }

  function seriesPattern(tr: Termin): string {
    const uid = String(tr.cal_uid ?? '')
    if (!uid.startsWith('gcal:')) return uid
    const id = uid.slice(5)
    const m = id.match(/^(.+)_\d{8}T\d{6}Z?$/)
    return m ? `gcal:${m[1]}_%` : uid
  }

  const handleDelete = async (tr: Termin): Promise<void> => {
    const fromDate = String(tr.termin_date ?? isoDay(today))
    if (isGcalEvent(tr)) {
      let cnt = 0
      if (isGcalSeries(tr)) {
        cnt = await window.db.termin.countSeriesFromDate(seriesPattern(tr), fromDate)
      } else {
        cnt = await window.db.termin.countByTitleFromDate(String(tr.title ?? ''), fromDate)
      }
      setDeleteSeriesCount(cnt)
      setDeleteSeriesError(null)
      setDeleteSeriesTarget(tr)
    } else if (isLocalSeries(tr)) {
      const cnt = await window.db.termin.countLocalSeriesFromDate(String(tr.rec_master), fromDate)
      setDeleteSeriesCount(cnt)
      setDeleteSeriesError(null)
      setDeleteSeriesTarget(tr)
    } else {
      if (!confirm('Termin löschen?')) return
      await window.db.termin.delete(tr.id as number)
      setViewTermins(prev => prev.filter(t => (t.id as number) !== (tr.id as number)))
      setMonthTermins(prev => prev.filter(t => (t.id as number) !== (tr.id as number)))
    }
  }

  const confirmDeleteSingle = async (): Promise<void> => {
    if (!deleteSeriesTarget) return
    setDeleteSeriesBusy(true)
    setDeleteSeriesError(null)
    await window.db.termin.delete(deleteSeriesTarget.id as number)
    setDeleteSeriesBusy(false)
    setDeleteSeriesTarget(null)
    loadViewTermins(); loadMonthTermins(); loadCalEvents()
  }

  const confirmDeleteSeries = async (): Promise<void> => {
    if (!deleteSeriesTarget) return
    setDeleteSeriesBusy(true)
    setDeleteSeriesError(null)
    const fromDate = String(deleteSeriesTarget.termin_date ?? isoDay(today))
    let err: string | null = null
    if (isLocalSeries(deleteSeriesTarget)) {
      await window.db.termin.deleteLocalSeriesFromDate(String(deleteSeriesTarget.rec_master), fromDate)
    } else if (isGcalSeries(deleteSeriesTarget)) {
      const res = await window.db.termin.deleteSeriesFromDate(seriesPattern(deleteSeriesTarget), fromDate)
      if (res.gcalAction === 'failed') err = `Google: ${res.gcalError ?? 'Unbekannter Fehler'}`
    } else {
      const res = await window.db.termin.deleteByTitleFromDate(String(deleteSeriesTarget.title ?? ''), fromDate)
      if (res.gcalErrors?.length) err = `Google: ${res.gcalErrors.join(' | ')}`
    }
    setDeleteSeriesBusy(false)
    if (err) {
      setDeleteSeriesError(err)
    } else {
      setDeleteSeriesTarget(null)
    }
    loadViewTermins(); loadMonthTermins(); loadCalEvents()
  }

  const prevMonth = (): void => {
    const d = new Date(month.getFullYear(), month.getMonth() - 1, 1)
    setMonth(d); setSelectedDate(d)
  }
  const nextMonth = (): void => {
    const d = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    setMonth(d); setSelectedDate(d)
  }

  const handlePrev = (): void => {
    if (viewMode === 'INT') {
      const s = shiftInterval(intFrom, intTo, -1); setIntFrom(s.from); setIntTo(s.to)
    } else {
      const d = shiftSel(viewMode, selectedDate, -1); setSelectedDate(d); setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }
  const handleNext = (): void => {
    if (viewMode === 'INT') {
      const s = shiftInterval(intFrom, intTo, 1); setIntFrom(s.from); setIntTo(s.to)
    } else {
      const d = shiftSel(viewMode, selectedDate, 1); setSelectedDate(d); setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }
  const handleToday = (): void => {
    setSelectedDate(today); setMonth(today); setViewMode('1T')
    if (viewMode === 'INT') { setIntFrom(isoDay(today)); setIntTo(isoDay(today)) }
  }

  const syncConfigured = calAuth?.configured || gcalAuth?.configured
  const todayKey       = isoDay(today)
  const todayInRange   = todayKey >= isoDay(viewRange.from) && todayKey <= isoDay(viewRange.to)
  const rangeTitle     = viewMode === 'INT'
    ? (intFrom && intTo ? viewRangeTitle('INT', new Date(intFrom + 'T00:00:00'), new Date(intTo + 'T00:00:00')) : 'Intervall wählen')
    : viewRangeTitle(viewMode, viewRange.from, viewRange.to)

  const inpDate = 'text-sm bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface [&::-webkit-calendar-picker-indicator]:[filter:invert(0.7)] [&::-webkit-calendar-picker-indicator]:cursor-pointer'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-background overflow-hidden">

      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-outline-variant/20 bg-surface-container-low/30 overflow-y-auto">

        {/* Month header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-on-surface">
              {months[month.getMonth()]} {month.getFullYear()}
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant/60 transition-colors">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant/60 transition-colors">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 mb-1">
            {weekdays.map((wd) => (
              <div key={wd} className="text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/40 pb-1 select-none">
                {wd.slice(0, 2)}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((day, i) => {
              const key        = isoDay(day)
              const isDayToday = sameDay(day, today)
              const isSelected = sameDay(day, selectedDate)
              const isCurMonth = day.getMonth() === month.getMonth()
              const isInRange  = (viewMode === '1W' || viewMode === '2W') &&
                                 key >= isoDay(viewRange.from) && key <= isoDay(viewRange.to)
              const dots       = dotsByDay.get(key) ?? []

              return (
                <div key={i}
                  onClick={() => { setSelectedDate(day); setMonth(new Date(day.getFullYear(), day.getMonth(), 1)) }}
                  onDoubleClick={() => { setSelectedDate(day); setMonth(new Date(day.getFullYear(), day.getMonth(), 1)); setViewMode('1T') }}
                  className={[
                    'aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors relative select-none',
                    !isCurMonth ? 'opacity-20' : '',
                    isInRange   && !isDayToday ? 'bg-primary/10' : '',
                    isSelected  && !isDayToday && !isInRange ? 'bg-primary/20' : '',
                    !isSelected && !isDayToday && !isInRange ? 'hover:bg-surface-container-high/60' : ''
                  ].join(' ')}>
                  <span className={[
                    'text-xs font-medium leading-tight',
                    isDayToday ? 'w-6 h-6 flex items-center justify-center rounded-full bg-primary text-on-primary font-bold shadow-sm shadow-primary/40' :
                    isSelected ? 'text-primary font-semibold' :
                    isInRange  ? 'text-primary/80' :
                                 'text-on-surface'
                  ].join(' ')}>
                    {day.getDate()}
                  </span>
                  {dots.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.map((d, j) => (
                        <span key={j} className={`w-1 h-1 rounded-full ${d.color}`} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* QUELLEN */}
        <div className="px-6 py-4 border-t border-outline-variant/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">Quellen</p>
            {srcFilter.length > 0 && (
              <button onClick={() => setSrcFilter([])} className="text-[10px] text-primary hover:underline">Alle</button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">

            {/* Manuell */}
            {(() => {
              const src = 'manual'; const c = srcCfg(src)
              const on = srcFilter.length === 0 || srcFilter.includes(src)
              return (
                <button onClick={() => setSrcFilter(prev =>
                  prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
                )}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-lg w-full text-left transition-colors
                    ${srcFilter.length > 0 && srcFilter.includes(src) ? 'bg-surface-container-high' : 'hover:bg-surface-container-high/50'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${on ? c.dot : 'bg-on-surface-variant/20'}`} />
                  <span className={`text-sm flex-1 ${on ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>{c.label}</span>
                  {srcFilter.includes(src) && <span className={`material-symbols-outlined text-[14px] ${c.badge}`}>check</span>}
                </button>
              )
            })()}

            {/* CalDAV */}
            {(() => {
              const src = 'caldav'; const c = srcCfg(src)
              const configured = !!calAuth?.configured
              const on = srcFilter.length === 0 || srcFilter.includes(src)
              return (
                <div>
                  <div className={`flex items-center gap-1 rounded-lg ${!configured ? 'opacity-60' : ''}`}>
                    <button onClick={() => configured && setSrcFilter(prev =>
                      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
                    )}
                      className={`flex items-center gap-3 px-2 py-1.5 flex-1 text-left rounded-lg transition-colors
                        ${srcFilter.length > 0 && srcFilter.includes(src) ? 'bg-surface-container-high' : 'hover:bg-surface-container-high/50'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${on && configured ? c.dot : 'bg-on-surface-variant/20'}`} />
                      <span className={`text-sm flex-1 ${on && configured ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>{c.label}</span>
                      {srcFilter.includes(src) && <span className={`material-symbols-outlined text-[14px] ${c.badge}`}>check</span>}
                    </button>
                    <button onClick={() => setCaldavOpen(o => !o)} title="Konfigurieren"
                      className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors
                        ${caldavOpen ? 'bg-surface-container-highest text-on-surface-variant' : 'text-on-surface-variant/30 hover:text-on-surface-variant hover:bg-surface-container-high/50'}`}>
                      <span className="material-symbols-outlined text-[15px]">settings</span>
                    </button>
                  </div>
                  {caldavOpen && (
                    <div className="mx-2 mt-1 mb-1 p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 flex flex-col gap-2">
                      {configured && <p className="text-[10px] text-secondary-fixed-dim font-semibold">Verbunden: {calAuth?.user}</p>}
                      <input placeholder="CalDAV URL" value={caldavUrl} onChange={e => setCaldavUrl(e.target.value)}
                        className="text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2 py-1.5 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/40 w-full" />
                      <input placeholder="Benutzername" value={caldavUser} onChange={e => setCaldavUser(e.target.value)}
                        className="text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2 py-1.5 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/40 w-full" />
                      <input type="password" placeholder="Passwort" value={caldavPass} onChange={e => setCaldavPass(e.target.value)}
                        className="text-xs bg-surface-container-high border border-outline-variant/30 rounded-lg px-2 py-1.5 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/40 w-full" />
                      <button disabled={caldavSaving} onClick={async () => {
                        setCaldavSaving(true)
                        await window.db.settings.set('cal_caldav_url', caldavUrl || null)
                        await window.db.settings.set('cal_user', caldavUser || null)
                        await window.db.settings.set('cal_password', caldavPass || null)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        window.db.cal.authStatus().then((s: any) => setCalAuth(s))
                        setCaldavSaving(false)
                        setCaldavOpen(false)
                      }} className="text-xs py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-semibold transition-colors disabled:opacity-40 w-full">
                        {caldavSaving ? 'Speichert…' : 'Speichern'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Google */}
            {(() => {
              const src = 'gcal'; const c = srcCfg(src)
              const configured = !!gcalAuth?.configured
              const on = srcFilter.length === 0 || srcFilter.includes(src)
              return (
                <div>
                  <div className={`flex items-center gap-1 rounded-lg ${!configured ? 'opacity-60' : ''}`}>
                    <button onClick={() => configured && setSrcFilter(prev =>
                      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
                    )}
                      className={`flex items-center gap-3 px-2 py-1.5 flex-1 text-left rounded-lg transition-colors
                        ${srcFilter.length > 0 && srcFilter.includes(src) ? 'bg-surface-container-high' : 'hover:bg-surface-container-high/50'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${on && configured ? c.dot : 'bg-on-surface-variant/20'}`} />
                      <span className={`text-sm flex-1 ${on && configured ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>{c.label}</span>
                      {srcFilter.includes(src) && <span className={`material-symbols-outlined text-[14px] ${c.badge}`}>check</span>}
                    </button>
                    <button onClick={() => setGcalOpen(o => !o)} title="Konfigurieren"
                      className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors
                        ${gcalOpen ? 'bg-surface-container-highest text-on-surface-variant' : 'text-on-surface-variant/30 hover:text-on-surface-variant hover:bg-surface-container-high/50'}`}>
                      <span className="material-symbols-outlined text-[15px]">settings</span>
                    </button>
                  </div>
                  {gcalOpen && (
                    <div className="mx-2 mt-1 mb-1 p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 flex flex-col gap-2">
                      {configured ? (
                        <>
                          <p className="text-[10px] text-tertiary font-semibold">{gcalAuth?.email}</p>
                          <button disabled={gcalBusy} onClick={async () => {
                            setGcalBusy(true)
                            await window.db.gcal.disconnect()
                            setGcalAuth({ configured: false, email: '' })
                            setGcalBusy(false)
                            setGcalOpen(false)
                          }} className="text-xs py-1.5 bg-error/15 hover:bg-error/25 text-error rounded-lg font-semibold transition-colors disabled:opacity-40 w-full">
                            {gcalBusy ? 'Trennt…' : 'Trennen'}
                          </button>

                        </>
                      ) : (
                        <>
                          <button disabled={gcalBusy} onClick={async () => {
                            setGcalBusy(true)
                            setGcalError(null)
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const res = await window.db.gcal.connect() as any
                            if (res.ok) {
                              setGcalAuth({ configured: true, email: res.email ?? '' })
                              setGcalOpen(false)
                              const r2 = await window.db.gcal.sync()
                              if (!r2.error) { loadCalEvents(); loadMonthTermins(); loadViewTermins() }
                              else setGcalError(`Sync-Fehler: ${r2.error}`)
                            } else {
                              setGcalError(res.error ?? 'Verbindung fehlgeschlagen')
                            }
                            setGcalBusy(false)
                          }} className="text-xs py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-semibold transition-colors disabled:opacity-40 w-full">
                            {gcalBusy ? 'Verbindet…' : 'Mit Google verbinden'}
                          </button>
                          {gcalError && (
                            <p className="text-[10px] text-error leading-tight mt-1 break-all">{gcalError}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

          </div>
        </div>

        {/* Category filter */}
        {cats.length > 0 && (
          <div className="px-6 py-4 border-t border-outline-variant/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">Kategorien</p>
              {catFilter.length > 0 && (
                <button onClick={() => setCatFilter([])}
                  className="text-[10px] text-primary hover:underline">Alle</button>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {cats.map(cat => {
                const active = catFilter.includes(cat)
                const color  = catBorderColor(cat)
                return (
                  <button key={cat}
                    onClick={() => setCatFilter(prev => active ? prev.filter(c => c !== cat) : [...prev, cat])}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors text-left ${active ? 'bg-surface-container-high' : 'hover:bg-surface-container-high/50'}`}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-on-surface flex-1 truncate">{cat}</span>
                    {active && <span className="material-symbols-outlined text-[14px] flex-shrink-0" style={{ color }}>check</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Sync / config */}
        <div className="px-6 pb-6 mt-auto pt-4 border-t border-outline-variant/20">
          {syncConfigured ? (
            <div className="glass-card rounded-2xl p-4 border border-outline-variant/10 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse flex-shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                  {gcalAuth?.configured ? 'GOOGLE + CALDAV' : 'CALDAV'}
                </span>
              </div>
              {syncMsg
                ? <p className="text-xs text-secondary-fixed-dim mb-3">{syncMsg}</p>
                : <p className="text-xs text-on-surface-variant/50 mb-3">Kalender synchronisiert</p>
              }
              <button onClick={handleSync} disabled={syncing}
                className="w-full py-2 bg-surface-container-high/60 border border-outline-variant/20 rounded-xl text-xs font-semibold uppercase tracking-wide text-on-surface-variant hover:bg-surface-container-highest disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                <span className={`material-symbols-outlined text-[14px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
                {syncing ? 'Synchronisiert…' : 'Sync'}
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-4 border border-outline-variant/10 relative overflow-hidden">
              <p className="text-xs text-on-surface-variant/50 mb-3">{t('cal.configHint')}</p>
              <div className="absolute -right-2 -bottom-2 opacity-8">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">calendar_month</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-background to-surface-container-low/40">

        {/* Header */}
        <div className="px-8 pt-6 pb-4 flex-shrink-0 border-b border-outline-variant/10">

          {/* Row 1: title + nav + new button */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-bold text-on-surface">{rangeTitle}</h2>
                {todayInRange && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20">
                    Heute
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant/60 mt-0.5">
                {filteredTermins.length === 0
                  ? 'Keine Termine'
                  : `${filteredTermins.length} ${filteredTermins.length === 1 ? 'Termin' : 'Termine'}${catFilter.length > 0 || srcFilter.length > 0 ? ' (gefiltert)' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-surface-container rounded-xl border border-outline-variant/20 p-1">
                <button onClick={handlePrev}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant/60 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button onClick={handleToday}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg uppercase tracking-wide transition-colors ${todayInRange ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  Heute
                </button>
                <button onClick={handleNext}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant/60 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
              <button onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-[16px]">add</span>
                {t('cal.addEvent')}
              </button>
            </div>
          </div>

          {/* Row 2: view mode tabs + INT date pickers */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-surface-container rounded-xl border border-outline-variant/20 p-1">
              {VIEW_BTNS.map(({ mode, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg uppercase tracking-wide transition-colors whitespace-nowrap
                    ${viewMode === mode ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {label}
                </button>
              ))}
            </div>
            {viewMode === 'INT' && (
              <div className="flex items-center gap-2">
                <input type="date" value={intFrom} onChange={e => setIntFrom(e.target.value)} className={inpDate} />
                <span className="text-on-surface-variant/50 text-sm">–</span>
                <input type="date" value={intTo}   onChange={e => setIntTo(e.target.value)}   className={inpDate} />
              </div>
            )}
          </div>
        </div>

        {/* Agenda content */}
        <div className={`flex-1 overflow-hidden ${viewMode !== '1T' ? 'overflow-y-auto px-8 py-6' : ''}`}>
          {viewMode === '1T' ? (
            filteredTermins.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-40">
                <span className="material-symbols-outlined text-[52px] text-on-surface-variant/30">event_available</span>
                <div className="text-center">
                  <p className="text-base font-medium text-on-surface-variant/60">Keine Termine</p>
                  <p className="text-sm text-on-surface-variant/40 mt-1">Klicke auf „+ Termin" um einen anzulegen</p>
                </div>
              </div>
            ) : (
              <DayGridView termins={filteredTermins} onDelete={handleDelete} onEdit={setEditingTermin} />
            )
          ) : groupedByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-40">
              <span className="material-symbols-outlined text-[52px] text-on-surface-variant/30">event_available</span>
              <div className="text-center">
                <p className="text-base font-medium text-on-surface-variant/60">Keine Termine</p>
                <p className="text-sm text-on-surface-variant/40 mt-1">Klicke auf „+ Termin" um einen anzulegen</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {groupedByDay.map(group => {
                const isDayToday = sameDay(group.date, today)
                const dayLabel   = group.date.toLocaleDateString('de', { weekday: 'long', day: '2-digit', month: 'long' })
                const hasEvents  = group.allDay.length + group.timed.length > 0

                return (
                  <div key={group.key}>
                    {/* Day header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex items-center gap-2 ${isDayToday ? 'text-primary' : 'text-on-surface-variant/70'}`}>
                        {isDayToday && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        <span className="text-sm font-semibold">{dayLabel}</span>
                        {isDayToday && <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">Heute</span>}
                      </div>
                      <div className="flex-1 h-px bg-outline-variant/20" />
                      {hasEvents && (
                        <span className="text-xs text-on-surface-variant/40">
                          {group.allDay.length + group.timed.length} {group.allDay.length + group.timed.length === 1 ? 'Termin' : 'Termine'}
                        </span>
                      )}
                    </div>

                    {/* All-day chips */}
                    {group.allDay.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {group.allDay.map(tr => {
                          const cfg = srcCfg(String(tr.source ?? 'manual'))
                          return (
                            <div key={tr.id as number}
                              onDoubleClick={() => setEditingTermin(tr)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-outline-variant/20 group cursor-pointer">
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              <span className="text-sm text-on-surface">{String(tr.title ?? '')}</span>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                <button onClick={e => { e.stopPropagation(); setEditingTermin(tr) }}
                                  className="text-on-surface-variant/40 hover:text-primary">
                                  <span className="material-symbols-outlined text-[13px]">edit</span>
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleDelete(tr) }}
                                  className="text-on-surface-variant/40 hover:text-error">
                                  <span className="material-symbols-outlined text-[13px]">close</span>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Timed events with overlap detection */}
                    {group.timed.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {groupOverlapping(group.timed).map((cluster, ci) =>
                          cluster.length === 1 ? (
                            <AgendaCard key={cluster[0].id as number} tr={cluster[0]} onDelete={handleDelete} onEdit={setEditingTermin} />
                          ) : (
                            <OverlapCluster key={ci} events={cluster} onDelete={handleDelete} onEdit={setEditingTermin} />
                          )
                        )}
                      </div>
                    )}

                    {/* Empty day placeholder (1W / 2W only) */}
                    {!hasEvents && (
                      <p className="text-xs text-on-surface-variant/30 italic ml-1">Keine Termine</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <TerminModal date={selectedDate} onSave={handleModalSave} onClose={() => setShowNewModal(false)} />
      )}
      {editingTermin && (
        <TerminModal
          date={new Date(String(editingTermin.termin_date))}
          termin={editingTermin}
          onSave={handleModalSave}
          onClose={() => setEditingTermin(null)}
        />
      )}

      {/* Delete-Series Confirmation Overlay */}
      {deleteSeriesTarget && (() => {
        const isOwner = Number(deleteSeriesTarget.is_owner ?? 1) === 1
        const isLocal = isLocalSeries(deleteSeriesTarget)
        const closeModal = (): void => { setDeleteSeriesTarget(null); setDeleteSeriesError(null) }
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card rounded-2xl border border-outline-variant/20 p-6 w-[360px] flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-error text-[22px]">delete</span>
              <h3 className="text-base font-semibold text-on-surface">Termin löschen</h3>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-on-surface font-medium truncate">
                {String(deleteSeriesTarget.title ?? '')}
              </p>
              <p className="text-xs text-on-surface-variant/60">
                {String(deleteSeriesTarget.time_start ?? '')}
                {deleteSeriesTarget.time_end ? ` – ${String(deleteSeriesTarget.time_end)}` : ''}
              </p>
            </div>
            <p className="text-xs text-on-surface-variant/50 -mt-1">
              {isLocal
                ? 'FancyPlan-Termin (intern) – die Serie wird nur lokal gelöscht.'
                : isOwner
                  ? 'Google-Termin (Du bist Ersteller) – Änderungen werden auch in Google Calendar übernommen.'
                  : 'Google-Termin (geteilt von einem anderen Konto) – nur lokal entfernen; Google bleibt unberührt.'}
            </p>
            {deleteSeriesError && (
              <p className="text-xs text-error leading-tight break-all bg-error/10 rounded-lg px-3 py-2">
                {deleteSeriesError}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={closeModal} disabled={deleteSeriesBusy}
                className="w-full py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-sm hover:bg-surface-container-high transition-colors disabled:opacity-40">
                Abbrechen
              </button>
              <button onClick={confirmDeleteSingle} disabled={deleteSeriesBusy}
                className="w-full py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface text-sm transition-colors disabled:opacity-40">
                {deleteSeriesBusy ? 'Löscht…' : 'Nur diesen Termin löschen'}
              </button>
              <button onClick={confirmDeleteSeries} disabled={deleteSeriesBusy}
                className="w-full py-2 rounded-xl bg-error/20 hover:bg-error/35 text-error font-semibold text-sm transition-colors disabled:opacity-40">
                {deleteSeriesBusy ? 'Löscht…' : `Ganze Serie ab diesem Termin löschen (${deleteSeriesCount})`}
              </button>
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}

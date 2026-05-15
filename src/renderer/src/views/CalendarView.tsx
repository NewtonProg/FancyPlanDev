import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type CalEvent = Record<string, unknown>

function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function isoDay(d: Date): string { return d.toISOString().slice(0, 10) }

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function calDays(month: Date): Date[] {
  const first = startOfMonth(month)
  const last = endOfMonth(month)
  const startWd = (first.getDay() + 6) % 7
  const days: Date[] = []
  for (let i = -startWd; i <= last.getDate() - 1 + (6 - (last.getDay() + 6) % 7); i++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), 1 + i))
  }
  return days
}

function fmtTime(iso: string, allDay: unknown, allDayLabel: string): string {
  if (Number(allDay)) return allDayLabel
  const d = new Date(iso)
  return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })
}

function eventColor(ev: CalEvent): string {
  const s = String(ev.status ?? '').toLowerCase()
  if (s === 'cancelled') return 'bg-red-100 text-red-600'
  if (s === 'tentative') return 'bg-yellow-100 text-yellow-700'
  return 'bg-blue-100 text-blue-700'
}

function NewEventModal({ date, onSave, onClose }: {
  date: Date
  onSave: (data: { summary: string; dtstart: string; dtend: string; description?: string; location?: string; allDay: boolean }) => Promise<void>
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [summary, setSummary] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [timeStart, setTimeStart] = useState('09:00')
  const [timeEnd, setTimeEnd] = useState('10:00')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (): Promise<void> => {
    if (!summary.trim()) return
    setSaving(true)
    const dayStr = isoDay(date)
    const dtstart = allDay ? `${dayStr}T00:00:00` : `${dayStr}T${timeStart}:00`
    const dtend = allDay ? `${dayStr}T23:59:59` : `${dayStr}T${timeEnd}:00`
    await onSave({ summary: summary.trim(), dtstart, dtend, description: description || undefined, location: location || undefined, allDay })
    setSaving(false)
  }

  const inp = 'w-full text-sm border border-outline-variant rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/40 shadow-2xl w-96 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/40">
          <span className="text-sm font-semibold text-on-surface">{t('cal.newEvent')}</span>
          <button onClick={onClose} className="text-on-surface-variant/60 hover:text-on-surface text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className="text-xs text-on-surface-variant/60 mb-1 block">{t('cal.titleLabel')}</label>
            <input className={inp} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={t('cal.titlePh')} autoFocus />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant/60 mb-1 block">{t('cal.dateLabel')}</label>
            <p className="text-sm text-on-surface px-3 py-1.5 bg-surface-container-low rounded-lg">
              {date.toLocaleDateString('de', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            {t('cal.allDay')}
          </label>
          {!allDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-on-surface-variant/60 mb-1 block">{t('cal.fromLabel')}</label>
                <input type="time" className={inp} value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-on-surface-variant/60 mb-1 block">{t('cal.toLabel')}</label>
                <input type="time" className={inp} value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-on-surface-variant/60 mb-1 block">{t('cal.locationLabel')}</label>
            <input className={inp} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('cal.locationPh')} />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant/60 mb-1 block">{t('cal.noteLabel')}</label>
            <textarea className={`${inp} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('cal.notePh')} />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-3 border-t border-outline-variant/40">
          <button onClick={handleSave} disabled={saving || !summary.trim()}
            className="flex-1 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-blue-600 disabled:opacity-40">
            {saving ? t('cal.saving') : t('cal.create')}
          </button>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high">
            {t('cal.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarView(): JSX.Element {
  const { t } = useTranslation()
  const months = t('cal.months', { returnObjects: true }) as string[]
  const weekdays = t('cal.weekdays', { returnObjects: true }) as string[]

  const [month, setMonth] = useState(() => new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [authStatus, setAuthStatus] = useState<{ configured: boolean; user: string } | null>(null)
  const [newEventDate, setNewEventDate] = useState<Date | null>(null)

  const today = new Date()

  useEffect(() => {
    window.db.cal.authStatus().then(setAuthStatus)
    loadEvents()
  }, [])

  const loadEvents = async (): Promise<void> => {
    const rows = await window.db.cal.list()
    setEvents(rows)
  }

  const days = useMemo(() => calDays(month), [month])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>()
    for (const ev of events) {
      const d = isoDay(new Date(ev.dtstart as string))
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(ev)
    }
    return map
  }, [events])

  const dayEvents = useMemo(() =>
    events.filter((ev) => sameDay(new Date(ev.dtstart as string), selectedDate))
      .sort((a, b) => String(a.dtstart).localeCompare(String(b.dtstart))),
    [events, selectedDate]
  )

  const handleSync = async (): Promise<void> => {
    setSyncing(true); setSyncMsg('')
    const r = await window.db.cal.sync()
    setSyncing(false)
    setSyncMsg(r.error ? t('common.error', { msg: r.error }) : t('cal.eventsMany', { count: r.count }))
    loadEvents()
    setTimeout(() => setSyncMsg(''), 5000)
  }

  const handleNewEvent = async (data: Parameters<typeof window.db.cal.create>[0]): Promise<void> => {
    await window.db.cal.create(data)
    setNewEventDate(null)
    loadEvents()
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm(t('cal.deleteConfirm'))) return
    await window.db.cal.delete(id)
    loadEvents()
  }

  const prevMonth = (): void => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = (): void => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  const eventsLabel = (count: number): string =>
    count === 1 ? t('cal.eventsOne', { count }) : t('cal.eventsMany', { count })

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-on-surface-variant text-sm">‹</button>
            <span className="text-base font-semibold text-on-surface w-40 text-center">
              {months[month.getMonth()]} {month.getFullYear()}
            </span>
            <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-on-surface-variant text-sm">›</button>
            <button onClick={() => { setMonth(new Date()); setSelectedDate(new Date()) }}
              className="ml-1 px-2.5 py-1 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high">
              {t('cal.today')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {syncMsg && <span className="text-xs text-on-surface-variant/60">{syncMsg}</span>}
            {authStatus?.configured && (
              <button onClick={handleSync} disabled={syncing}
                className="px-3 py-1 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40">
                {syncing ? t('cal.syncing') : t('cal.sync')}
              </button>
            )}
            <button onClick={() => setNewEventDate(selectedDate)}
              className="px-3 py-1 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600">
              {t('cal.addEvent')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-outline-variant/40 flex-shrink-0">
          {weekdays.map((wd) => (
            <div key={wd} className="py-2 text-center text-xs font-medium text-on-surface-variant/60">{wd}</div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const key = isoDay(day)
              const isToday = sameDay(day, today)
              const isSelected = sameDay(day, selectedDate)
              const isCurrentMonth = day.getMonth() === month.getMonth()
              const dayEvs = eventsByDay.get(key) ?? []

              return (
                <div key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] p-1.5 border-b border-r border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors ${!isCurrentMonth ? 'opacity-30' : ''} ${isSelected ? 'bg-primary/5' : ''}`}>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs mb-1 ${isToday ? 'bg-primary text-on-primary font-semibold' : isSelected ? 'font-semibold text-primary' : 'text-on-surface'}`}>
                    {day.getDate()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvs.slice(0, 2).map((ev, j) => (
                      <div key={j} className={`text-xs px-1 py-0.5 rounded truncate ${eventColor(ev)}`}>
                        {String(ev.summary ?? '')}
                      </div>
                    ))}
                    {dayEvs.length > 2 && (
                      <span className="text-xs text-on-surface-variant/60 pl-1">+{dayEvs.length - 2}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {!authStatus?.configured && (
          <div className="px-5 py-2 border-t border-outline-variant/40 text-xs text-on-surface-variant/60 text-center">
            {t('cal.configHint')}
          </div>
        )}
      </div>

      <div className="w-72 flex-shrink-0 flex flex-col border-l border-outline-variant/40">
        <div className="px-4 py-3 border-b border-outline-variant/40 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-on-surface">
              {selectedDate.toLocaleDateString('de', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
            <p className="text-xs text-on-surface-variant/60">{eventsLabel(dayEvents.length)}</p>
          </div>
          <button onClick={() => setNewEventDate(selectedDate)}
            className="text-primary text-lg leading-none hover:text-blue-600" title={t('cal.newEvent')}>+</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {dayEvents.length === 0 ? (
            <p className="text-xs text-on-surface-variant/60 text-center mt-4">{t('cal.noEvents')}</p>
          ) : dayEvents.map((ev) => (
            <div key={ev.id as number} className="glass-card rounded-xl p-3">
              <div className="flex items-start justify-between gap-1 mb-1">
                <p className="text-sm font-medium text-on-surface flex-1">{String(ev.summary ?? '')}</p>
                <button onClick={() => handleDelete(ev.id as number)}
                  className="text-xs text-on-surface-variant/40 hover:text-error flex-shrink-0">✕</button>
              </div>
              <p className="text-xs text-on-surface-variant/60">{fmtTime(ev.dtstart as string, ev.all_day, t('cal.allDay'))}</p>
              {ev.location && <p className="text-xs text-on-surface-variant/60 truncate">📍 {String(ev.location)}</p>}
              {ev.description && <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{String(ev.description)}</p>}
            </div>
          ))}
        </div>
      </div>

      {newEventDate && (
        <NewEventModal date={newEventDate} onSave={handleNewEvent} onClose={() => setNewEventDate(null)} />
      )}
    </div>
  )
}

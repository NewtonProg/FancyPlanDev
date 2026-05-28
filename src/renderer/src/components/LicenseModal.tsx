import { useState, useEffect } from 'react'

type LicenseInfo = {
  key: string | null
  tier: string
  trialDays: number
  trialExpired: boolean
  validatedAt: string | null
}

type Props = {
  onClose?: () => void
  onActivated?: () => void
  forceOpen?: boolean
}

const TIER_LABEL: Record<string, string> = { free: 'Free (Trial)', standard: 'Standard', vip: 'VIP' }

export function LicenseModal({ onClose, onActivated, forceOpen }: Props): JSX.Element {
  const [info, setInfo] = useState<LicenseInfo | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [activating, setActivating] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'error'>('ok')

  const reload = () => window.db.license.get().then(setInfo)

  useEffect(() => { reload() }, [])

  const handleActivate = async (): Promise<void> => {
    if (!keyInput.trim()) return
    setActivating(true)
    setMsg('')
    const r = await window.db.license.activate(keyInput)
    setActivating(false)
    if (r.ok) {
      setMsgType('ok')
      setMsg(`Lizenz aktiviert — Tier: ${TIER_LABEL[r.tier ?? 'standard'] ?? r.tier}`)
      await reload()
      setTimeout(() => { onActivated?.(); onClose?.() }, 1500)
    } else {
      setMsgType('error')
      setMsg(r.error ?? 'Aktivierung fehlgeschlagen')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface-container rounded-apple shadow-apple-lg w-[440px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-on-surface">Lizenz</h2>
          {!forceOpen && onClose && (
            <button onClick={onClose} className="text-on-surface-variant/60 hover:text-on-surface text-lg leading-none">✕</button>
          )}
        </div>

        {info && (
          <div className="mb-4 p-3 rounded-lg bg-surface-container-high text-sm text-on-surface-variant space-y-1">
            <div className="flex justify-between">
              <span>Lizenz-Tier</span>
              <span className={`font-medium ${info.tier === 'vip' ? 'text-primary' : info.tier === 'standard' ? 'text-secondary-fixed-dim' : 'text-on-surface-variant'}`}>
                {TIER_LABEL[info.tier] ?? info.tier}
              </span>
            </div>
            {info.key ? (
              <div className="flex justify-between">
                <span>Schlüssel</span>
                <span className="font-mono text-xs tracking-wider">{info.key}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span>Trial-Periode</span>
                <span className={info.trialExpired ? 'text-error font-medium' : ''}>
                  {info.trialExpired ? 'Abgelaufen' : `${info.trialDays} / 60 Tage`}
                </span>
              </div>
            )}
            {info.validatedAt && (
              <div className="flex justify-between">
                <span>Zuletzt geprüft</span>
                <span className="text-xs">{new Date(info.validatedAt).toLocaleDateString('de')}</span>
              </div>
            )}
          </div>
        )}

        {info?.trialExpired && (
          <p className="text-xs text-error mb-3 leading-relaxed">
            Die 60-tägige Trial-Periode ist abgelaufen. Bitte einen Lizenzschlüssel eingeben um die App weiterzunutzen.
          </p>
        )}

        <div className="mb-4">
          <label className="text-xs text-on-surface-variant mb-1.5 block">Lizenzschlüssel eingeben</label>
          <input
            className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono tracking-wider bg-surface-container"
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleActivate() }}
            autoFocus
          />
        </div>

        {msg && (
          <p className={`text-xs mb-3 ${msgType === 'error' ? 'text-error' : 'text-secondary-fixed-dim'}`}>{msg}</p>
        )}

        <div className="flex justify-between items-center">
          <a
            href="https://inprime.net/fancyplan/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Lizenz kaufen →
          </a>
          <div className="flex gap-2">
            {!forceOpen && onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
              >
                Schließen
              </button>
            )}
            <button
              onClick={handleActivate}
              disabled={activating || !keyInput.trim()}
              className="px-4 py-1.5 text-xs rounded-lg bg-primary text-on-primary hover:bg-blue-600 disabled:opacity-40"
            >
              {activating ? 'Wird aktiviert…' : 'Aktivieren'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

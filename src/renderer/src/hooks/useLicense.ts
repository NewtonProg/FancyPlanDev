import { useState, useEffect } from 'react'

export type LicenseTier = 'free' | 'standard' | 'vip'

export function useLicense() {
  const [tier, setTier] = useState<LicenseTier>('free')
  const [trialDays, setTrialDays] = useState(0)
  const [trialExpired, setTrialExpired] = useState(false)
  const [loading, setLoading] = useState(true)

  const reload = () => {
    window.db.license.get().then((info) => {
      const t = (info.tier === 'standard' || info.tier === 'vip') ? info.tier : 'free'
      setTier(t)
      setTrialDays(info.trialDays)
      setTrialExpired(info.trialExpired)
      setLoading(false)
    })
  }

  useEffect(() => {
    reload()
    // Silent background validation on startup
    window.db.license.validate().then(() => reload())
  }, [])

  return {
    tier,
    loading,
    trialDays,
    trialExpired,
    isVip:      tier === 'vip',
    isStandard: tier === 'standard' || tier === 'vip',
    reload
  }
}

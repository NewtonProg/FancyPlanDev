import { useState, useEffect } from 'react'

export type LicenseTier = 'free' | 'standard' | 'vip'

export function useLicense() {
  // Placeholder default 'vip' until L11-01 (Lemon Squeezy) writes license_tier to TSettings
  const [tier, setTier] = useState<LicenseTier>('vip')

  useEffect(() => {
    window.db.settings.get('license_tier').then((val: string | null) => {
      if (val === 'free' || val === 'standard' || val === 'vip') {
        setTier(val)
      }
    })
  }, [])

  return {
    tier,
    isVip:      tier === 'vip',
    isStandard: tier === 'standard' || tier === 'vip'
  }
}

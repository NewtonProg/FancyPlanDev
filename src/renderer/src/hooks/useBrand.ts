import { useState, useEffect } from 'react'

export type BrandState = {
  logoData: string | null
  logoKey: string
  appName: string
}

const DEFAULT: BrandState = { logoData: null, logoKey: 'fp-taskbar-1', appName: '' }

export function useBrand(): BrandState {
  const [brand, setBrand] = useState<BrandState>(DEFAULT)

  const load = (): void => {
    window.db.settings.getAll('brand_').then((s) => {
      setBrand({
        logoData: (s['brand_logo_data'] as string) || null,
        logoKey:  (s['brand_logo_key']  as string) || 'fp-taskbar-1',
        appName:  (s['brand_app_name']  as string) || ''
      })
    })
  }

  useEffect(() => {
    load()
    window.addEventListener('fp:brand-updated', load)
    return () => window.removeEventListener('fp:brand-updated', load)
  }, [])

  return brand
}

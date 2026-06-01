import { useState } from 'react'

const STORAGE_KEY = 'fp-test-theme'

export function useTheme(): { theme: string; setTheme: (t: string) => void } {
  const [theme, setThemeState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )

  function setTheme(t: string): void {
    setThemeState(t)
    if (t) {
      document.documentElement.setAttribute('data-theme', t)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem(STORAGE_KEY, t)
  }

  return { theme, setTheme }
}

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './locales/de.json'

i18next
  .use(initReactI18next)
  .init({
    lng: 'de',
    fallbackLng: 'de',
    resources: { de: { translation: de } },
    interpolation: { escapeValue: false }
  })

export default i18next

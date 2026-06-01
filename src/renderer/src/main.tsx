import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'

const _savedTheme = localStorage.getItem('fp-test-theme')
if (_savedTheme) document.documentElement.setAttribute('data-theme', _savedTheme)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

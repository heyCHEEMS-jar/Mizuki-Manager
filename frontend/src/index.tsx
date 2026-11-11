import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import LanguageSwitch from './components/LanguageSwitch'
import './i18n'
import { defaultTheme } from './configs/style-config'
import { Toaster } from './components/ui'
import { applyThemeColor } from './lib/theme'
import './styles/globals.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

applyThemeColor(localStorage.getItem('color_rgb') || defaultTheme)

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <LanguageSwitch />
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>
)

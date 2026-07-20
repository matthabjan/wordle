import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AlertProvider } from './context/AlertContext'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('pwa-update-available'))
  },
})

window.addEventListener('pwa-apply-update', () => {
  updateSW(true)
})

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <AlertProvider>
      <App />
    </AlertProvider>
  </React.StrictMode>,
)

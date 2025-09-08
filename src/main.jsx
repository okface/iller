import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import MedStudyApp from '../medical_exam_study_app_purple_edition.jsx'

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const base = import.meta.env.BASE_URL || '/'
      const v = import.meta.env.VITE_SW_VERSION || String(Date.now())
      const swUrl = `${base.replace(/\/$/, '')}/service-worker.js?v=${encodeURIComponent(v)}`
      navigator.serviceWorker.register(swUrl).catch(console.error)
    })
  }
}

registerServiceWorker()

const el = document.getElementById('root')
createRoot(el).render(
  <React.StrictMode>
    <MedStudyApp />
  </React.StrictMode>
)

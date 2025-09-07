import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import MedStudyApp from '../medical_exam_study_app_purple_edition.jsx'

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const base = import.meta.env.BASE_URL || '/'
      const swUrl = `${base.replace(/\/$/, '/') }service-worker.js`
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

import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppStateProvider } from './contexts/AppState'
import './styles/global.css'

const App = () => {
  return (
    <AppStateProvider>
      <div>速查工具</div>
    </AppStateProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App />)

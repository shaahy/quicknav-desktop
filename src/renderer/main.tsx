import React, { useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { AppStateProvider, useAppState } from './contexts/AppState'
import { AppShell } from './components/app-shell'
import './styles/global.css'

/**
 * Bridge component that reads loading state from AppStateProvider
 * and passes it as props to AppShell.
 */
function AppShellWithState() {
  const { state } = useAppState()

  const loadingState: 'loading' | 'ready' | 'error' =
    state.isLoading ? 'loading' : 'ready'

  const retryLoad = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <AppShell
      loadingState={loadingState}
      retryLoad={retryLoad}
      quitApp={() => window.electronAPI.quitApp()}
    />
  )
}

function App() {
  return (
    <AppStateProvider>
      <AppShellWithState />
    </AppStateProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App />)

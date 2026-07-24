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
  const { state, dispatch } = useAppState()

  const loadingState: 'loading' | 'ready' | 'error' =
    state.isLoading
      ? 'loading'
      : state.loadError
        ? 'error'
        : 'ready'

  const retryLoad = useCallback(() => {
    dispatch({ type: 'RETRY_LOAD' })
  }, [dispatch])

  const rebuildData = useCallback(() => {
    dispatch({ type: 'REBUILD_DATA' })
  }, [dispatch])

  return (
    <AppShell
      loadingState={loadingState}
      retryLoad={retryLoad}
      quitApp={() => {
        console.log('[main.tsx] quitApp called')
        window.electronAPI.quitApp()
      }}
      loadError={state.loadError}
      rebuildData={state.loadRetryCount > 0 ? rebuildData : undefined}
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

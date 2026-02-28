import { useSyncExternalStore, useCallback } from 'react'

// A simple hook to track mounted state without using useEffect with setState
function subscribe(callback: () => void) {
  // No subscription needed for mount detection
  return () => {}
}

function getSnapshot() {
  return true // Always return true after initial render
}

function getServerSnapshot() {
  return false // Return false on server
}

export function useDashboardLayout() {
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  
  return { mounted }
}

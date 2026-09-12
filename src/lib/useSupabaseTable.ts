import { useCallback, useEffect, useRef, useState } from 'react'
import { useRefreshBus } from './refreshBus'
import { supabase } from './supabase'

/**
 * Fetches once and keeps the result fresh by refetching whenever any row in
 * `watchTable` changes (RLS-filtered, same as the initial fetch). Simple and
 * robust for this app's scale — not an incremental cache, just a live refetch.
 */
export function useRealtimeQuery<T>(
  watchTable: string,
  fetcher: () => Promise<T[]>,
  deps: unknown[],
): T[] {
  const [data, setData] = useState<T[]>([])
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const refreshVersion = useRefreshBus((s) => s.version)

  const refetch = useCallback(() => {
    fetcherRef.current().then(setData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Local mutations bump refreshVersion so the UI updates immediately even if
  // the realtime websocket below hasn't (re)connected yet.
  useEffect(() => {
    fetcherRef.current().then(setData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshVersion])

  useEffect(() => {
    let active = true

    const channel = supabase
      .channel(`${watchTable}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: watchTable }, () => {
        if (active) refetch()
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return data
}

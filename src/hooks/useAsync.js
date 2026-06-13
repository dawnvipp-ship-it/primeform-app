import { useCallback, useEffect, useState } from 'react'

/**
 * Minimal async data hook. Keeps components free of supabase details —
 * they just pass a function that returns a promise from the data layer.
 */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const run = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fn()
      setData(res)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { data, loading, error, reload: run, setData }
}

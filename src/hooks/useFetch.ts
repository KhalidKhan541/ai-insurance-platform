import { useState, useEffect, useCallback } from 'react'

interface UseFetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  immediate?: boolean
}

interface UseFetchResult<T> {
  data: T | null
  error: string | null
  loading: boolean
  execute: () => Promise<void>
}

export function useFetch<T>(url: string, options: UseFetchOptions = {}): UseFetchResult<T> {
  const { method = 'GET', headers = {}, body, immediate = true } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, body])

  useEffect(() => {
    if (immediate) execute()
  }, [immediate, execute])

  return { data, error, loading, execute }
}

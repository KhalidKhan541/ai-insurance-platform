import { useState, useCallback } from 'react'

interface UseClipboardResult {
  copied: boolean
  copy: (text: string) => Promise<void>
}

export function useClipboard(timeout = 2000): UseClipboardResult {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    } catch {
      setCopied(false)
    }
  }, [timeout])

  return { copied, copy }
}

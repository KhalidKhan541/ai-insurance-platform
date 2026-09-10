import { useState, useMemo, useCallback } from 'react'

interface UsePaginationProps {
  totalItems: number
  itemsPerPage?: number
  initialPage?: number
}

interface UsePaginationResult {
  page: number
  totalPages: number
  setPage: (p: number) => void
  nextPage: () => void
  prevPage: () => void
  startIndex: number
  endIndex: number
  isFirst: boolean
  isLast: boolean
}

export function usePagination({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1,
}: UsePaginationProps): UsePaginationResult {
  const [page, setPage] = useState(initialPage)
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / itemsPerPage)), [totalItems, itemsPerPage])

  const clampPage = useCallback(
    (p: number) => Math.min(Math.max(1, p), totalPages),
    [totalPages]
  )

  const setSafePage = useCallback((p: number) => setPage(clampPage(p)), [clampPage])
  const nextPage = useCallback(() => setPage((p) => clampPage(p + 1)), [clampPage])
  const prevPage = useCallback(() => setPage((p) => clampPage(p - 1)), [clampPage])

  return {
    page,
    totalPages,
    setPage: setSafePage,
    nextPage,
    prevPage,
    startIndex: (page - 1) * itemsPerPage,
    endIndex: page * itemsPerPage,
    isFirst: page === 1,
    isLast: page === totalPages,
  }
}

import { useState, useMemo } from 'react'
import { Table } from './Table'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  searchKey?: string
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  searchPlaceholder = 'Search...',
  searchKey,
  emptyMessage = 'No results found',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filteredData = useMemo(() => {
    let result = data
    if (search && searchKey) {
      const term = search.toLowerCase()
      result = result.filter((row) =>
        String(row[searchKey]).toLowerCase().includes(term)
      )
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return result
  }, [data, search, searchKey, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortableColumns = columns.map((col) => ({
    ...col,
    header: col.sortable ? (
      <button onClick={() => handleSort(col.key)} className="flex items-center gap-1 hover:text-slate-900">
        {col.header}
        {sortKey === col.key && (
          <span className="text-indigo-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    ) : (
      col.header
    ),
  }))

  return (
    <div className="space-y-4">
      {searchKey && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      )}
      <Table columns={sortableColumns} data={filteredData} onRowClick={onRowClick} emptyMessage={emptyMessage} />
    </div>
  )
}

import { useState } from 'react'

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function Calendar({ selected, onSelect }: CalendarProps) {
  const [viewDate, setViewDate] = useState(selected || new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isToday = (day: number) => {
    const now = new Date()
    return now.getDate() === day && now.getMonth() === month && now.getFullYear() === year
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    return selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1 hover:bg-slate-100 rounded">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm font-medium text-slate-900">{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1 hover:bg-slate-100 rounded">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-slate-500">{d}</div>
        ))}
        {days.map((day, i) => (
          <div key={i} className="flex justify-center">
            {day !== null && (
              <button
                onClick={() => onSelect?.(new Date(year, month, day))}
                className={`h-8 w-8 rounded-full text-sm ${
                  isSelected(day)
                    ? 'bg-indigo-600 text-white'
                    : isToday(day)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Calendar } from './Calendar'

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  label?: string
}

export function DatePicker({ value, onChange, placeholder = 'Select date', label }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="relative w-full">
      {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <span className={value ? '' : 'text-slate-400'}>{value ? formatDate(value) : placeholder}</span>
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1">
          <Calendar
            selected={value}
            onSelect={(d) => {
              onChange?.(d)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

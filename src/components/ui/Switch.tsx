import { forwardRef } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
  lg: 'h-7 w-14',
}

const dotSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4.5 w-4.5',
  lg: 'h-5 w-5',
}

const translateValues = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
  lg: 'translate-x-7',
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, disabled, label, id, size = 'md' }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <label htmlFor={switchId} className="flex items-center gap-2 cursor-pointer">
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
            sizes[size]
          } ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
        >
          <span
            className={`pointer-events-none inline-block rounded-full bg-white shadow ring-0 transition-transform ${dotSizes[size]} ${
              checked ? translateValues[size] : 'translate-x-0.5'
            } mt-[3px] ml-[3px]`}
          />
        </button>
        {label && <span className="text-sm text-slate-700">{label}</span>}
      </label>
    )
  }
)

Switch.displayName = 'Switch'

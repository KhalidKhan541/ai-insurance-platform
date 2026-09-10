import { InputHTMLAttributes, forwardRef } from 'react'

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const radioId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <label htmlFor={radioId} className="flex items-center gap-2 cursor-pointer">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={`h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500 ${className}`}
          {...props}
        />
        {label && <span className="text-sm text-slate-700">{label}</span>}
      </label>
    )
  }
)

Radio.displayName = 'Radio'

interface AvatarProps {
  src?: string | null
  alt?: string
  initials?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({ src, alt = '', initials, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ring-2 ring-white ${sizeClasses[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700 ring-2 ring-white ${sizeClasses[size]} ${className}`}
    >
      {initials || '?'}
    </div>
  )
}

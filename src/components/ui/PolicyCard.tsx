import { Badge } from './Badge'

interface PolicyCardProps {
  policyNumber: string
  type: string
  status: 'active' | 'expired' | 'pending' | 'cancelled'
  holder: string
  premium: string
  coverage: string
  expiryDate: string
  onClick?: () => void
}

const statusVariant = {
  active: 'success' as const,
  expired: 'default' as const,
  pending: 'warning' as const,
  cancelled: 'danger' as const,
}

export function PolicyCard({
  policyNumber,
  type,
  status,
  holder,
  premium,
  coverage,
  expiryDate,
  onClick,
}: PolicyCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">Policy #{policyNumber}</p>
          <h4 className="mt-1 text-base font-semibold text-slate-900">{type}</h4>
        </div>
        <Badge variant={statusVariant[status]}>{status}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Holder</p>
          <p className="font-medium text-slate-900">{holder}</p>
        </div>
        <div>
          <p className="text-slate-500">Premium</p>
          <p className="font-medium text-slate-900">{premium}</p>
        </div>
        <div>
          <p className="text-slate-500">Coverage</p>
          <p className="font-medium text-slate-900">{coverage}</p>
        </div>
        <div>
          <p className="text-slate-500">Expires</p>
          <p className="font-medium text-slate-900">{expiryDate}</p>
        </div>
      </div>
    </div>
  )
}

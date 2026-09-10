import { create } from 'zustand'

interface Policy {
  id: string
  policyNumber: string
  type: string
  status: 'active' | 'expired' | 'pending' | 'cancelled'
  holder: string
  premium: number
  coverage: number
  startDate: string
  endDate: string
  createdAt: string
}

interface PolicyState {
  policies: Policy[]
  selectedPolicy: Policy | null
  filters: {
    status: string
    type: string
    search: string
  }
  setPolicies: (policies: Policy[]) => void
  selectPolicy: (policy: Policy | null) => void
  setFilters: (filters: Partial<PolicyState['filters']>) => void
  addPolicy: (policy: Policy) => void
  updatePolicy: (id: string, updates: Partial<Policy>) => void
  deletePolicy: (id: string) => void
  filteredPolicies: () => Policy[]
}

export const usePolicyStore = create<PolicyState>((set, get) => ({
  policies: [],
  selectedPolicy: null,
  filters: { status: '', type: '', search: '' },
  setPolicies: (policies) => set({ policies }),
  selectPolicy: (policy) => set({ selectedPolicy: policy }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  addPolicy: (policy) =>
    set((state) => ({ policies: [...state.policies, policy] })),
  updatePolicy: (id, updates) =>
    set((state) => ({
      policies: state.policies.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deletePolicy: (id) =>
    set((state) => ({
      policies: state.policies.filter((p) => p.id !== id),
    })),
  filteredPolicies: () => {
    const { policies, filters } = get()
    return policies.filter((p) => {
      if (filters.status && p.status !== filters.status) return false
      if (filters.type && p.type !== filters.type) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !p.policyNumber.toLowerCase().includes(q) &&
          !p.holder.toLowerCase().includes(q) &&
          !p.type.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  },
}))

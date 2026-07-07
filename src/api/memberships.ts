import { client } from './client'
import type { AssemblyMembership } from '@/types/api'

export const membershipsRootKey = ['memberships'] as const

export interface MembershipsFilters {
  slotId?: string
  componentId?: string
  activeAt?: string
}

export const membershipsQueryKey = (filters: MembershipsFilters = {}) =>
  ['memberships', filters] as const

export const membershipsQuery = (filters: MembershipsFilters) => ({
  queryKey: membershipsQueryKey(filters),
  queryFn: async (): Promise<AssemblyMembership[]> => {
    const res = await client.get<AssemblyMembership[] | ''>('/memberships', {
      params: filters,
    })
    return Array.isArray(res.data) ? res.data : []
  },
})

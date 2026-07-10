import type { QueryClient } from '@tanstack/react-query'
import { client } from './client'
import { mountingsRootKey } from './mountings'
import type { AssemblyMembership, CorrectMembershipRequest } from '@/types/api'

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

// caller controls key presence — only fields that changed should be present;
// see utils/components.ts#buildCorrectMembershipBody
export const correctMembership = async (
  id: string,
  body: CorrectMembershipRequest,
): Promise<AssemblyMembership> => {
  const res = await client.post<AssemblyMembership>(
    `/memberships/${id}/action/correct`,
    body,
  )
  return res.data
}

export const voidMembership = async (id: string): Promise<void> => {
  await client.post(`/memberships/${id}/action/void`)
}

/**
 * The cascade rule moves the boundaries of the governed mounting it produced,
 * so a per-id cache patch would miss that - coarse-invalidate memberships,
 * mountings and assemblies after every correct/void.
 */
export const invalidateAfterMembershipChanges = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: membershipsRootKey }),
    qc.invalidateQueries({ queryKey: mountingsRootKey }),
    qc.invalidateQueries({ queryKey: ['assemblies'] }),
  ])

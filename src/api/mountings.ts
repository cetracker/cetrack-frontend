import type { QueryClient } from '@tanstack/react-query'
import { client } from './client'
import { componentsRootKey } from './components'
import type { CorrectMountingRequest, Mounting } from '@/types/api'

export const mountingsRootKey = ['mountings'] as const

export interface MountingsFilters {
  componentId?: string
  mountPointId?: string
  bikeId?: string
  activeAt?: string
}

export const mountingsQueryKey = (filters: MountingsFilters = {}) =>
  ['mountings', filters] as const

export const mountingsQuery = (filters: MountingsFilters = {}) => ({
  queryKey: mountingsQueryKey(filters),
  queryFn: async (): Promise<Mounting[]> => {
    const res = await client.get<Mounting[] | ''>('/mountings', {
      params: filters,
    })
    return Array.isArray(res.data) ? res.data : []
  },
})

// caller controls key presence — only fields that changed should be present;
// see utils/components.ts#buildCorrectMountingBody
export const correctMounting = async (
  id: string,
  body: CorrectMountingRequest,
): Promise<Mounting> => {
  const res = await client.post<Mounting>(
    `/mountings/${id}/action/correct`,
    body,
  )
  return res.data
}

export const voidMounting = async (id: string): Promise<void> => {
  await client.post(`/mountings/${id}/action/void`)
}

/**
 * Auto-dismounts and membership propagation happen server-side, so a
 * per-id cache patch would miss them — coarse-invalidate mountings,
 * components (status changes) and reports (mileage) after every
 * mount/dismount/correct/void/retire.
 */
export const invalidateAfterMountingChanges = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: mountingsRootKey }),
    qc.invalidateQueries({ queryKey: componentsRootKey }),
    qc.invalidateQueries({ queryKey: ['reports'] }),
  ])

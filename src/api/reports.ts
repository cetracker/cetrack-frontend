import { client } from './client'
import type { MileageItem, MileageScope } from '@/types/api'

export interface MileageFilters {
  scope?: MileageScope
  componentId?: string
  bikeId?: string
  from?: string
  to?: string
}

export const mileageQueryKey = (filters: MileageFilters = {}) =>
  ['reports', 'mileage', filters] as const

export const mileageQuery = (filters: MileageFilters = {}) => ({
  queryKey: mileageQueryKey(filters),
  queryFn: async (): Promise<MileageItem[]> => {
    const res = await client.get<MileageItem[] | ''>('/reports/mileage', {
      params: filters,
    })
    return Array.isArray(res.data) ? res.data : []
  },
})

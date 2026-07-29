import { client } from './client'
import type { MileageItem, MileageScope, TourGranularity, TourReport } from '@/types/api'

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

const EMPTY_TOUR_REPORT: TourReport = { availableYears: [], bikes: [], buckets: [] }

/** metric is deliberately not part of the filters/key: the backend always
 *  returns all three metrics, so switching metric never refetches. */
export interface TourReportFilters {
  granularity: TourGranularity
  endYear?: number
  yearsBack: number
}

export const tourReportQueryKey = (filters: TourReportFilters) =>
  ['reports', 'tours', filters] as const

export const tourReportQuery = (filters: TourReportFilters) => ({
  queryKey: tourReportQueryKey(filters),
  queryFn: async (): Promise<TourReport> => {
    const res = await client.get<TourReport | ''>('/reports/tours', {
      params: filters,
    })
    return res.data && typeof res.data === 'object' ? res.data : EMPTY_TOUR_REPORT
  },
})

import { client } from './client'
import type { MTTours, Tour } from '@/types/api'

export const toursQueryKey = ['tours'] as const

export const toursQuery = () => ({
  queryKey: toursQueryKey,
  queryFn: async (): Promise<Tour[]> => {
    const res = await client.get<Tour[] | ''>('/tours')
    return Array.isArray(res.data) ? res.data : []
  },
})

export const importTours = async (tours: MTTours): Promise<void> => {
  await client.post('/tours/import', tours)
}

export const assignTourBike = async (
  tourId: string,
  bikeId: string,
): Promise<Tour> => {
  const res = await client.post<Tour>(
    `/tours/${tourId}/action/relate`,
    undefined,
    { params: { bikeId } },
  )
  return res.data
}

import { client } from './client'
import type { Bike, BikeInput } from '@/types/api'

export const bikesQueryKey = ['bikes'] as const

export const bikesQuery = () => ({
  queryKey: bikesQueryKey,
  queryFn: async (): Promise<Bike[]> => {
    const res = await client.get<Bike[] | ''>('/bikes')
    // Backend returns 204 No Content for empty lists
    return Array.isArray(res.data) ? res.data : []
  },
})

export const createBike = async (data: BikeInput): Promise<Bike> => {
  const res = await client.post<Bike>('/bikes', data)
  return res.data
}

export const updateBike = async (
  id: string,
  data: Bike,
): Promise<Bike> => {
  const res = await client.put<Bike>(`/bikes/${id}`, data)
  return res.data
}

export const deleteBike = async (id: string): Promise<void> => {
  await client.delete(`/bikes/${id}`)
}

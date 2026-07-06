import { client } from './client'
import type {
  Bike,
  BikeInput,
  MountingChanges,
  MountPoint,
  MountPointInput,
  MountRequest,
  RetireBikeRequest,
} from '@/types/api'

export const bikesQueryKey = ['bikes'] as const
export const bikeQueryKey = (id: string) => ['bikes', id] as const
export const mountPointsQueryKey = (bikeId: string) =>
  ['bikes', bikeId, 'mountPoints'] as const

export const bikesQuery = () => ({
  queryKey: bikesQueryKey,
  queryFn: async (): Promise<Bike[]> => {
    const res = await client.get<Bike[] | ''>('/bikes')
    // Backend returns 204 No Content for empty lists
    return Array.isArray(res.data) ? res.data : []
  },
})

export const bikeQuery = (id: string) => ({
  queryKey: bikeQueryKey(id),
  queryFn: async (): Promise<Bike> => {
    const res = await client.get<Bike>(`/bikes/${id}`)
    return res.data
  },
})

export const createBike = async (data: BikeInput): Promise<Bike> => {
  const res = await client.post<Bike>('/bikes', data)
  return res.data
}

export const updateBike = async (
  id: string,
  data: BikeInput,
): Promise<Bike> => {
  const res = await client.put<Bike>(`/bikes/${id}`, data)
  return res.data
}

export const deleteBike = async (id: string): Promise<void> => {
  await client.delete(`/bikes/${id}`)
}

export const retireBike = async (
  id: string,
  body: RetireBikeRequest,
): Promise<Bike> => {
  const res = await client.post<Bike>(`/bikes/${id}/action/retire`, body)
  return res.data
}

// ============== Mount Points (bike composition) ==============

export const mountPointsQuery = (bikeId: string) => ({
  queryKey: mountPointsQueryKey(bikeId),
  queryFn: async (): Promise<MountPoint[]> => {
    const res = await client.get<MountPoint[] | ''>(
      `/bikes/${bikeId}/mountPoints`,
    )
    return Array.isArray(res.data) ? res.data : []
  },
})

export const createMountPoint = async (
  bikeId: string,
  data: MountPointInput,
): Promise<MountPoint> => {
  const res = await client.post<MountPoint>(
    `/bikes/${bikeId}/mountPoints`,
    data,
  )
  return res.data
}

export const updateMountPoint = async (
  bikeId: string,
  mountPointId: string,
  data: MountPointInput,
): Promise<MountPoint> => {
  const res = await client.put<MountPoint>(
    `/bikes/${bikeId}/mountPoints/${mountPointId}`,
    data,
  )
  return res.data
}

export const deleteMountPoint = async (
  bikeId: string,
  mountPointId: string,
): Promise<void> => {
  await client.delete(`/bikes/${bikeId}/mountPoints/${mountPointId}`)
}

export const mountComponent = async (
  bikeId: string,
  mountPointId: string,
  body: MountRequest,
): Promise<MountingChanges> => {
  const res = await client.post<MountingChanges>(
    `/bikes/${bikeId}/mountPoints/${mountPointId}/action/mount`,
    body,
  )
  return res.data
}

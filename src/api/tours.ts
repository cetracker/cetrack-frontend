import { client } from './client'
import type { CommitImportRequest, ImportSession, MTTours, Tour } from '@/types/api'

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

export const pendingMyTourbookSessionQueryKey = ['mytourbook', 'pending'] as const

export const pendingMyTourbookSessionQuery = () => ({
  queryKey: pendingMyTourbookSessionQueryKey,
  queryFn: async (): Promise<ImportSession | null> => {
    const res = await client.get<ImportSession | ''>('/tours/mytourbook/import-sessions/pending')
    return res.status === 204 ? null : (res.data || null)
  },
  refetchOnWindowFocus: true,
  refetchInterval: 60_000,
})

export const commitMyTourbookImport = async (
  sessionId: string,
  body: CommitImportRequest,
): Promise<void> => {
  await client.post(`/tours/mytourbook/import-sessions/${sessionId}/commit`, body)
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

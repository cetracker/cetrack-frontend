import { client } from './client'
import type {
  Part,
  PartInput,
  PartPartTypeRelationInput,
  PartType,
  PartTypeInput,
  ReportItem,
} from '@/types/api'

// ============== Parts ==============

export const partsQueryKey = ['parts'] as const
export const partQueryKey = (id: string) => ['parts', id] as const

export const partsQuery = () => ({
  queryKey: partsQueryKey,
  queryFn: async (): Promise<Part[]> => {
    const res = await client.get<Part[] | ''>('/parts')
    return Array.isArray(res.data) ? res.data : []
  },
})

export const partQuery = (id: string) => ({
  queryKey: partQueryKey(id),
  queryFn: async (): Promise<Part> => {
    const res = await client.get<Part>(`/parts/${id}`)
    return res.data
  },
})

export const createPart = async (data: PartInput): Promise<Part> => {
  const res = await client.post<Part>('/parts', data)
  return res.data
}

export const updatePart = async (id: string, data: Part): Promise<Part> => {
  const res = await client.put<Part>(`/parts/${id}`, data)
  return res.data
}

export const deletePart = async (id: string): Promise<void> => {
  await client.delete(`/parts/${id}`)
}

export const relatePart = async (
  id: string,
  relation: PartPartTypeRelationInput,
): Promise<Part> => {
  const res = await client.post<Part>(`/parts/${id}/action/relate`, relation)
  return res.data
}

// ============== Part Types ==============

export const partTypesQueryKey = ['partTypes'] as const
export const partTypeQueryKey = (id: string) => ['partTypes', id] as const

export const partTypesQuery = () => ({
  queryKey: partTypesQueryKey,
  queryFn: async (): Promise<PartType[]> => {
    const res = await client.get<PartType[] | ''>('/partTypes')
    return Array.isArray(res.data) ? res.data : []
  },
})

export const partTypeQuery = (id: string) => ({
  queryKey: partTypeQueryKey(id),
  queryFn: async (): Promise<PartType> => {
    const res = await client.get<PartType>(`/partTypes/${id}`)
    return res.data
  },
})

export const createPartType = async (
  data: PartTypeInput,
): Promise<PartType> => {
  const res = await client.post<PartType>('/partTypes', data)
  return res.data
}

export const updatePartType = async (
  id: string,
  data: PartType,
): Promise<PartType> => {
  const res = await client.put<PartType>(`/partTypes/${id}`, data)
  return res.data
}

export const deletePartType = async (id: string): Promise<void> => {
  await client.delete(`/partTypes/${id}`)
}

// ============== Report ==============

export const reportQueryKey = ['report'] as const

export const reportQuery = () => ({
  queryKey: reportQueryKey,
  queryFn: async (): Promise<ReportItem[]> => {
    const res = await client.get<ReportItem[] | ''>('/parts/report')
    return Array.isArray(res.data) ? res.data : []
  },
})

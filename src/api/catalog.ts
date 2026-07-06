import { client } from './client'
import type {
  ComponentType,
  ComponentTypeInput,
  Position,
  PositionInput,
} from '@/types/api'

// ============== Component Types ==============

export const componentTypesQueryKey = ['componentTypes'] as const
export const componentTypeQueryKey = (id: string) =>
  ['componentTypes', id] as const

export const componentTypesQuery = () => ({
  queryKey: componentTypesQueryKey,
  queryFn: async (): Promise<ComponentType[]> => {
    const res = await client.get<ComponentType[] | ''>('/componentTypes')
    return Array.isArray(res.data) ? res.data : []
  },
})

export const componentTypeQuery = (id: string) => ({
  queryKey: componentTypeQueryKey(id),
  queryFn: async (): Promise<ComponentType> => {
    const res = await client.get<ComponentType>(`/componentTypes/${id}`)
    return res.data
  },
})

export const createComponentType = async (
  data: ComponentTypeInput,
): Promise<ComponentType> => {
  const res = await client.post<ComponentType>('/componentTypes', data)
  return res.data
}

export const updateComponentType = async (
  id: string,
  data: ComponentTypeInput,
): Promise<ComponentType> => {
  const res = await client.put<ComponentType>(`/componentTypes/${id}`, data)
  return res.data
}

export const deleteComponentType = async (id: string): Promise<void> => {
  await client.delete(`/componentTypes/${id}`)
}

// ============== Positions ==============

export const positionsQueryKey = ['positions'] as const
export const positionQueryKey = (id: string) => ['positions', id] as const

export const positionsQuery = () => ({
  queryKey: positionsQueryKey,
  queryFn: async (): Promise<Position[]> => {
    const res = await client.get<Position[] | ''>('/positions')
    return Array.isArray(res.data) ? res.data : []
  },
})

export const positionQuery = (id: string) => ({
  queryKey: positionQueryKey(id),
  queryFn: async (): Promise<Position> => {
    const res = await client.get<Position>(`/positions/${id}`)
    return res.data
  },
})

export const createPosition = async (
  data: PositionInput,
): Promise<Position> => {
  const res = await client.post<Position>('/positions', data)
  return res.data
}

export const updatePosition = async (
  id: string,
  data: PositionInput,
): Promise<Position> => {
  const res = await client.put<Position>(`/positions/${id}`, data)
  return res.data
}

export const deletePosition = async (id: string): Promise<void> => {
  await client.delete(`/positions/${id}`)
}

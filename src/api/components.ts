import { client } from './client'
import type {
  Component,
  ComponentInput,
  ComponentStatus,
  DismountRequest,
  MountingChanges,
  RetireComponentRequest,
} from '@/types/api'

export const componentsRootKey = ['components'] as const

export interface ComponentsFilters {
  componentTypeId?: string
  status?: ComponentStatus
}

export const componentsQueryKey = (filters: ComponentsFilters = {}) =>
  ['components', 'list', filters] as const

export const componentQueryKey = (id: string) =>
  ['components', 'detail', id] as const

export const componentsQuery = (filters: ComponentsFilters = {}) => ({
  queryKey: componentsQueryKey(filters),
  queryFn: async (): Promise<Component[]> => {
    const res = await client.get<Component[] | ''>('/components', {
      params: filters,
    })
    return Array.isArray(res.data) ? res.data : []
  },
})

export const componentQuery = (id: string) => ({
  queryKey: componentQueryKey(id),
  queryFn: async (): Promise<Component> => {
    const res = await client.get<Component>(`/components/${id}`)
    return res.data
  },
})

export const createComponent = async (
  data: ComponentInput,
): Promise<Component> => {
  const res = await client.post<Component>('/components', data)
  return res.data
}

export const updateComponent = async (
  id: string,
  data: ComponentInput,
): Promise<Component> => {
  const res = await client.put<Component>(`/components/${id}`, data)
  return res.data
}

export const deleteComponent = async (id: string): Promise<void> => {
  await client.delete(`/components/${id}`)
}

export const dismountComponent = async (
  id: string,
  body: DismountRequest,
): Promise<MountingChanges> => {
  const res = await client.post<MountingChanges>(
    `/components/${id}/action/dismount`,
    body,
  )
  return res.data
}

export const retireComponent = async (
  id: string,
  body: RetireComponentRequest,
): Promise<Component> => {
  const res = await client.post<Component>(
    `/components/${id}/action/retire`,
    body,
  )
  return res.data
}

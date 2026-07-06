import type { QueryClient } from '@tanstack/react-query'
import { client } from './client'
import type {
  MaintenanceEvent,
  MaintenanceEventInput,
  MaintenanceTask,
  MaintenanceTaskInput,
} from '@/types/api'

export const maintenanceTasksRootKey = ['maintenanceTasks'] as const

export interface MaintenanceTasksFilters {
  bikeId?: string
  due?: boolean
}

export const maintenanceTasksQueryKey = (filters: MaintenanceTasksFilters = {}) =>
  ['maintenanceTasks', 'list', filters] as const

export const maintenanceTaskQueryKey = (id: string) =>
  ['maintenanceTasks', 'detail', id] as const

export const maintenanceEventsQueryKey = (taskId: string) =>
  ['maintenanceTasks', 'detail', taskId, 'events'] as const

export const maintenanceTasksQuery = (filters: MaintenanceTasksFilters = {}) => ({
  queryKey: maintenanceTasksQueryKey(filters),
  queryFn: async (): Promise<MaintenanceTask[]> => {
    const res = await client.get<MaintenanceTask[] | ''>('/maintenanceTasks', {
      params: filters,
    })
    return Array.isArray(res.data) ? res.data : []
  },
})

export const maintenanceTaskQuery = (id: string) => ({
  queryKey: maintenanceTaskQueryKey(id),
  queryFn: async (): Promise<MaintenanceTask> => {
    const res = await client.get<MaintenanceTask>(`/maintenanceTasks/${id}`)
    return res.data
  },
})

export const maintenanceEventsQuery = (taskId: string) => ({
  queryKey: maintenanceEventsQueryKey(taskId),
  queryFn: async (): Promise<MaintenanceEvent[]> => {
    const res = await client.get<MaintenanceEvent[] | ''>(
      `/maintenanceTasks/${taskId}/events`,
    )
    return Array.isArray(res.data) ? res.data : []
  },
})

export const createMaintenanceTask = async (
  data: MaintenanceTaskInput,
): Promise<MaintenanceTask> => {
  const res = await client.post<MaintenanceTask>('/maintenanceTasks', data)
  return res.data
}

export const updateMaintenanceTask = async (
  id: string,
  data: MaintenanceTaskInput,
): Promise<MaintenanceTask> => {
  const res = await client.put<MaintenanceTask>(`/maintenanceTasks/${id}`, data)
  return res.data
}

export const deleteMaintenanceTask = async (id: string): Promise<void> => {
  await client.delete(`/maintenanceTasks/${id}`)
}

export const createMaintenanceEvent = async (
  taskId: string,
  body: MaintenanceEventInput,
): Promise<MaintenanceEvent> => {
  const res = await client.post<MaintenanceEvent>(
    `/maintenanceTasks/${taskId}/events`,
    body,
  )
  return res.data
}

export const deleteMaintenanceEvent = async (
  taskId: string,
  eventId: string,
): Promise<void> => {
  await client.delete(`/maintenanceTasks/${taskId}/events/${eventId}`)
}

/**
 * Event create/delete changes derived due state in both list rows and the
 * detail read model; task CRUD changes the list. A single root-prefix
 * invalidate covers every filter permutation and both query shapes.
 */
export const invalidateMaintenance = (qc: QueryClient) =>
  qc.invalidateQueries({ queryKey: maintenanceTasksRootKey })

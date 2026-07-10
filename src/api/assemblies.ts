import type { QueryClient } from '@tanstack/react-query'
import { client } from './client'
import { invalidateAfterMountingChanges } from './mountings'
import { membershipsRootKey } from './memberships'
import type {
  AddMemberRequest,
  Assembly,
  AssemblyInput,
  AssemblyMounting,
  AssemblyMountResult,
  AssemblySlot,
  AssemblySlotInput,
  CorrectAssemblyMountingRequest,
  DismountAssemblyRequest,
  MountAssemblyRequest,
  MountingChanges,
  MountPlan,
  PlanMountRequest,
  RemoveMemberRequest,
} from '@/types/api'

export const assembliesQueryKey = ['assemblies'] as const
export const assemblyQueryKey = (id: string) => ['assemblies', id] as const
export const assemblyMountingsQueryKey = (assemblyId: string) =>
  ['assemblies', assemblyId, 'mountings'] as const

export const assembliesQuery = () => ({
  queryKey: assembliesQueryKey,
  queryFn: async (): Promise<Assembly[]> => {
    const res = await client.get<Assembly[] | ''>('/assemblies')
    return Array.isArray(res.data) ? res.data : []
  },
})

export const assemblyQuery = (id: string) => ({
  queryKey: assemblyQueryKey(id),
  queryFn: async (): Promise<Assembly> => {
    const res = await client.get<Assembly>(`/assemblies/${id}`)
    return res.data
  },
})

export const assemblyMountingsQuery = (assemblyId: string) => ({
  queryKey: assemblyMountingsQueryKey(assemblyId),
  queryFn: async (): Promise<AssemblyMounting[]> => {
    const res = await client.get<AssemblyMounting[] | ''>(
      `/assemblies/${assemblyId}/mountings`,
    )
    return Array.isArray(res.data) ? res.data : []
  },
})

export const createAssembly = async (
  data: AssemblyInput,
): Promise<Assembly> => {
  const res = await client.post<Assembly>('/assemblies', data)
  return res.data
}

export const updateAssembly = async (
  id: string,
  data: AssemblyInput,
): Promise<Assembly> => {
  const res = await client.put<Assembly>(`/assemblies/${id}`, data)
  return res.data
}

export const deleteAssembly = async (id: string): Promise<void> => {
  await client.delete(`/assemblies/${id}`)
}

export const createAssemblySlot = async (
  assemblyId: string,
  data: AssemblySlotInput,
): Promise<AssemblySlot> => {
  const res = await client.post<AssemblySlot>(
    `/assemblies/${assemblyId}/slots`,
    data,
  )
  return res.data
}

export const updateAssemblySlot = async (
  assemblyId: string,
  slotId: string,
  data: AssemblySlotInput,
): Promise<AssemblySlot> => {
  const res = await client.put<AssemblySlot>(
    `/assemblies/${assemblyId}/slots/${slotId}`,
    data,
  )
  return res.data
}

export const deleteAssemblySlot = async (
  assemblyId: string,
  slotId: string,
): Promise<void> => {
  await client.delete(`/assemblies/${assemblyId}/slots/${slotId}`)
}

export const addAssemblyMember = async (
  assemblyId: string,
  body: AddMemberRequest,
): Promise<MountingChanges> => {
  const res = await client.post<MountingChanges>(
    `/assemblies/${assemblyId}/action/addMember`,
    body,
  )
  return res.data
}

export const removeAssemblyMember = async (
  assemblyId: string,
  body: RemoveMemberRequest,
): Promise<MountingChanges> => {
  const res = await client.post<MountingChanges>(
    `/assemblies/${assemblyId}/action/removeMember`,
    body,
  )
  return res.data
}

export const planMountAssembly = async (
  assemblyId: string,
  body: PlanMountRequest,
): Promise<MountPlan> => {
  const res = await client.post<MountPlan>(
    `/assemblies/${assemblyId}/action/planMount`,
    body,
  )
  return res.data
}

export const mountAssembly = async (
  assemblyId: string,
  body: MountAssemblyRequest,
): Promise<AssemblyMountResult> => {
  const res = await client.post<AssemblyMountResult>(
    `/assemblies/${assemblyId}/action/mount`,
    body,
  )
  return res.data
}

export const dismountAssembly = async (
  assemblyId: string,
  body: DismountAssemblyRequest,
): Promise<AssemblyMountResult> => {
  const res = await client.post<AssemblyMountResult>(
    `/assemblies/${assemblyId}/action/dismount`,
    body,
  )
  return res.data
}

// caller controls key presence — only fields that changed should be present;
// see utils/components.ts#buildCorrectAssemblyMountingBody
export const correctAssemblyMounting = async (
  assemblyId: string,
  mountingId: string,
  body: CorrectAssemblyMountingRequest,
): Promise<AssemblyMounting> => {
  const res = await client.post<AssemblyMounting>(
    `/assemblies/${assemblyId}/mountings/${mountingId}/action/correct`,
    body,
  )
  return res.data
}

export const voidAssemblyMounting = async (
  assemblyId: string,
  mountingId: string,
): Promise<void> => {
  await client.post(`/assemblies/${assemblyId}/mountings/${mountingId}/action/void`)
}

/**
 * Composes the mounting-side invalidation (mountings+components+reports) with
 * assembly-side invalidation — the assembly list/detail carry derived
 * complete/mounted flags and slot membership that also change on every
 * addMember/removeMember/mount/dismount. memberships is a separate top-level
 * key, not covered by the assemblies-prefix invalidation.
 */
export const invalidateAfterAssemblyMountingChanges = (
  qc: QueryClient,
  assemblyId: string,
) =>
  Promise.all([
    invalidateAfterMountingChanges(qc),
    qc.invalidateQueries({ queryKey: assembliesQueryKey }),
    qc.invalidateQueries({ queryKey: assemblyQueryKey(assemblyId) }),
    qc.invalidateQueries({ queryKey: membershipsRootKey }),
  ])

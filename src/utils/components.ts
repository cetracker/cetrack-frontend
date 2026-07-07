import type {
  AssemblyMembership,
  Component,
  ComponentStatus,
  CorrectMountingRequest,
  Mounting,
} from '@/types/api'

export const isComponentRetired = (component: Component): boolean =>
  component.status === 'retired'

/** The mounting with no dismountedAt — a component/mount point has at most one. */
export const activeMounting = (mountings: Mounting[]): Mounting | undefined =>
  mountings.find((m) => !m.dismountedAt)

export const STATUS_LABEL: Record<ComponentStatus, string> = {
  inStock: 'In stock',
  inAssembly: 'In assembly',
  mounted: 'Mounted',
  retired: 'Retired',
}

/**
 * Componentids previously mounted at this mount point, most-recently-dismounted
 * first, each listed once (CE-0011: the re-use action shows once per unique
 * component, not once per historical mounting). Excludes the component(s)
 * currently active there — re-using the thing that's already mounted is a no-op.
 */
export const reuseCandidateComponentIds = (mountings: Mounting[]): string[] => {
  const activeIds = new Set(mountings.filter((m) => !m.dismountedAt).map((m) => m.componentId))
  const closed = mountings
    .filter((m) => m.dismountedAt && !activeIds.has(m.componentId))
    .slice()
    .sort((a, b) => (b.dismountedAt ?? '').localeCompare(a.dismountedAt ?? ''))
  const seen = new Set<string>()
  const result: string[] = []
  for (const m of closed) {
    if (seen.has(m.componentId)) continue
    seen.add(m.componentId)
    result.push(m.componentId)
  }
  return result
}

/**
 * Componentids previously a member of this slot, most-recently-ended first,
 * each listed once (CE-0105: the re-use action shows once per unique
 * component, not once per historical membership). Excludes the component(s)
 * currently active in the slot — re-using the current member is a no-op.
 * Mirrors reuseCandidateComponentIds, keyed on memberTo instead of dismountedAt.
 */
export const reuseCandidateMemberComponentIds = (memberships: AssemblyMembership[]): string[] => {
  const activeIds = new Set(memberships.filter((m) => !m.memberTo).map((m) => m.componentId))
  const closed = memberships
    .filter((m) => m.memberTo && !activeIds.has(m.componentId))
    .slice()
    .sort((a, b) => (b.memberTo ?? '').localeCompare(a.memberTo ?? ''))
  const seen = new Set<string>()
  const result: string[] = []
  for (const m of closed) {
    if (seen.has(m.componentId)) continue
    seen.add(m.componentId)
    result.push(m.componentId)
  }
  return result
}

interface CorrectMountingBodyInput {
  mountedAt?: string
  dismountedAt?: string
  reopen?: boolean
}

/**
 * Builds the tri-state CorrectMountingRequest body: only changed fields are
 * present in the result (an omitted key means "keep current value" server-side).
 * `reopen` wins over `dismountedAt` and serializes an explicit `dismountedAt: null`
 * to re-open the mounting.
 */
export const buildCorrectMountingBody = ({
  mountedAt,
  dismountedAt,
  reopen,
}: CorrectMountingBodyInput): CorrectMountingRequest => {
  const body: CorrectMountingRequest = {}
  if (mountedAt !== undefined) body.mountedAt = mountedAt
  if (reopen) {
    body.dismountedAt = null
  } else if (dismountedAt !== undefined) {
    body.dismountedAt = dismountedAt
  }
  return body
}

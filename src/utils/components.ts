import type {
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

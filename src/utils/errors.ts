/**
 * Error handling utilities to safely extract error information
 * and avoid unsafe type assertions.
 */

import { isApiError } from '@/api/client'

const FRIENDLY_MESSAGES: Record<string, string> = {
  TYPE_MISMATCH: 'That component type does not fit this mount point.',
  COMPONENT_RETIRED: 'This component is retired and can no longer be used.',
  MOUNTING_OVERLAP: 'That change would overlap another mounting.',
  IN_USE: 'This item is still in use elsewhere and cannot be deleted.',
  ASSEMBLY_MEMBER_GUIDED_CHOICE:
    'This component is part of an assembly. Mount the assembly, or remove it from the assembly first.',
  ASSEMBLY_INCOMPLETE:
    'This assembly has empty slots — fill every slot before mounting it.',
  UNRESOLVED_SLOTS:
    'Some slots need a mount point choice before this assembly can be mounted.',
  SLOT_UNMOUNTABLE:
    "One of this assembly's members can't be mounted at its resolved mount point.",
  SLOT_TARGET_COLLISION:
    'Two slots would resolve to the same mount point — choose different mount points.',
  MEMBER_MOUNTED_ELSEWHERE:
    'A member of this assembly is already mounted somewhere else.',
  MOUNTING_GOVERNED:
    'This mounting is managed by an assembly — mount/dismount the assembly to change it.',
  ASSEMBLY_ALREADY_MOUNTED: 'This assembly is already mounted on a bike.',
  ASSEMBLY_NOT_MOUNTED: "This assembly isn't currently mounted.",
  BIKE_RETIRED: 'That bike is retired and can no longer receive mountings.',
  ASSEMBLY_IN_USE:
    'This assembly still has membership or mounting history and cannot be deleted.',
  ASSEMBLY_SLOT_IN_USE:
    'This slot still has membership history — end its validity instead of deleting it.',
  ALREADY_MEMBER: 'This component already belongs to an assembly.',
  SLOT_OCCUPIED: 'This slot already has an active member.',
}

/** Map known Error.code values to friendly text; fall back to the server message. */
export function friendlyErrorMessage(err: unknown): string {
  if (isApiError(err) && err.code && FRIENDLY_MESSAGES[err.code]) {
    return FRIENDLY_MESSAGES[err.code]
  }
  return getErrorMessage(err)
}

/**
 * Safely extract error message from an unknown error object.
 * Follows a fallback pattern to handle various error shapes.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'An error occurred'

  // Handle ApiError interface
  if (typeof error === 'object' && 'message' in error) {
    const msg = (error as Record<string, unknown>).message
    if (typeof msg === 'string') return msg
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred'
}

/**
 * Create a safe error object for display in UI components.
 * Ensures type safety while avoiding `as` assertions.
 */
export function createErrorDisplay(error: unknown): { message: string } | null {
  if (!error) return null
  return { message: getErrorMessage(error) }
}


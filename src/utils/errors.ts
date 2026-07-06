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


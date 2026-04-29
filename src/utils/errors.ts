/**
 * Error handling utilities to safely extract error information
 * and avoid unsafe type assertions.
 */

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


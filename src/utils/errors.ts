/**
 * Error handling utilities to safely extract error information
 * and avoid unsafe type assertions.
 */

import i18n from '@/i18n'
import type { ParseKeys } from 'i18next'
import { isApiError } from '@/api/client'

/** Map known Error.code values to a translated message; fall back to the server message. */
export function friendlyErrorMessage(err: unknown): string {
  if (isApiError(err) && err.code) {
    const key = `errors.${err.code}` as ParseKeys
    if (i18n.exists(key)) return i18n.t(key) as string
  }
  return getErrorMessage(err)
}

/**
 * Safely extract error message from an unknown error object.
 * Follows a fallback pattern to handle various error shapes.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return i18n.t('errors.generic')

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
  return i18n.t('errors.unexpected')
}

/**
 * Create a safe error object for display in UI components.
 * Ensures type safety while avoiding `as` assertions.
 */
export function createErrorDisplay(error: unknown): { message: string } | null {
  if (!error) return null
  return { message: getErrorMessage(error) }
}


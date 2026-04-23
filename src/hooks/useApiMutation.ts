import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import { isApiError, type ApiError } from '@/api/client'
import { useNotify } from './useNotify'

type Options<TData, TVars> = UseMutationOptions<TData, ApiError, TVars> & {
  successMessage?: string
  /** When true (default) a notification with the parsed error is shown on failure. */
  notifyOnError?: boolean
}

export const useApiMutation = <TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  options: Options<TData, TVars> = {},
): UseMutationResult<TData, ApiError, TVars> => {
  const { notify } = useNotify()
  const {
    successMessage,
    notifyOnError = true,
    onSuccess,
    onError,
    ...rest
  } = options

  return useMutation<TData, ApiError, TVars>({
    mutationFn,
    onSuccess: (...args) => {
      if (successMessage) notify(successMessage, 'success')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(onSuccess as any)?.(...args)
    },
    onError: (...args) => {
      if (notifyOnError) {
        const [err] = args
        const msg = isApiError(err) ? err.message : 'Unexpected error'
        notify(msg, 'error')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(onError as any)?.(...args)
    },
    ...rest,
  })
}

import { client } from './client'

export interface BackendInfo {
  version: string
  buildTime: string
}

interface ActuatorInfoResponse {
  build?: {
    version?: string
    time?: string
  }
}

export const backendInfoQueryKey = ['backend-info'] as const

export const backendInfoQuery = () => ({
  queryKey: backendInfoQueryKey,
  queryFn: async (): Promise<BackendInfo> => {
    const res = await client.get<ActuatorInfoResponse>('/actuator/info')
    return {
      // gradle's `version` (build.gradle.kts) already includes a leading "v" (e.g. "v0.7.0");
      // strip it so the UI's own "v" prefix doesn't double up.
      version: (res.data.build?.version ?? 'unknown').replace(/^v/i, ''),
      buildTime: res.data.build?.time ?? '',
    }
  },
  staleTime: Infinity,
  retry: false,
})

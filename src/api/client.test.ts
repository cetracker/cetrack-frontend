// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { client, setUnlockHandler } from './client'
import { clearStoredUnlockToken, storeUnlockToken } from './auth'

interface FakeResponseSpec {
  status: number
  data?: unknown
  headers?: Record<string, string>
}

let queue: FakeResponseSpec[]
let calls: InternalAxiosRequestConfig[]

beforeEach(() => {
  queue = []
  calls = []
  clearStoredUnlockToken()
  setUnlockHandler(null)

  client.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    calls.push(config)
    const spec = queue.shift()
    if (!spec) throw new Error('client.test.ts: no queued fake response for this call')

    const response: AxiosResponse = {
      data: spec.data,
      status: spec.status,
      statusText: '',
      headers: spec.headers ?? {},
      config,
    }
    if (spec.status >= 200 && spec.status < 300) return response
    throw Object.assign(new Error(`Request failed with status code ${spec.status}`), {
      config,
      response,
      isAxiosError: true,
    })
  }
})

afterEach(() => {
  clearStoredUnlockToken()
  setUnlockHandler(null)
})

describe('client', () => {
  it('attaches the Authorization header when a token is stored', async () => {
    storeUnlockToken('abc123')
    queue.push({ status: 200, data: { ok: true } })

    await client.get('/bikes')

    expect(calls[0].headers.get('Authorization')).toBe('Bearer abc123')
  })

  it('does not attach an Authorization header when no token is stored', async () => {
    queue.push({ status: 200, data: { ok: true } })

    await client.get('/bikes')

    expect(calls[0].headers.get('Authorization')).toBeUndefined()
  })

  it('on 401 it clears the token, prompts unlock, and retries once with the fresh token', async () => {
    storeUnlockToken('stale-token')
    const unlockHandler = vi.fn().mockResolvedValue('fresh-token')
    setUnlockHandler(unlockHandler)

    queue.push({ status: 401, data: { code: 'UNAUTHORIZED', message: 'no credential' } })
    queue.push({ status: 201, data: { id: '1' } })

    const res = await client.post('/bikes', { name: 'x' })

    expect(unlockHandler).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(201)
    expect(calls).toHaveLength(2)
    expect(calls[1].headers.get('Authorization')).toBe('Bearer fresh-token')
  })

  it('does not retry a second time if the retried request also gets a 401 (no retry loop)', async () => {
    const unlockHandler = vi.fn().mockResolvedValue('fresh-token')
    setUnlockHandler(unlockHandler)

    queue.push({ status: 401, data: { code: 'UNAUTHORIZED', message: 'no credential' } })
    queue.push({ status: 401, data: { code: 'UNAUTHORIZED', message: 'still no credential' } })

    await expect(client.get('/bikes')).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
    expect(unlockHandler).toHaveBeenCalledTimes(1)
    expect(calls).toHaveLength(2)
  })

  it('rejects with the original ApiException when the keypad is cancelled', async () => {
    const unlockHandler = vi.fn().mockRejectedValue(new Error('cancelled'))
    setUnlockHandler(unlockHandler)

    queue.push({ status: 401, data: { code: 'UNAUTHORIZED', message: 'no credential' } })

    await expect(client.get('/bikes')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'no credential',
    })
    expect(calls).toHaveLength(1)
  })

  it('never intercepts a 401 from /auth/unlock itself', async () => {
    const unlockHandler = vi.fn()
    setUnlockHandler(unlockHandler)

    queue.push({ status: 401, data: { code: 'INVALID_PIN', message: 'wrong pin' } })

    await expect(client.post('/auth/unlock', { pin: '000000' })).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_PIN',
    })
    expect(unlockHandler).not.toHaveBeenCalled()
    expect(calls).toHaveLength(1)
  })

  it('replays a binary (octet-stream) body unchanged on 401 retry', async () => {
    const unlockHandler = vi.fn().mockResolvedValue('fresh-token')
    setUnlockHandler(unlockHandler)
    const blob = new Blob(['fit-file-bytes'])

    queue.push({ status: 401, data: { code: 'UNAUTHORIZED', message: 'no credential' } })
    queue.push({ status: 200, data: [] })

    await client.post('/tours/fit/parse', blob, { headers: { 'Content-Type': 'application/octet-stream' } })

    expect(calls).toHaveLength(2)
    expect(calls[1].data).toBe(blob)
  })

  it('surfaces the Retry-After header as retryAfterSeconds', async () => {
    queue.push({
      status: 429,
      data: { code: 'TOO_MANY_ATTEMPTS', message: 'locked out' },
      headers: { 'retry-after': '42' },
    })

    await expect(client.post('/auth/unlock', { pin: '000000' })).rejects.toMatchObject({
      status: 429,
      code: 'TOO_MANY_ATTEMPTS',
      retryAfterSeconds: 42,
    })
  })
})

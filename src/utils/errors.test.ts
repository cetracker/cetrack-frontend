import { describe, expect, it } from 'vitest'
import { ApiException } from '@/api/client'
import { friendlyErrorMessage } from './errors'

describe('friendlyErrorMessage', () => {
  it('maps a known code to friendly text', () => {
    const err = new ApiException({ status: 409, code: 'IN_USE', message: 'raw server text' })
    expect(friendlyErrorMessage(err)).toBe(
      'This item is still in use elsewhere and cannot be deleted.',
    )
  })

  it('maps ASSEMBLY_MEMBER_GUIDED_CHOICE to friendly text', () => {
    const err = new ApiException({
      status: 409,
      code: 'ASSEMBLY_MEMBER_GUIDED_CHOICE',
      message: 'raw server text',
    })
    expect(friendlyErrorMessage(err)).toContain('part of an assembly')
  })

  it('falls back to the server message for an unknown code', () => {
    const err = new ApiException({ status: 400, code: 'SOMETHING_ELSE', message: 'raw server text' })
    expect(friendlyErrorMessage(err)).toBe('raw server text')
  })

  it('falls back to the server message when code is absent', () => {
    const err = new ApiException({ status: 500, message: 'raw server text' })
    expect(friendlyErrorMessage(err)).toBe('raw server text')
  })

  it('handles a plain Error', () => {
    expect(friendlyErrorMessage(new Error('boom'))).toBe('boom')
  })
})

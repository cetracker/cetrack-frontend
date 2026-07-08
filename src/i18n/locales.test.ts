import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import de from './locales/de.json'

const keyPaths = (obj: object, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value && typeof value === 'object' && !Array.isArray(value)
      ? keyPaths(value, path)
      : [path]
  })

describe('locale key parity', () => {
  it('en and de expose the same set of keys', () => {
    expect(keyPaths(de).sort()).toEqual(keyPaths(en).sort())
  })
})

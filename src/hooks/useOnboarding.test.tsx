// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { OnboardingProvider } from '@/App'
import { useOnboarding } from './useOnboarding'

const KEY = 'cetrack:onboarded'

beforeEach(() => localStorage.clear())

describe('useOnboarding', () => {
  it('reads onboarded=false when the flag is unset', () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper: OnboardingProvider })
    expect(result.current.onboarded).toBe(false)
  })

  it('reads onboarded=true when the flag is already set', () => {
    localStorage.setItem(KEY, 'true')
    const { result } = renderHook(() => useOnboarding(), { wrapper: OnboardingProvider })
    expect(result.current.onboarded).toBe(true)
  })

  it('startTour opens the tour without setting the onboarded flag', () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper: OnboardingProvider })
    act(() => result.current.startTour())
    expect(result.current.tourOpen).toBe(true)
    expect(result.current.onboarded).toBe(false)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('finishTour closes the tour and persists the onboarded flag', () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper: OnboardingProvider })
    act(() => result.current.startTour())
    act(() => result.current.finishTour())
    expect(result.current.tourOpen).toBe(false)
    expect(result.current.onboarded).toBe(true)
    expect(localStorage.getItem(KEY)).toBe('true')
  })
})

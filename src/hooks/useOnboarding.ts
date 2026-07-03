import { createContext, useContext } from 'react'

export interface OnboardingApi {
  onboarded: boolean
  tourOpen: boolean
  startTour: () => void
  finishTour: () => void
}

export const OnboardingContext = createContext<OnboardingApi | null>(null)

export const useOnboarding = (): OnboardingApi => {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}

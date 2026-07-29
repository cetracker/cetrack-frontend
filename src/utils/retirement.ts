import i18n from '@/i18n'
import type { RetirementKind } from '@/types/api'

export const RETIREMENT_KINDS: RetirementKind[] = [
  'scrapped',
  'sold',
  'gifted',
  'broken',
  'lost',
  'stolen',
  'wornOut',
  'other',
]

/** Translated retirement-reason label — shared by components and bikes. */
export const retirementKindLabel = (kind: RetirementKind): string =>
  i18n.t(`retirement.kinds.${kind}`)

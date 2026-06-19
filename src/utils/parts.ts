import { parseISO } from 'date-fns'
import type { Part } from '@/types/api'

export function isPartSelectableOn(part: Part, validFrom: Date): boolean {
  if (!part.retiredAt) return true
  return parseISO(part.retiredAt).getTime() > validFrom.getTime()
}

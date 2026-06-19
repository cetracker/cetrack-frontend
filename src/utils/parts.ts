import { parseISO } from 'date-fns'
import type { Part, PartPartTypeRelation } from '@/types/api'

export function isPartSelectableOn(part: Part, validFrom: Date): boolean {
  if (!part.retiredAt) return true
  return parseISO(part.retiredAt).getTime() > validFrom.getTime()
}

// Returns the set of row keys (`${partId}-${validFrom}`) that should show the
// re-use icon. Expects relations sorted validFrom descending (most recent first).
// Each unique inactive part gets an icon on its most-recent row only; parts that
// currently have an active relation are excluded entirely.
export function reuseIconKeys(relations: PartPartTypeRelation[]): Set<string> {
  const activePartIds = new Set(
    relations.filter((r) => !r.validUntil).map((r) => r.partId),
  )
  const seen = new Set<string>()
  const keys = new Set<string>()
  for (const r of relations) {
    if (!r.validUntil) continue
    if (activePartIds.has(r.partId)) continue
    if (seen.has(r.partId)) continue
    seen.add(r.partId)
    keys.add(`${r.partId}-${r.validFrom}`)
  }
  return keys
}

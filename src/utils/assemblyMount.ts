import type { MountPlan, PlannedSlot, SlotResolution } from '@/types/api'

export const unresolvedSlots = (plan: MountPlan): PlannedSlot[] =>
  plan.slots.filter((s) => s.state === 'unresolved')

/** empty blocks mounting exactly like impossible — see AssemblyMountingService.kt:82-85. */
export const blockingSlots = (plan: MountPlan): PlannedSlot[] =>
  plan.slots.filter((s) => s.state === 'impossible' || s.state === 'empty')

/** Only unresolved slots the user actually answered — resolved/empty/impossible
 *  slots must never appear in the request even if a stray answer exists for them. */
export const buildSlotResolutions = (
  plan: MountPlan,
  answers: Record<string, string>,
): SlotResolution[] =>
  unresolvedSlots(plan)
    .filter((s) => answers[s.slotId])
    .map((s) => ({ slotId: s.slotId, mountPointId: answers[s.slotId] }))

/** Single source of truth for the wizard's submit-disabled logic. An empty plan
 *  (no active slots) is not mountable — backend rejects it ASSEMBLY_INCOMPLETE
 *  (AssemblyMountingService.kt:83), so gate it out here too to avoid a failed round-trip. */
export const canSubmitMount = (
  plan: MountPlan,
  answers: Record<string, string>,
): boolean =>
  plan.slots.length > 0 &&
  blockingSlots(plan).length === 0 &&
  unresolvedSlots(plan).every((s) => answers[s.slotId])

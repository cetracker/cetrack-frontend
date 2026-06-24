import type {
  CommitImportRequest,
  ImportCandidate,
  ImportWarning,
  WarningResolution,
  WarningResolutionAction,
} from '@/types/api'

export const allowedActions = (warning: ImportWarning): WarningResolutionAction[] => {
  if (warning.type !== 'LOGICAL_DUPLICATE') return []

  const actions: WarningResolutionAction[] = []

  if (!warning.replaceDisabled) {
    actions.push('REPLACE')
  }

  // Hide IMPORT_NEW when candidate bikeId matches any matched tour's bikeId (violates unique constraint)
  const candidateBike = warning.incomingCandidate?.bikeId
  const sameBike = warning.matchedTours?.some((t) => t.bikeId === candidateBike) ?? false
  if (!sameBike) {
    actions.push('IMPORT_NEW')
  }

  actions.push('SUPPRESS')
  return actions
}

export const buildCommitRequest = (
  candidates: ImportCandidate[],
  checkedMtTourIds: Set<string>,
  resolutionsByMtTourId: Record<string, WarningResolutionAction>,
): CommitImportRequest => {
  const approvedMtTourIds = candidates
    .filter((c) => checkedMtTourIds.has(c.mtTourId))
    .map((c) => c.mtTourId)

  const warningResolutions: WarningResolution[] = Object.entries(resolutionsByMtTourId).map(
    ([mtTourId, action]) => ({ mtTourId, action }),
  )

  return { approvedMtTourIds, warningResolutions }
}

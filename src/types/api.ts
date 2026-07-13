// Hand-written TypeScript types mirroring the backend OpenAPI specs
// (common-api.yaml, catalog-api.yaml, component-api.yaml, bike-api.yaml,
// tour-api.yaml, report-api.yaml).
// Keep in sync when the specs change.

export type UUID = string
export type ISODateTime = string
export type ISODate = string // yyyy-MM-dd

export interface Bike {
  id: UUID
  name?: string
  model?: string
  manufacturer?: string
  purchaseDate?: ISODate
  price?: string
  priceCurrency?: string
  retiredAt?: ISODateTime
  createdAt?: ISODateTime
}

// no retiredAt — set only via the retire action
export type BikeInput = Omit<
  Bike,
  'id' | 'retiredAt' | 'createdAt'
>

export interface RetireBikeRequest {
  at: ISODateTime
}

export interface MountPoint {
  id: UUID
  bikeId?: UUID
  name: string
  componentTypeId: UUID
  positionId?: UUID
  mandatory: boolean
  createdAt?: ISODateTime
}

export type MountPointInput = Omit<MountPoint, 'id' | 'bikeId' | 'createdAt'>

export interface MountRequest {
  componentId: UUID
  at: ISODateTime
}

// ============== Catalog ==============

export interface ComponentType {
  id: UUID
  name: string
  description?: string
  createdAt?: ISODateTime
}

export type ComponentTypeInput = Omit<ComponentType, 'id' | 'createdAt'>

export interface Position {
  id: UUID
  name: string
  createdAt?: ISODateTime
}

export type PositionInput = Omit<Position, 'id' | 'createdAt'>

// ============== Components ==============

export type ComponentStatus = 'inStock' | 'inAssembly' | 'mounted' | 'retired'

export type RetirementKind = 'scrapped' | 'sold'

export interface Component {
  id: UUID
  componentTypeId: UUID
  label: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  vendor?: string
  purchaseDate?: ISODate
  price?: string
  priceCurrency?: string
  retiredAt?: ISODateTime
  retirementKind?: RetirementKind
  status?: ComponentStatus
  directlyMounted?: boolean
  createdAt?: ISODateTime
}

// editable subset — lifecycle fields (retiredAt, retirementKind, status) change via actions only
export type ComponentInput = Omit<
  Component,
  'id' | 'retiredAt' | 'retirementKind' | 'status' | 'createdAt'
>

export interface DismountRequest {
  at: ISODateTime
}

export interface RetireComponentRequest {
  at: ISODateTime
  kind: RetirementKind
}

export interface CorrectMountingRequest {
  mountedAt?: ISODateTime
  // tri-state: value sets, key absent keeps, explicit null re-opens
  dismountedAt?: ISODateTime | null
}

// ============== Mountings (common) ==============

export interface Mounting {
  id: UUID
  componentId: UUID
  mountPointId: UUID
  bikeId: UUID
  mountPointName: string
  assemblyMountingId?: UUID
  assemblyId?: UUID | null
  mountedAt: ISODateTime
  dismountedAt?: ISODateTime | null
  createdAt?: ISODateTime
}

export interface MembershipChange {
  componentId: UUID
  assemblySlotId: UUID
  action: 'added' | 'removed'
  at: ISODateTime
}

export interface MountingChanges {
  created?: Mounting[]
  closed?: Mounting[]
  membershipChanges?: MembershipChange[]
}

// ============== Reports ==============

export type MileageScope = 'components' | 'bikes'

export interface MileageItem {
  componentId?: UUID
  label?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  bikeId?: UUID
  bikeName?: string
  bikeModel?: string
  distance: number
  durationMoving: number
  ascent: number
  descent: number
  powerTotal?: number
}

export interface Tour {
  id: UUID
  title: string
  distance: number
  durationMoving: number
  ascent: number
  descent: number
  powerTotal: number
  startedAt: ISODateTime
  startYear: number
  startMonth: number
  startDay: number
  bike?: Bike | null
  createdAt?: ISODateTime
  source?: 'MYTOURBOOK' | 'FIT' | 'MANUAL'
}

export interface MTTour {
  MTTOURID: string
  TITLE: string
  DISTANCE: number
  DURATIONMOVING: number
  TIMEELAPSEDDEVICE?: number
  TIMERECORDEDDEVICE?: number
  STARTTIMESTAMP: number
  STARTYEAR: number
  STARTMONTH: number
  STARTDAY: number
  TOURALTUP: number
  TOURALTDOWN: number
  POWERTOTAL: number
  TYPE?: number
  BIKEID?: string
  BIKENAME?: string
  bikeId?: UUID
}

export type MTTours = MTTour[]

export type ImportSessionStatus = 'PENDING' | 'SUPERSEDED' | 'COMMITTED'

export interface ImportCandidate {
  mtTourId: string
  title: string
  startedAt: ISODateTime
  distance: number
  durationMoving: number
  ascent?: number
  descent?: number
  powerTotal?: number
  bikeId?: UUID
}

export interface ExistingTourSummary {
  tourId: UUID
  title: string
  startedAt: ISODateTime
  distance: number
  durationMoving: number
  bikeId?: UUID
}

export interface ImportWarning {
  type: 'LOGICAL_DUPLICATE' | 'AMBIGUOUS_BIKE'
  mtTourId?: string
  message: string
  incomingCandidate?: ImportCandidate
  matchedTours?: ExistingTourSummary[]
  replaceDisabled?: boolean
}

export interface ImportSession {
  sessionId: UUID
  status: ImportSessionStatus
  dbVersion: number
  hasDrift: boolean
  candidates: ImportCandidate[]
  warnings: ImportWarning[]
}

export type WarningResolutionAction = 'REPLACE' | 'IMPORT_NEW' | 'SUPPRESS'

export interface WarningResolution {
  mtTourId: string
  action: WarningResolutionAction
}

export interface CommitImportRequest {
  approvedMtTourIds: string[]
  warningResolutions?: WarningResolution[]
}

export interface FitDuplicateHint {
  matchedTours: ExistingTourSummary[]
}

export interface FitDraftTour {
  title: string | null
  distance: number
  durationMoving: number
  durationRecorded: number
  durationElapsed: number
  ascent: number
  descent: number
  powerTotal: number
  startedAt: ISODateTime
  startYear: number
  startMonth: number
  startDay: number
  bike: Bike | null
  duplicateHint?: FitDuplicateHint
}

export interface TourCreateRequest {
  title: string
  distance: number
  durationMoving: number
  durationRecorded: number
  durationElapsed: number
  ascent: number
  descent: number
  powerTotal: number
  startedAt: ISODateTime
  startYear: number
  startMonth: number
  startDay: number
  bike: Bike
  source?: 'FIT' | 'MANUAL'
}

// ============== Assemblies ==============

export interface Assembly {
  id: UUID
  name: string
  positionId?: UUID
  complete: boolean
  mounted: boolean
  slots: AssemblySlot[]
  createdAt?: ISODateTime
}
export type AssemblyInput = { name: string; positionId?: UUID }

export interface AssemblySlot {
  id: UUID
  name: string
  componentTypeId: UUID
  validFrom: ISODateTime
  validTo?: ISODateTime
  memberComponentId?: UUID
  memberFrom?: ISODateTime
  createdAt?: ISODateTime
}
export type AssemblySlotInput = {
  name: string
  componentTypeId: UUID
  validFrom: ISODateTime
  validTo?: ISODateTime
}

export interface AssemblyMounting {
  id: UUID
  assemblyId: UUID
  bikeId: UUID
  mountedAt: ISODateTime
  dismountedAt?: ISODateTime
  createdAt?: ISODateTime
}

export interface CorrectAssemblyMountingRequest {
  mountedAt?: ISODateTime
  // tri-state: value sets, key absent keeps, explicit null re-opens
  dismountedAt?: ISODateTime | null
}

export interface AssemblyMembership {
  id: UUID
  componentId: UUID
  assemblySlotId: UUID
  assemblyId: UUID
  memberFrom: ISODateTime
  memberTo?: ISODateTime | null
  createdAt?: ISODateTime
}

export interface CorrectMembershipRequest {
  memberFrom?: ISODateTime
  // tri-state: value sets, key absent keeps, explicit null re-opens
  memberTo?: ISODateTime | null
}

export interface AddMemberRequest {
  componentId: UUID
  slotId: UUID
  from: ISODateTime
  mountPointId?: UUID
}
export interface RemoveMemberRequest {
  componentId: UUID
  to: ISODateTime
}
export interface PlanMountRequest {
  bikeId: UUID
  at: ISODateTime
}
export interface SlotResolution {
  slotId: UUID
  mountPointId: UUID
}
export interface Candidate {
  mountPointId: UUID
  mountPointName: string
  positionId?: UUID
}

export type PlannedSlotState = 'resolved' | 'unresolved' | 'impossible' | 'empty'
export interface PlannedSlot {
  slotId: UUID
  componentId?: UUID
  state: PlannedSlotState
  mountPointId?: UUID
  resolvedBy?: 'uniqueCandidate' | 'positionFilter' | 'slotMapping'
  willDismountComponentId?: UUID
  candidates?: Candidate[]
  reasonCode?:
    | 'noCandidate'
    | 'positionFilterEmpty'
    | 'memberMountedElsewhere'
    | 'occupiedByGovernedMounting'
  reason?: string
}
export interface MountPlan {
  assemblyId: UUID
  bikeId: UUID
  at: ISODateTime
  mountable: boolean
  slots: PlannedSlot[]
}
export interface MountAssemblyRequest {
  bikeId: UUID
  at: ISODateTime
  slotResolutions?: SlotResolution[]
}
export interface DismountAssemblyRequest {
  at: ISODateTime
}
export interface AssemblyMountResult {
  assemblyMounting: AssemblyMounting
  changes: MountingChanges
  rememberedSlotMappings?: SlotMapping[]
}

// bike-api.yaml SlotMapping — surfaced only via AssemblyMountResult.rememberedSlotMappings
// and the AddMemberDialog 409 retry; no dedicated CRUD UI this issue.
export interface SlotMapping {
  id: UUID
  assemblySlotId: UUID
  bikeId: UUID
  mountPointId: UUID
  createdAt?: ISODateTime
}

// ============== Maintenance ==============

export interface MaintenanceDue {
  due: boolean
  lastPerformedAt?: ISODateTime
  distanceSinceLast?: number
  distanceRemaining?: number
  timeSinceLast?: number
  timeRemaining?: number
}

export interface MaintenanceTask {
  id: UUID
  bikeId: UUID
  name: string
  distanceInterval?: number
  timeInterval?: number
  due?: MaintenanceDue
  createdAt?: ISODateTime
}

export type MaintenanceTaskInput = {
  bikeId: UUID
  name: string
  distanceInterval?: number
  timeInterval?: number
}

export interface MaintenanceEvent {
  id: UUID
  maintenanceTaskId: UUID
  performedAt: ISODateTime
  createdAt?: ISODateTime
  distanceSincePrevious?: number
}

export type MaintenanceEventInput = {
  performedAt: ISODateTime
}

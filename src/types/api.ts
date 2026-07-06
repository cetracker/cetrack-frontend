// Hand-written TypeScript types mirroring the backend OpenAPI specs
// (parts-api.yaml, bike-api.yaml, tour-api.yaml).
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

export interface Part {
  id: UUID
  label?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  vendor?: string
  /** Decimal-formatted string, e.g. "10.57" (display-only). */
  purchasePrice?: string
  /** ISO 4217 currency code, e.g. "EUR". */
  purchasePriceCurrency?: string
  firstUsedDate?: ISODateTime | null
  boughtAt?: ISODateTime | null
  retiredAt?: ISODateTime | null
  partTypeRelations?: PartPartTypeRelation[]
  createdAt?: ISODateTime
}

export type PartInput = Omit<Part, 'id' | 'createdAt'>

export interface PartType {
  id: UUID
  name: string
  mandatory: boolean
  partTypeRelations?: PartPartTypeRelation[]
  bike?: Bike | null
  createdAt?: ISODateTime
}

export type PartTypeInput = Omit<PartType, 'id' | 'createdAt'>

export interface PartPartTypeRelation {
  partId: UUID
  partTypeId: UUID
  validFrom: ISODateTime
  validUntil?: ISODateTime | null
  part: Part
  partType: PartType
}

export type PartPartTypeRelationInput = Pick<
  PartPartTypeRelation,
  'partId' | 'partTypeId' | 'validFrom' | 'validUntil'
> & {
  part: Pick<Part, 'id' | 'label'>
  partType: Pick<PartType, 'id' | 'name' | 'mandatory'>
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

export interface ReportItem {
  label?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  distance: number
  durationMoving: number
  altUp: number
  altDown: number
  totalPower: number
}

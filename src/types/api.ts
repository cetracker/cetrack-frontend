// Hand-written TypeScript types mirroring the backend OpenAPI specs
// (parts-api.yaml, bike-api.yaml, tour-api.yaml).
// Keep in sync when the specs change.

export type UUID = string
export type ISODateTime = string

export interface Bike {
  id: UUID
  model: string
  manufacturer?: string
  boughtAt?: ISODateTime | null
  retiredAt?: ISODateTime | null
  createdAt?: ISODateTime
}

export type BikeInput = Omit<Bike, 'id' | 'createdAt'>

export interface Part {
  id: UUID
  name: string
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
  part: Pick<Part, 'id' | 'name'>
  partType: Pick<PartType, 'id' | 'name' | 'mandatory'>
}

export interface Tour {
  id: UUID
  title: string
  distance: number
  durationMoving: number
  altUp: number
  altDown: number
  powerTotal: number
  startedAt: ISODateTime
  startYear: number
  startMonth: number
  startDay: number
  bike?: Bike | null
  createdAt?: ISODateTime
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
  bikeId?: UUID
}

export type MTTours = MTTour[]

export interface ReportItem {
  part: string
  distance: number
  durationMoving: number
  altUp: number
  altDown: number
  totalPower: number
}

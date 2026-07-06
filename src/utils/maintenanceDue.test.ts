import { describe, expect, it } from 'vitest'
import {
  deriveDueDisplay,
  formatDays,
  formatIntervalSummary,
  remainingDistanceLabel,
  remainingTimeLabel,
} from './maintenanceDue'
import type { MaintenanceDue, MaintenanceTask } from '@/types/api'

const DAY = 86_400

const makeTask = (overrides: Partial<MaintenanceTask> = {}): MaintenanceTask => ({
  id: 't1',
  bikeId: 'b1',
  name: 'Chain wax',
  ...overrides,
})

const makeDue = (overrides: Partial<MaintenanceDue> = {}): MaintenanceDue => ({
  due: false,
  ...overrides,
})

describe('deriveDueDisplay', () => {
  it('has no due object -> none, "—"', () => {
    expect(deriveDueDisplay(makeTask())).toEqual({ severity: 'none', label: '—' })
  })

  it('is a time-only task with no baseline (fresh bike) -> none, "No ride data yet"', () => {
    const task = makeTask({ timeInterval: 90 * DAY, due: makeDue({ due: false }) })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'none', label: 'No ride data yet' })
  })

  it('is distance-only, not due -> ok, "Due in 230.0 km"', () => {
    const task = makeTask({
      distanceInterval: 500_000,
      due: makeDue({ distanceSinceLast: 270_000, distanceRemaining: 230_000 }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'ok', label: 'Due in 230.0 km' })
  })

  it('is distance-only, due -> overdue, "Overdue by 40.0 km"', () => {
    const task = makeTask({
      distanceInterval: 500_000,
      due: makeDue({ due: true, distanceSinceLast: 540_000, distanceRemaining: -40_000 }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'overdue', label: 'Overdue by 40.0 km' })
  })

  it('is time-only, not due -> ok, "Due in 12 days"', () => {
    const task = makeTask({
      timeInterval: 30 * DAY,
      due: makeDue({ timeSinceLast: 18 * DAY, timeRemaining: 12 * DAY }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'ok', label: 'Due in 12 days' })
  })

  it('is time-only, due -> overdue, "Overdue by 3 days"', () => {
    const task = makeTask({
      timeInterval: 30 * DAY,
      due: makeDue({ due: true, timeSinceLast: 33 * DAY, timeRemaining: -3 * DAY }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'overdue', label: 'Overdue by 3 days' })
  })

  it('has both intervals, due, only distance overdue -> phrases only distance', () => {
    const task = makeTask({
      distanceInterval: 500_000,
      timeInterval: 30 * DAY,
      due: makeDue({
        due: true,
        distanceRemaining: -40_000,
        timeRemaining: 5 * DAY,
      }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'overdue', label: 'Overdue by 40.0 km' })
  })

  it('has both axes overdue -> phrases both, joined with "and"', () => {
    const task = makeTask({
      distanceInterval: 500_000,
      timeInterval: 30 * DAY,
      due: makeDue({
        due: true,
        distanceRemaining: -40_000,
        timeRemaining: -3 * DAY,
      }),
    })
    expect(deriveDueDisplay(task)).toEqual({
      severity: 'overdue',
      label: 'Overdue by 40.0 km and 3 days',
    })
  })

  it('has both set, not due, distance more urgent by ratio -> phrases distance', () => {
    const task = makeTask({
      distanceInterval: 100_000,
      timeInterval: 10 * DAY,
      due: makeDue({ distanceRemaining: 20_000, timeRemaining: 5 * DAY }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'ok', label: 'Due in 20.0 km' })
  })

  it('has both set, not due, time more urgent by ratio -> phrases time', () => {
    const task = makeTask({
      distanceInterval: 100_000,
      timeInterval: 10 * DAY,
      due: makeDue({ distanceRemaining: 50_000, timeRemaining: 2 * DAY }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'ok', label: 'Due in 2 days' })
  })

  it('has both set, not due, timeRemaining null -> phrases distance', () => {
    const task = makeTask({
      distanceInterval: 100_000,
      timeInterval: 10 * DAY,
      due: makeDue({ distanceRemaining: 20_000 }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'ok', label: 'Due in 20.0 km' })
  })

  it('is due with distanceRemaining exactly 0 -> "Due now"', () => {
    const task = makeTask({
      distanceInterval: 500_000,
      due: makeDue({ due: true, distanceRemaining: 0 }),
    })
    expect(deriveDueDisplay(task)).toEqual({ severity: 'overdue', label: 'Due now' })
  })
})

describe('formatDays', () => {
  it('formats 0 seconds as "less than a day"', () => {
    expect(formatDays(0)).toBe('less than a day')
  })

  it('formats 1 day as singular', () => {
    expect(formatDays(DAY)).toBe('1 day')
  })

  it('formats 90 days as plural', () => {
    expect(formatDays(90 * DAY)).toBe('90 days')
  })

  it('takes the absolute value of negative seconds', () => {
    expect(formatDays(-3 * DAY)).toBe('3 days')
  })
})

describe('formatIntervalSummary', () => {
  it('joins both intervals with " / "', () => {
    expect(formatIntervalSummary({ distanceInterval: 800_000, timeInterval: 90 * DAY })).toBe(
      '800.0 km / 90 days',
    )
  })

  it('shows only distance when time is unset', () => {
    expect(formatIntervalSummary({ distanceInterval: 800_000 })).toBe('800.0 km')
  })

  it('shows only time when distance is unset', () => {
    expect(formatIntervalSummary({ timeInterval: 90 * DAY })).toBe('90 days')
  })
})

describe('remainingDistanceLabel / remainingTimeLabel', () => {
  it('returns null when due is absent', () => {
    expect(remainingDistanceLabel(undefined)).toBeNull()
    expect(remainingTimeLabel(undefined)).toBeNull()
  })

  it('returns null when the axis is not evaluable', () => {
    expect(remainingDistanceLabel(makeDue())).toBeNull()
    expect(remainingTimeLabel(makeDue())).toBeNull()
  })

  it('labels a positive remaining distance as "left"', () => {
    expect(remainingDistanceLabel(makeDue({ distanceRemaining: 230_000 }))).toBe('230.0 km left')
  })

  it('labels a negative remaining distance as "over"', () => {
    expect(remainingDistanceLabel(makeDue({ distanceRemaining: -40_000 }))).toBe('40.0 km over')
  })

  it('labels a positive remaining time as "left"', () => {
    expect(remainingTimeLabel(makeDue({ timeRemaining: 12 * DAY }))).toBe('12 days left')
  })

  it('labels a negative remaining time as "over"', () => {
    expect(remainingTimeLabel(makeDue({ timeRemaining: -3 * DAY }))).toBe('3 days over')
  })
})

import { describe, expect, it } from 'vitest'
import { componentQueryKey, componentsQueryKey } from './components'
import { mountingsQueryKey } from './mountings'
import { mileageQueryKey } from './reports'
import { bikeQueryKey, mountPointsQueryKey } from './bikes'
import { componentTypeQueryKey, positionQueryKey } from './catalog'
import {
  assembliesQueryKey,
  assemblyMountingsQueryKey,
  assemblyQueryKey,
} from './assemblies'
import {
  maintenanceEventsQueryKey,
  maintenanceTaskQueryKey,
  maintenanceTasksQueryKey,
} from './maintenance'

// A wrong key string is a stale-cache bug that's otherwise only caught by
// manual smoke testing — cheap insurance against a typo silently breaking
// invalidation.
describe('query-key factories', () => {
  it('componentsQueryKey nests filters under a list key', () => {
    expect(componentsQueryKey()).toEqual(['components', 'list', {}])
    expect(componentsQueryKey({ status: 'inStock' })).toEqual([
      'components',
      'list',
      { status: 'inStock' },
    ])
  })

  it('componentQueryKey nests under a detail key', () => {
    expect(componentQueryKey('c1')).toEqual(['components', 'detail', 'c1'])
  })

  it('mountingsQueryKey carries the filters object', () => {
    expect(mountingsQueryKey({ bikeId: 'b1' })).toEqual(['mountings', { bikeId: 'b1' }])
  })

  it('mileageQueryKey nests under reports/mileage', () => {
    expect(mileageQueryKey({ scope: 'bikes' })).toEqual(['reports', 'mileage', { scope: 'bikes' }])
  })

  it('bikeQueryKey nests under bikes', () => {
    expect(bikeQueryKey('b1')).toEqual(['bikes', 'b1'])
  })

  it('mountPointsQueryKey nests under the owning bike so bike invalidation cascades', () => {
    expect(mountPointsQueryKey('b1')).toEqual(['bikes', 'b1', 'mountPoints'])
  })

  it('componentTypeQueryKey and positionQueryKey nest under their catalog roots', () => {
    expect(componentTypeQueryKey('ct1')).toEqual(['componentTypes', 'ct1'])
    expect(positionQueryKey('p1')).toEqual(['positions', 'p1'])
  })

  it('assemblyQueryKey nests under assemblies', () => {
    expect(assembliesQueryKey).toEqual(['assemblies'])
    expect(assemblyQueryKey('a1')).toEqual(['assemblies', 'a1'])
  })

  it('assemblyMountingsQueryKey nests under the owning assembly so it cascades on invalidate', () => {
    expect(assemblyMountingsQueryKey('a1')).toEqual([
      'assemblies',
      'a1',
      'mountings',
    ])
  })

  it('maintenanceTasksQueryKey nests filters under a list key', () => {
    expect(maintenanceTasksQueryKey()).toEqual(['maintenanceTasks', 'list', {}])
    expect(maintenanceTasksQueryKey({ bikeId: 'b1', due: true })).toEqual([
      'maintenanceTasks',
      'list',
      { bikeId: 'b1', due: true },
    ])
  })

  it('maintenanceTaskQueryKey nests under a detail key', () => {
    expect(maintenanceTaskQueryKey('t1')).toEqual(['maintenanceTasks', 'detail', 't1'])
  })

  it('maintenanceEventsQueryKey nests under the owning task detail so it cascades on invalidate', () => {
    expect(maintenanceEventsQueryKey('t1')).toEqual([
      'maintenanceTasks',
      'detail',
      't1',
      'events',
    ])
  })
})

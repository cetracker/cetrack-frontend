import { describe, expect, it } from 'vitest'
import { componentQueryKey, componentsQueryKey } from './components'
import { mountingsQueryKey } from './mountings'
import { mileageQueryKey } from './reports'
import { bikeQueryKey, mountPointsQueryKey } from './bikes'
import { componentTypeQueryKey, positionQueryKey } from './catalog'

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
})

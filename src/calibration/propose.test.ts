import { describe, expect, it } from 'vitest'
import { FEATURE_IDS, type FeatureId } from '../geometry/features'
import { proposeConstraints } from './propose'

describe('proposeConstraints', () => {
  it('amplía los percentiles de las muestras con el margen de cada característica', () => {
    const samples = Array.from({ length: 10 }, (_, index) =>
      Object.fromEntries(
        FEATURE_IDS.map((feature) => [
          feature,
          feature === 'curl.index' ? 20 + index : index,
        ]),
      ) as Record<FeatureId, number>,
    )
    const [curl, spread] = proposeConstraints(samples, [
      'curl.index',
      'spread.indexMiddle',
    ])

    expect(curl.min).toBeCloseTo(5.9, 6)
    expect(curl.max).toBeCloseTo(43.1, 6)
    expect(spread.min).toBeCloseTo(0.775, 6)
    expect(spread.max).toBeCloseTo(8.225, 6)
  })

  it('conserva el paso circular al cruzar los 180 grados', () => {
    const angles = [170, 172, 174, 176, 178, -180, -178, -176, -174, -172]
    const samples = angles.map((angle) =>
      Object.fromEntries(FEATURE_IDS.map((feature) => [feature, angle])) as Record<
        FeatureId,
        number
      >,
    )
    const [constraint] = proposeConstraints(samples, ['hand.pointing'])

    expect(constraint.min).toBeGreaterThan(0)
    expect(constraint.max).toBeLessThan(0)
  })

  it('pide diez o más muestras', () => {
    const samples = Array.from(
      { length: 9 },
      () => Object.fromEntries(FEATURE_IDS.map((feature) => [feature, 0])) as Record<
        FeatureId,
        number
      >,
    )

    expect(() => proposeConstraints(samples, ['curl.index'])).toThrow(
      'Necesitas al menos 10 muestras',
    )
  })
})

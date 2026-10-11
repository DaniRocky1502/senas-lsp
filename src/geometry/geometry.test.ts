import { describe, expect, it } from 'vitest'
import { toCanonical } from './canonical'
import { computeFeatures, FEATURES, FeatureSmoother, FEATURE_IDS } from './features'
import { makeHand } from '../test/makeHand'

describe('geometría de la mano', () => {
  it('distingue dedos abiertos y doblados', () => {
    const open = computeFeatures(makeHand('open')).values
    const fist = computeFeatures(makeHand('fist')).values

    for (const finger of ['index', 'middle', 'ring', 'pinky']) {
      expect(open[`curl.${finger}` as (typeof FEATURE_IDS)[number]]).toBeGreaterThan(150)
      expect(fist[`curl.${finger}` as (typeof FEATURE_IDS)[number]]).toBeLessThan(100)
    }
  })

  it('mantiene las características al cambiar la escala', () => {
    const original = makeHand('open')
    const scaled = original.map(({ x, y, z }) => ({ x: x * 2, y: y * 2, z: z * 2 }))
    const first = computeFeatures(toCanonical(original, 1, 'Right'))
    const second = computeFeatures(toCanonical(scaled, 1, 'Right'))

    for (const feature of FEATURE_IDS) {
      expect(second.values[feature]).toBeCloseTo(first.values[feature], 6)
    }
  })

  it('mantiene las características al reflejar la mano izquierda', () => {
    const original = makeHand('open')
    const mirrored = original.map(({ x, y, z }) => ({ x: -x, y, z }))
    const first = computeFeatures(toCanonical(original, 1, 'Right'))
    const second = computeFeatures(toCanonical(mirrored, 1, 'Left'))

    for (const feature of FEATURE_IDS) {
      expect(second.values[feature]).toBeCloseTo(first.values[feature], 6)
    }
  })

  it('mide el giro de los dedos con respecto a la pantalla', () => {
    const rotated = makeHand('open').map(({ x, y, z }) => ({ x: -y, y: x, z }))
    const { values } = computeFeatures(rotated)

    expect(Math.abs(values['hand.pointing'])).toBeCloseTo(90, 6)
  })

  it('mide posiciones, direcciones y cruces de los dedos', () => {
    const { values } = computeFeatures(makeHand('open'))

    expect(Math.abs(values['dir.index'])).toBeLessThan(15)
    expect(Math.abs(values['dir.middle'])).toBeLessThan(15)
    for (const finger of ['index', 'middle', 'ring', 'pinky']) {
      expect(values[`base.${finger}` as (typeof FEATURE_IDS)[number]]).toBeGreaterThan(140)
    }
    expect(values['tip.index.y']).toBeGreaterThan(1)
    expect(values['tip.index.x']).toBeCloseTo(0, 1)
    expect(values['tip.pinky.x']).toBeGreaterThan(0.7)
    expect(values['tip.pinky.x']).toBeLessThan(1.6)
    expect(values['cross.indexMiddle']).toBeLessThan(0)
  })

  it('mide las puntas más cerca de la muñeca con el puño cerrado', () => {
    const open = computeFeatures(makeHand('open')).values
    const fist = computeFeatures(makeHand('fist')).values

    for (const finger of ['thumb', 'index', 'middle', 'ring', 'pinky']) {
      expect(fist[`tip.${finger}.y` as (typeof FEATURE_IDS)[number]]).toBeLessThan(
        open[`tip.${finger}.y` as (typeof FEATURE_IDS)[number]],
      )
    }
  })

  it('suaviza circularmente todas las características angulares', () => {
    const smoother = new FeatureSmoother()
    const angleFeatures = FEATURE_IDS.filter(
      (feature) => FEATURES[feature].kind === 'angle',
    )
    const first = Object.fromEntries(
      FEATURE_IDS.map((feature) => [
        feature,
        angleFeatures.includes(feature) ? 179 : 0,
      ]),
    ) as Record<(typeof FEATURE_IDS)[number], number>
    const second = Object.fromEntries(
      FEATURE_IDS.map((feature) => [
        feature,
        angleFeatures.includes(feature) ? -179 : 0,
      ]),
    ) as Record<(typeof FEATURE_IDS)[number], number>

    smoother.update(first)
    const smoothed = smoother.update(second)

    for (const feature of angleFeatures) {
      expect(Math.abs(smoothed[feature])).toBeGreaterThan(170)
    }
  })

  it('devuelve cero para las medidas nuevas si la palma no tiene tamaño', () => {
    const collapsed = makeHand('open').map(() => ({ x: 0, y: 0, z: 0 }))
    const { values } = computeFeatures(collapsed)

    for (const feature of FEATURE_IDS.slice(16)) {
      expect(values[feature]).toBe(0)
    }
  })
})

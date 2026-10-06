import { describe, expect, it } from 'vitest'
import { toCanonical } from './canonical'
import { computeFeatures, FEATURE_IDS } from './features'
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
})

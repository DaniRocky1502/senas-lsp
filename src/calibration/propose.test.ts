import { describe, expect, it } from 'vitest'
import {
  FEATURE_IDS,
  type FeatureId,
  type FeatureValues,
} from '../geometry/features'
import { evaluateLetter } from '../scoring/evaluate'
import {
  buildFingerLetter,
  FINGER_FEATURES,
  proposeConstraints,
} from './propose'

function makeSamples(count: number): Record<FeatureId, number>[] {
  return Array.from({ length: count }, (_, index) =>
    Object.fromEntries(
      FEATURE_IDS.map((feature) => [feature, index]),
    ) as Record<FeatureId, number>,
  )
}

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
    expect(() => proposeConstraints(makeSamples(9), ['curl.index'])).toThrow(
      'Necesitas al menos 10 muestras',
    )
  })

  it('crea una letra con cinco medidas activas y guarda el resto sin puntaje', () => {
    const letter = buildFingerLetter(
      'A',
      makeSamples(10),
      {
        letter: 'A',
        status: 'borrador',
        description: 'Puño cerrado (BORRADOR: verificar con la guía MINEDU)',
        constraints: [],
      },
    )

    expect(FINGER_FEATURES).toEqual([
      'curl.thumb',
      'curl.index',
      'curl.middle',
      'curl.ring',
      'curl.pinky',
    ])
    expect(letter.constraints.map((constraint) => constraint.feature)).toEqual(
      FEATURE_IDS,
    )
    expect(
      letter.constraints
        .slice(0, FINGER_FEATURES.length)
        .every((constraint) => constraint.weight === undefined),
    ).toBe(true)
    expect(
      letter.constraints
        .slice(FINGER_FEATURES.length)
        .every((constraint) => constraint.weight === 0),
    ).toBe(true)
    expect(letter.status).toBe('calibrada')
    expect(letter.description).toBe('Puño cerrado')
  })

  it('mantiene el mismo puntaje que una letra con solo los cinco doblados', () => {
    const fullLetter = buildFingerLetter('A', makeSamples(10))
    const curlsOnly = {
      ...fullLetter,
      constraints: fullLetter.constraints.slice(0, FINGER_FEATURES.length),
    }
    const features = Object.fromEntries(
      FEATURE_IDS.map((feature) => [feature, 4.5]),
    ) as FeatureValues

    expect(evaluateLetter(fullLetter, features, 1).score).toBe(
      evaluateLetter(curlsOnly, features, 1).score,
    )
  })

  it('no crea una letra con menos de diez muestras', () => {
    expect(() => buildFingerLetter('A', makeSamples(9))).toThrow(
      'Necesitas al menos 10 muestras',
    )
  })
})

import { describe, expect, it } from 'vitest'
import { FEATURES, type FeatureId, type FeatureValues } from '../geometry/features'
import { AcceptanceTracker, ScoreAnimator } from './stability'
import { evaluateLetter } from './evaluate'
import type { LetterDef } from './types'

function makeValues(overrides: Partial<FeatureValues> = {}): FeatureValues {
  return Object.fromEntries(
    Object.keys(FEATURES).map((feature) => [
      feature,
      overrides[feature as FeatureId] ?? 0,
    ]),
  ) as FeatureValues
}

function definition(constraints: LetterDef['constraints']): LetterDef {
  return { letter: 'A', status: 'borrador', description: 'Una letra', constraints }
}

describe('evaluación de letras', () => {
  it('da el puntaje completo cuando la característica está en el rango', () => {
    const result = evaluateLetter(
      definition([{ feature: 'curl.index', min: 10, max: 20 }]),
      makeValues({ 'curl.index': 15 }),
      0.2,
    )

    expect(result.score).toBe(1)
    expect(result.tip).toBeNull()
  })

  it('reduce el puntaje según la tolerancia', () => {
    const result = evaluateLetter(
      definition([{ feature: 'curl.index', min: 10, max: 20, tolerance: 20 }]),
      makeValues({ 'curl.index': 0 }),
      0.2,
    )

    expect(result.score).toBe(0.5)
  })

  it('exige las condiciones marcadas y elige el consejo más útil', () => {
    const required = evaluateLetter(
      definition([
        {
          feature: 'curl.index',
          min: 10,
          max: 20,
          tolerance: 10,
          required: true,
          helpBelow: 'Estira el índice',
        },
      ]),
      makeValues({ 'curl.index': 0 }),
      0.2,
    )
    const worst = evaluateLetter(
      definition([
        { feature: 'curl.index', min: 10, max: 20, tolerance: 100 },
        { feature: 'curl.middle', min: 20, max: 30, tolerance: 10 },
      ]),
      makeValues({ 'curl.index': 0, 'curl.middle': 40 }),
      0.2,
    )

    expect(required.score).toBe(0)
    expect(required.tip).toBe('Estira el índice')
    expect(worst.tip).toBe(FEATURES['curl.middle'].helpAbove)
  })

  it('elige el consejo con mayor pérdida ponderada e ignora peso cero', () => {
    const result = evaluateLetter(
      definition([
        {
          feature: 'curl.index',
          min: 10,
          max: 20,
          tolerance: 10,
          weight: 10,
          helpBelow: 'Ajusta el índice',
        },
        {
          feature: 'curl.middle',
          min: 10,
          max: 20,
          tolerance: 10,
          weight: 0,
          helpBelow: 'Ajusta el medio',
        },
        {
          feature: 'curl.ring',
          min: 10,
          max: 20,
          tolerance: 20,
          weight: 1,
          helpBelow: 'Ajusta el anular',
        },
      ]),
      makeValues({ 'curl.index': 1, 'curl.middle': 7, 'curl.ring': 0 }),
      0.2,
    )

    expect(result.perConstraint[0].score).toBeCloseTo(0.1)
    expect(result.perConstraint[1].score).toBeCloseTo(0.7)
    expect(result.perConstraint[2].score).toBeCloseTo(0.5)
    expect(result.tip).toBe('Ajusta el índice')
  })

  it('maneja el giro circular y las manos ausentes o lejanas', () => {
    const angle = evaluateLetter(
      definition([{ feature: 'hand.pointing', min: 170, max: 170, tolerance: 40 }]),
      makeValues({ 'hand.pointing': -170 }),
      0.2,
    )
    const noHand = evaluateLetter(definition([]), null, 0)
    const tooFar = evaluateLetter(definition([]), makeValues(), 0.079)

    expect(angle.perConstraint[0].score).toBe(0.5)
    expect(noHand.status).toBe('noHand')
    expect(noHand.tip).toBe('Muestra tu mano a la cámara')
    expect(tooFar.status).toBe('tooFar')
    expect(tooFar.tip).toBe('Acércate un poquito a la cámara')
  })
})

describe('estabilidad en el tiempo', () => {
  it('acepta una seña después del tiempo continuo indicado', () => {
    const tracker = new AcceptanceTracker(0.8, 500)

    expect(tracker.update(0.9, 0)).toBe(false)
    expect(tracker.update(0.9, 400)).toBe(false)
    expect(tracker.update(0.9, 500)).toBe(true)
    expect(tracker.update(0.9, 501)).toBe(false)
    tracker.update(0.7, 600)
    expect(tracker.update(0.9, 700)).toBe(false)
    expect(tracker.update(0.9, 1200)).toBe(true)
    tracker.reset()
    expect(tracker.update(0.9, 1300)).toBe(false)
  })

  it('suaviza el puntaje usando marcas de tiempo explícitas', () => {
    const animator = new ScoreAnimator()

    expect(animator.update(1, 0)).toBe(0)
    expect(animator.update(1, 500)).toBeCloseTo(1 - Math.exp(-2), 6)
  })
})

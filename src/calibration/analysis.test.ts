import { describe, expect, it } from 'vitest'
import defaults from '../letters/lsp-letters.json'
import type { Constraint, LetterDef, LetterSet } from '../scoring/types'
import { findSimilarPairs, rangeGap, separatingFeatures } from './analysis'

function constraint(
  feature: Constraint['feature'],
  min: number,
  max: number,
): Constraint {
  return { feature, min, max }
}

function letter(name: string, constraints: Constraint[]): LetterDef {
  return {
    letter: name,
    status: 'calibrada',
    description: '',
    constraints,
  }
}

describe('análisis de letras parecidas', () => {
  it('mide la distancia lineal entre rangos separados y el cruce', () => {
    expect(
      rangeGap(
        constraint('curl.index', 10, 20),
        constraint('curl.index', 25, 35),
        'linear',
      ),
    ).toBe(5)
    expect(
      rangeGap(
        constraint('curl.index', 10, 30),
        constraint('curl.index', 25, 35),
        'linear',
      ),
    ).toBe(0)
  })

  it('mide rangos angulares que cruzan los 180 grados', () => {
    expect(
      rangeGap(
        constraint('hand.pointing', 170, -170),
        constraint('hand.pointing', -175, -160),
        'angle',
      ),
    ).toBe(0)
    expect(
      rangeGap(
        constraint('hand.pointing', 170, -170),
        constraint('hand.pointing', -150, -140),
        'angle',
      ),
    ).toBe(20)
    expect(
      rangeGap(
        constraint('hand.pointing', 170, -170),
        constraint('hand.pointing', 160, 165),
        'angle',
      ),
    ).toBe(5)
  })

  it('ordena las medidas que más separan y usa la tolerancia de cada una', () => {
    const first = letter('A', [
      constraint('curl.index', 0, 10),
      constraint('tip.index.x', 0, 0.1),
      constraint('curl.middle', 0, 10),
    ])
    const second = letter('B', [
      constraint('curl.index', 40, 50),
      constraint('tip.index.x', 0.5, 0.6),
      constraint('curl.middle', 10, 20),
    ])

    expect(separatingFeatures(first, second)).toEqual([
      { feature: 'tip.index.x', gap: 0.4, ratio: 1.6 },
      { feature: 'curl.index', gap: 30, ratio: 1 },
    ])
  })

  it('encuentra C–O y A–T entre las letras iniciales parecidas', () => {
    const pairs = findSimilarPairs(defaults as LetterSet)

    expect(pairs).toContainEqual(['C', 'O'])
    expect(pairs).toContainEqual(['A', 'T'])
  })

  it('acepta una similitud en una sola dirección y ordena el par', () => {
    const letters = {
      B: letter('B', [constraint('curl.index', 0, 30)]),
      A: letter('A', [constraint('curl.index', 0, 10)]),
    }

    expect(findSimilarPairs(letters, 0.9)).toEqual([['A', 'B']])
  })
})

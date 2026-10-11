import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FEATURE_IDS, type FeatureValues } from '../geometry/features'
import type { LetterDef, LetterSet } from '../scoring/types'
import {
  addAttempt,
  clearAttempts,
  loadAttempts,
  scoreAttempt,
  summarize,
  type ConfusionAttempt,
} from './confusion'

function makeLetter(letter: string, min: number, max: number): LetterDef {
  return {
    letter,
    status: 'calibrada',
    description: '',
    constraints: [{ feature: 'curl.index', min, max }],
  }
}

function makeFeatures(curlIndex: number): FeatureValues {
  return Object.fromEntries(
    FEATURE_IDS.map((feature) => [
      feature,
      feature === 'curl.index' ? curlIndex : 0,
    ]),
  ) as FeatureValues
}

describe('pruebas de confusión', () => {
  let values: Record<string, string>

  beforeEach(() => {
    values = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values[key] ?? null,
      setItem: (key: string, value: string) => {
        values[key] = value
      },
      removeItem: (key: string) => {
        delete values[key]
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ignora intentos guardados con datos incorrectos', () => {
    values['senas-lsp:confusion'] = JSON.stringify([
      { target: 'A', recognized: 'B', accepted: ['B'] },
      { target: '1', recognized: 'A', accepted: [] },
      { target: 'C', recognized: 4, accepted: ['C'] },
    ])

    expect(loadAttempts()).toEqual([
      { target: 'A', recognized: 'B', accepted: ['B'] },
    ])
  })

  it('agrega, resume y borra los intentos', () => {
    const attempts: ConfusionAttempt[] = [
      { target: 'A', recognized: 'A', accepted: ['A'] },
      { target: 'A', recognized: 'T', accepted: ['A', 'T'] },
      { target: 'A', recognized: 'T', accepted: ['T'] },
    ]
    attempts.forEach(addAttempt)

    expect(loadAttempts()).toEqual(attempts)
    expect(summarize(loadAttempts())).toEqual([
      {
        target: 'A',
        attempts: 3,
        correct: 1,
        confusedWith: { T: 2 },
      },
    ])

    clearAttempts()
    expect(loadAttempts()).toEqual([])
  })

  it('promedia los puntajes, reconoce la mejor letra y acepta desde 90%', () => {
    const letters: LetterSet = {
      A: makeLetter('A', 0, 10),
      B: makeLetter('B', 80, 100),
    }
    const frames = Array.from({ length: 10 }, (_, index) =>
      makeFeatures(index < 9 ? 5 : 40),
    )
    const handSizes = Array.from({ length: 10 }, () => 1)

    const result = scoreAttempt('A', frames, handSizes, letters)

    expect(result.target).toBe('A')
    expect(result.recognized).toBe('A')
    expect(result.accepted).toEqual(['A'])
    expect(result.scores.A).toBeCloseTo(0.9, 6)
    expect(result.scores.B).toBe(0)
  })

  it('falla con menos de diez muestras', () => {
    expect(() =>
      scoreAttempt(
        'A',
        Array.from({ length: 9 }, () => makeFeatures(5)),
        Array.from({ length: 9 }, () => 1),
        { A: makeLetter('A', 0, 10) },
      ),
    ).toThrow('Necesitas al menos 10 muestras')
  })
})

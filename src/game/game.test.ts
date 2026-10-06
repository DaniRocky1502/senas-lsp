import { describe, expect, it } from 'vitest'
import { missingLetters, playableWords, LEVELS } from './levels'
import { letterPoints, wordStars } from './scoring'
import type { LetterSet } from '../scoring/types'

function letterSet(value: string): LetterSet {
  return Object.fromEntries(
    [...value].map((letter) => [
      letter,
      { letter, status: 'borrador', description: '', constraints: [] },
    ]),
  )
}

describe('niveles y puntaje', () => {
  it('filtra las palabras que necesitan letras no disponibles', () => {
    const firstWords = LEVELS.find((level) => level.id === 'primeras-palabras')!
    const animals = LEVELS.find((level) => level.id === 'animales')!

    expect(playableWords(firstWords, letterSet('AOUVEL'))).toEqual([
      'OLA',
      'ALA',
      'UVA',
      'AVE',
    ])
    expect(missingLetters(firstWords, letterSet('AO'))).toEqual([
      'E',
      'L',
      'N',
      'S',
      'U',
      'V',
    ])
    expect(playableWords(animals, letterSet('LAM'))).toContain('LLAMA')
  })

  it('calcula puntos por letra y estrellas por palabra', () => {
    expect(letterPoints(0, false)).toBe(10)
    expect(letterPoints(6, false)).toBe(8)
    expect(letterPoints(100, false)).toBe(3)
    expect(letterPoints(1, true)).toBe(0)
    expect(wordStars([{ skipped: false }, { skipped: false }])).toBe(3)
    expect(wordStars([{ skipped: false }, { skipped: true }])).toBe(2)
    expect(wordStars([{ skipped: true }, { skipped: true }])).toBe(1)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  combineImportedLetters,
  exportLetters,
  importLetters,
  loadLetters,
} from './store'

const originalLetter = {
  letter: 'A',
  status: 'calibrada' as const,
  description: 'Puño cerrado',
  constraints: [{ feature: 'curl.index' as const, min: 0, max: 90 }],
}

describe('almacenamiento local de letras', () => {
  let storage: Map<string, string>

  beforeEach(() => {
    storage = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('importa y exporta las letras del navegador', () => {
    importLetters(JSON.stringify({ A: originalLetter }))

    const exported = JSON.parse(exportLetters()) as Record<string, typeof originalLetter>
    expect(loadLetters().A).toEqual(originalLetter)
    expect(exported.A).toEqual(originalLetter)
    expect(Object.keys(exported).length).toBeGreaterThan(1)
  })

  it('importa y carga la letra Ñ', () => {
    const enye = { ...originalLetter, letter: 'Ñ' }
    importLetters(JSON.stringify({ 'Ñ': enye }))

    expect(loadLetters()['Ñ']).toEqual(enye)
  })

  it('explica cuándo el archivo importado no tiene letras válidas', () => {
    expect(() => importLetters('no es json')).toThrow('El texto no es un JSON válido')
    expect(() => importLetters(JSON.stringify({ A: { ...originalLetter, letter: 'B' } }))).toThrow(
      'El JSON debe tener letras válidas',
    )
  })

  it('rechaza letras sin condiciones usables', () => {
    expect(
      () =>
        importLetters(
          JSON.stringify({ B: { ...originalLetter, letter: 'B', constraints: [] } }),
        ),
    ).toThrow('El JSON debe tener letras válidas')
    expect(
      () =>
        importLetters(
          JSON.stringify({
            B: {
              ...originalLetter,
              letter: 'B',
              constraints: [
                { feature: 'curl.index', min: 0, max: 90, weight: 0 },
              ],
            },
          }),
        ),
    ).toThrow('El JSON debe tener letras válidas')
  })

  it('rechaza un archivo de importación vacío', () => {
    expect(() => importLetters('{}')).toThrow('El archivo no tiene ninguna letra.')
  })

  it('combina las letras importadas con las personalizadas existentes', () => {
    const first = { ...originalLetter, description: 'A personalizada' }
    const second = { ...originalLetter, letter: 'B', description: 'B importada' }

    expect(importLetters(JSON.stringify({ A: first }))).toBe(1)
    expect(importLetters(JSON.stringify({ B: second }))).toBe(1)
    expect(loadLetters().A).toEqual(first)
    expect(loadLetters().B).toEqual(second)
  })

  it('ensancha una letra del conjunto inicial al combinar otra calibración', () => {
    const defaultA = loadLetters().A
    const defaultThumb = defaultA.constraints.find(
      (constraint) => constraint.feature === 'curl.thumb',
    )!
    const incoming = {
      ...originalLetter,
      constraints: [
        {
          feature: 'curl.thumb' as const,
          min: defaultThumb.min - 10,
          max: defaultThumb.max + 10,
        },
      ],
    }

    expect(combineImportedLetters(JSON.stringify({ A: incoming }))).toBe(1)

    const combined = loadLetters().A.constraints.find(
      (constraint) => constraint.feature === 'curl.thumb',
    )!
    expect(combined.min).toBe(defaultThumb.min - 10)
    expect(combined.max).toBe(defaultThumb.max + 10)
  })

  it('guarda sin cambios una letra que no estaba en el conjunto inicial', () => {
    const incoming = { ...originalLetter, letter: 'Ñ' }

    expect(combineImportedLetters(JSON.stringify({ 'Ñ': incoming }))).toBe(1)
    expect(loadLetters()['Ñ']).toEqual(incoming)
  })

  it('combina con los mismos errores de JSON inválido y archivo vacío', () => {
    expect(() => combineImportedLetters('no es json')).toThrow(
      'El texto no es un JSON válido.',
    )
    expect(() => combineImportedLetters('{}')).toThrow(
      'El archivo no tiene ninguna letra.',
    )
  })
})

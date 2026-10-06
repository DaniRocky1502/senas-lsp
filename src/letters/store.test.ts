import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportLetters, importLetters, loadLetters } from './store'

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
})

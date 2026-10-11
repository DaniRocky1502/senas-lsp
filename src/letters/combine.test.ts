import { describe, expect, it } from 'vitest'
import { combineLetter } from './combine'
import type { Constraint, LetterDef } from '../scoring/types'

function letter(
  constraints: Constraint[],
  options: Partial<Pick<LetterDef, 'status' | 'description'>> = {},
): LetterDef {
  return {
    letter: 'A',
    status: options.status ?? 'borrador',
    description: options.description ?? '',
    constraints,
  }
}

describe('combinar calibraciones', () => {
  it('une rangos lineales', () => {
    const result = combineLetter(
      letter([{ feature: 'curl.index', min: 10, max: 40 }]),
      letter([{ feature: 'curl.index', min: 30, max: 80 }]),
    )

    expect(result.constraints[0]).toEqual({
      feature: 'curl.index',
      min: 10,
      max: 80,
    })
  })

  it.each([
    [10, 20, 30, 40, 10, 40],
    [170, -170, -175, -150, 170, -150],
    [-170, -160, 160, 170, 160, -160],
    [170, -170, 175, -175, 170, -170],
    [-180, 0, 0, -180, -180, 180],
  ])('cubre arcos angulares %s..%s y %s..%s', (
    firstMin,
    firstMax,
    secondMin,
    secondMax,
    expectedMin,
    expectedMax,
  ) => {
    const result = combineLetter(
      letter([{ feature: 'hand.pointing', min: firstMin, max: firstMax }]),
      letter([{ feature: 'hand.pointing', min: secondMin, max: secondMax }]),
    )

    expect(result.constraints[0]).toMatchObject({
      min: expectedMin,
      max: expectedMax,
    })
  })

  it('conserva condiciones exclusivas y agrega las entrantes al final', () => {
    const baseConstraint = { feature: 'curl.thumb' as const, min: 10, max: 20 }
    const incomingConstraint = {
      feature: 'curl.ring' as const,
      min: 30,
      max: 40,
    }
    const result = combineLetter(
      letter([baseConstraint]),
      letter([incomingConstraint]),
    )

    expect(result.constraints).toEqual([baseConstraint, incomingConstraint])
  })

  it('combina estado, descripción y opciones sin claves indefinidas', () => {
    const result = combineLetter(
      letter(
        [
          {
            feature: 'curl.index',
            min: 10,
            max: 40,
            tolerance: 8,
            weight: 2,
            required: false,
            helpBelow: 'Consejo original',
          },
        ],
        { status: 'borrador', description: '   ' },
      ),
      letter(
        [
          {
            feature: 'curl.index',
            min: 30,
            max: 80,
            tolerance: 12,
            weight: 1,
            required: true,
            helpBelow: 'Otro consejo',
            helpAbove: 'Dobla el dedo',
          },
        ],
        { status: 'calibrada', description: 'Descripción entrante' },
      ),
    )

    expect(result.status).toBe('calibrada')
    expect(result.description).toBe('Descripción entrante')
    expect(result.constraints[0]).toEqual({
      feature: 'curl.index',
      min: 10,
      max: 80,
      tolerance: 12,
      weight: 2,
      required: true,
      helpBelow: 'Consejo original',
      helpAbove: 'Dobla el dedo',
    })
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })

  it('prefiere una descripción base no vacía y mantiene el peso base', () => {
    const result = combineLetter(
      letter(
        [
          {
            feature: 'curl.index',
            min: 10,
            max: 40,
            weight: 0,
          },
        ],
        { description: '  Mi descripción  ' },
      ),
      letter(
        [
          {
            feature: 'curl.index',
            min: 30,
            max: 80,
            weight: 3,
          },
        ],
        { description: 'La otra descripción' },
      ),
    )

    expect(result.description).toBe('Mi descripción')
    expect(result.constraints[0].weight).toBe(0)
  })

  it('usa el peso entrante cuando la condición base no tiene peso', () => {
    const result = combineLetter(
      letter([{ feature: 'curl.index', min: 10, max: 40 }]),
      letter([
        { feature: 'curl.index', min: 30, max: 80, weight: 3 },
      ]),
    )

    expect(result.constraints[0].weight).toBe(3)
  })

  it('rechaza la combinación de letras distintas', () => {
    expect(() =>
      combineLetter(
        letter([{ feature: 'curl.index', min: 0, max: 20 }]),
        { ...letter([{ feature: 'curl.index', min: 0, max: 20 }]), letter: 'B' },
      ),
    ).toThrow('No se pueden combinar letras distintas.')
  })
})

import { FEATURES } from '../geometry/features'
import type { Constraint, LetterDef } from '../scoring/types'

type AngleArc = {
  start: number
  length: number
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function normalizeAngle(value: number): number {
  const normalized = modulo(value + 180, 360) - 180
  return Object.is(normalized, -0) ? 0 : normalized
}

function angleArc(constraint: Constraint): AngleArc {
  const difference = constraint.max - constraint.min
  return {
    start: normalizeAngle(constraint.min),
    length: difference >= 360 ? 360 : modulo(difference, 360),
  }
}

function combineAngles(
  first: Constraint,
  second: Constraint,
): Pick<Constraint, 'min' | 'max'> {
  const firstArc = angleArc(first)
  const secondArc = angleArc(second)
  if (firstArc.length >= 360 || secondArc.length >= 360) {
    return { min: -180, max: 180 }
  }

  const firstLength = Math.max(
    firstArc.length,
    modulo(secondArc.start - firstArc.start, 360) + secondArc.length,
  )
  const secondLength = Math.max(
    secondArc.length,
    modulo(firstArc.start - secondArc.start, 360) + firstArc.length,
  )
  const start = firstLength <= secondLength ? firstArc.start : secondArc.start
  const length = Math.min(firstLength, secondLength)
  if (length >= 360) return { min: -180, max: 180 }

  return {
    min: normalizeAngle(start),
    max: normalizeAngle(start + length),
  }
}

function combineConstraint(
  base: Constraint,
  incoming: Constraint,
): Constraint {
  const range =
    FEATURES[base.feature].kind === 'angle'
      ? combineAngles(base, incoming)
      : {
          min: Math.min(base.min, incoming.min),
          max: Math.max(base.max, incoming.max),
        }
  const combined: Constraint = {
    feature: base.feature,
    min: range.min,
    max: range.max,
  }
  const tolerance = [base.tolerance, incoming.tolerance].filter(
    (value): value is number => value !== undefined,
  )
  if (tolerance.length) combined.tolerance = Math.max(...tolerance)

  const weight = base.weight ?? incoming.weight
  if (weight !== undefined) combined.weight = weight

  if (base.required !== undefined || incoming.required !== undefined) {
    combined.required = Boolean(base.required || incoming.required)
  }

  const helpBelow = base.helpBelow ?? incoming.helpBelow
  if (helpBelow !== undefined) combined.helpBelow = helpBelow

  const helpAbove = base.helpAbove ?? incoming.helpAbove
  if (helpAbove !== undefined) combined.helpAbove = helpAbove

  return combined
}

export function combineLetter(base: LetterDef, incoming: LetterDef): LetterDef {
  if (base.letter !== incoming.letter) {
    throw new Error('No se pueden combinar letras distintas.')
  }

  const baseFeatures = new Set(
    base.constraints.map((constraint) => constraint.feature),
  )
  const constraints = base.constraints.map((constraint) => {
    const matching = incoming.constraints.find(
      (candidate) => candidate.feature === constraint.feature,
    )
    return matching ? combineConstraint(constraint, matching) : constraint
  })
  constraints.push(
    ...incoming.constraints.filter(
      (constraint) => !baseFeatures.has(constraint.feature),
    ),
  )

  const baseDescription = base.description.trim()
  return {
    letter: base.letter,
    status:
      base.status === 'calibrada' || incoming.status === 'calibrada'
        ? 'calibrada'
        : 'borrador',
    description: baseDescription || incoming.description,
    constraints,
  }
}

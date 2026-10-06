import {
  FEATURES,
  getFeatureHelp,
  type FeatureId,
  type FeatureValues,
} from '../geometry/features'
import type { Evaluation, LetterDef } from './types'

export const MIN_HAND_SIZE = 0.08

export function isPlayableLetter(def: LetterDef | undefined): boolean {
  return Boolean(
    def &&
      def.constraints.length > 0 &&
      def.constraints.some((constraint) => (constraint.weight ?? 1) > 0),
  )
}

function angleDistance(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180)
}

function constraintScore(
  value: number,
  min: number,
  max: number,
  angle: boolean,
): { score: number; direction: 'ok' | 'below' | 'above' } {
  const inside =
    angle && min > max
      ? value >= min || value <= max
      : value >= min && value <= max
  if (inside) return { score: 1, direction: 'ok' }

  let direction: 'below' | 'above'
  let excess: number
  if (angle) {
    const toMin = angleDistance(value, min)
    const toMax = angleDistance(value, max)
    direction = toMin <= toMax ? 'below' : 'above'
    excess = Math.min(toMin, toMax)
  } else if (value < min) {
    direction = 'below'
    excess = min - value
  } else {
    direction = 'above'
    excess = value - max
  }
  return { score: excess, direction }
}

function helpFor(
  feature: FeatureId,
  direction: 'below' | 'above',
  override?: string,
): string {
  return override || getFeatureHelp(feature, direction)
}

export function evaluateLetter(
  def: LetterDef,
  features: FeatureValues | null,
  handSize: number,
): Evaluation {
  if (features === null) {
    return {
      score: 0,
      perConstraint: [],
      tip: 'Muestra tu mano a la cámara',
      status: 'noHand',
    }
  }
  if (handSize < MIN_HAND_SIZE) {
    return {
      score: 0,
      perConstraint: [],
      tip: 'Acércate un poquito a la cámara',
      status: 'tooFar',
    }
  }

  const perConstraint = def.constraints.map((constraint) => {
    const value = features[constraint.feature]
    const result = constraintScore(
      value,
      constraint.min,
      constraint.max,
      FEATURES[constraint.feature].kind === 'angle',
    )
    const tolerance =
      constraint.tolerance ?? FEATURES[constraint.feature].defaultTolerance
    return {
      constraint,
      value,
      score:
        result.direction === 'ok'
          ? 1
          : Math.max(0, 1 - result.score / tolerance),
      direction: result.direction,
    }
  })

  const totalWeight = def.constraints.reduce(
    (sum, constraint) => sum + (constraint.weight ?? 1),
    0,
  )
  const weightedScore =
    totalWeight === 0
      ? 0
      : perConstraint.reduce(
          (sum, result) =>
            sum + result.score * (result.constraint.weight ?? 1),
          0,
        ) / totalWeight
  const failedRequired = perConstraint.find(
    (result) => result.constraint.required && result.score < 0.5,
  )
  const tipCandidate = perConstraint
    .filter(
      (result) =>
        result.score < 1 && (result.constraint.weight ?? 1) > 0,
    )
    .sort(
      (first, second) =>
        (1 - second.score) * (second.constraint.weight ?? 1) -
        (1 - first.score) * (first.constraint.weight ?? 1),
    )[0]
  const tip = failedRequired
    ? helpFor(
        failedRequired.constraint.feature,
        failedRequired.direction as 'below' | 'above',
        failedRequired.direction === 'below'
          ? failedRequired.constraint.helpBelow
          : failedRequired.constraint.helpAbove,
      )
    : tipCandidate
      ? helpFor(
          tipCandidate.constraint.feature,
          tipCandidate.direction as 'below' | 'above',
          tipCandidate.direction === 'below'
            ? tipCandidate.constraint.helpBelow
            : tipCandidate.constraint.helpAbove,
        )
      : null

  return {
    score: failedRequired ? 0 : weightedScore,
    perConstraint,
    tip,
    status: 'ok',
  }
}

import {
  FEATURES,
  FEATURE_IDS,
  type FeatureId,
  type FeatureKind,
  type FeatureValues,
} from '../geometry/features'
import { evaluateLetter } from '../scoring/evaluate'
import type { Constraint, LetterDef, LetterSet } from '../scoring/types'

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function angleDistance(first: number, second: number): number {
  return Math.abs(modulo(first - second + 180, 360) - 180)
}

function containsAngle(constraint: Constraint, value: number): boolean {
  if (constraint.max - constraint.min >= 360) return true
  return constraint.min > constraint.max
    ? value >= constraint.min || value <= constraint.max
    : value >= constraint.min && value <= constraint.max
}

export function rangeGap(
  first: Constraint,
  second: Constraint,
  kind: FeatureKind,
): number {
  if (kind === 'linear') {
    if (first.max >= second.min && second.max >= first.min) return 0
    return first.max < second.min
      ? second.min - first.max
      : first.min - second.max
  }

  if (
    containsAngle(first, second.min) ||
    containsAngle(first, second.max) ||
    containsAngle(second, first.min) ||
    containsAngle(second, first.max)
  ) {
    return 0
  }
  return Math.min(
    angleDistance(first.min, second.min),
    angleDistance(first.min, second.max),
    angleDistance(first.max, second.min),
    angleDistance(first.max, second.max),
  )
}

export function separatingFeatures(
  first: LetterDef,
  second: LetterDef,
): { feature: FeatureId; gap: number; ratio: number }[] {
  const firstConstraints = new Map(
    first.constraints.map((constraint) => [constraint.feature, constraint]),
  )
  const secondConstraints = new Map(
    second.constraints.map((constraint) => [constraint.feature, constraint]),
  )

  return FEATURE_IDS.flatMap((feature) => {
    const firstConstraint = firstConstraints.get(feature)
    const secondConstraint = secondConstraints.get(feature)
    if (!firstConstraint || !secondConstraint) return []
    const gap = rangeGap(
      firstConstraint,
      secondConstraint,
      FEATURES[feature].kind,
    )
    const ratio = gap / FEATURES[feature].defaultTolerance
    return ratio > 0 ? [{ feature, gap, ratio }] : []
  }).sort(
    (firstFeature, secondFeature) =>
      secondFeature.ratio - firstFeature.ratio ||
      firstFeature.feature.localeCompare(secondFeature.feature),
  )
}

function normalizeAngle(value: number): number {
  return modulo(value + 180, 360) - 180
}

function midpoint(constraint: Constraint, kind: FeatureKind): number {
  if (kind === 'angle' && constraint.min > constraint.max) {
    return normalizeAngle(
      constraint.min + modulo(constraint.max - constraint.min, 360) / 2,
    )
  }
  return (constraint.min + constraint.max) / 2
}

function profileOf(primary: LetterDef, fallback: LetterDef): FeatureValues {
  const primaryConstraints = new Map(
    primary.constraints.map((constraint) => [constraint.feature, constraint]),
  )
  const fallbackConstraints = new Map(
    fallback.constraints.map((constraint) => [constraint.feature, constraint]),
  )
  const profile = {} as FeatureValues

  for (const feature of FEATURE_IDS) {
    const constraint =
      primaryConstraints.get(feature) ?? fallbackConstraints.get(feature)
    profile[feature] = constraint
      ? midpoint(constraint, FEATURES[feature].kind)
      : 0
  }
  return profile
}

export function findSimilarPairs(
  letters: LetterSet,
  threshold = 0.9,
): [string, string][] {
  const definitions = Object.values(letters).sort((first, second) =>
    first.letter.localeCompare(second.letter),
  )
  const pairs: [string, string][] = []

  for (let firstIndex = 0; firstIndex < definitions.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < definitions.length;
      secondIndex += 1
    ) {
      const first = definitions[firstIndex]
      const second = definitions[secondIndex]
      const firstRecognizesSecond =
        evaluateLetter(second, profileOf(first, second), 1).score >= threshold
      const secondRecognizesFirst =
        evaluateLetter(first, profileOf(second, first), 1).score >= threshold
      if (firstRecognizesSecond || secondRecognizesFirst) {
        pairs.push([first.letter, second.letter])
      }
    }
  }

  return pairs.sort(
    (first, second) =>
      first[0].localeCompare(second[0]) || first[1].localeCompare(second[1]),
  )
}

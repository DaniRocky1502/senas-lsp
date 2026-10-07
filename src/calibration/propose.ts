import {
  FEATURES,
  FEATURE_IDS,
  type FeatureId,
} from '../geometry/features'
import type { Constraint, LetterDef } from '../scoring/types'

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((first, second) => first - second)
  const position = (sorted.length - 1) * fraction
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  const portion = position - lower
  return sorted[lower] + (sorted[upper] - sorted[lower]) * portion
}

function circularDifference(value: number, center: number): number {
  return ((value - center + 540) % 360) - 180
}

function wrapAngle(value: number): number {
  return ((value + 180) % 360 + 360) % 360 - 180
}

export function proposeConstraints(
  samples: Record<FeatureId, number>[],
  selected: FeatureId[],
): Constraint[] {
  if (samples.length < 10) {
    throw new Error('Necesitas al menos 10 muestras para proponer condiciones.')
  }
  return selected.map((feature) => {
    if (!FEATURE_IDS.includes(feature)) {
      throw new Error(`La característica ${feature} no existe.`)
    }
    const values = samples.map((sample) => sample[feature])
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(`Faltan muestras válidas para ${FEATURES[feature].label}.`)
    }
    const margin = FEATURES[feature].defaultTolerance * 0.5
    if (FEATURES[feature].kind === 'angle') {
      const mean = Math.atan2(
        values.reduce((sum, value) => sum + Math.sin((value * Math.PI) / 180), 0),
        values.reduce((sum, value) => sum + Math.cos((value * Math.PI) / 180), 0),
      )
      const center = (mean * 180) / Math.PI
      const offsets = values.map((value) => circularDifference(value, center))
      return {
        feature,
        min: wrapAngle(percentile(offsets, 0.1) - margin + center),
        max: wrapAngle(percentile(offsets, 0.9) + margin + center),
      }
    }
    let min = percentile(values, 0.1) - margin
    let max = percentile(values, 0.9) + margin
    if (feature.startsWith('curl.')) {
      min = Math.max(0, min)
      max = Math.min(180, max)
    }
    return { feature, min, max }
  })
}

export const FINGER_FEATURES: FeatureId[] = [
  'curl.thumb',
  'curl.index',
  'curl.middle',
  'curl.ring',
  'curl.pinky',
]

export function buildFingerLetter(
  letter: string,
  samples: Record<FeatureId, number>[],
  previous?: LetterDef,
): LetterDef {
  return {
    letter,
    status: 'calibrada',
    description: (previous?.description ?? '')
      .replace(/\s*\(BORRADOR[^)]*\)/, '')
      .trim(),
    constraints: proposeConstraints(samples, FINGER_FEATURES),
  }
}

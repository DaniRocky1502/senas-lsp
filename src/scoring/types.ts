import type { FeatureId } from '../geometry/features'

export type Constraint = {
  feature: FeatureId
  min: number
  max: number
  tolerance?: number
  weight?: number
  required?: boolean
  helpBelow?: string
  helpAbove?: string
}

export type LetterDef = {
  letter: string
  status: 'borrador' | 'calibrada'
  description: string
  constraints: Constraint[]
}

export type LetterSet = Record<string, LetterDef>

export type Evaluation = {
  score: number
  perConstraint: {
    constraint: Constraint
    value: number
    score: number
    direction: 'ok' | 'below' | 'above'
  }[]
  tip: string | null
  status: 'ok' | 'noHand' | 'tooFar'
}

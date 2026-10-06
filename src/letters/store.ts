import defaults from './lsp-letters.json'
import { FEATURE_IDS } from '../geometry/features'
import { isPlayableLetter } from '../scoring/evaluate'
import type { LetterDef, LetterSet } from '../scoring/types'

const STORAGE_KEY = 'senas-lsp:letters'
const defaultLetters = defaults as LetterSet

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLetterDef(value: unknown, key?: string): value is LetterDef {
  if (!isRecord(value)) return false
  if (
    typeof value.letter !== 'string' ||
    !/^[A-ZÑ]{1,2}$/.test(value.letter) ||
    (key !== undefined && key !== value.letter) ||
    (value.status !== 'borrador' && value.status !== 'calibrada') ||
    typeof value.description !== 'string' ||
    !Array.isArray(value.constraints) ||
    value.constraints.length === 0
  ) {
    return false
  }
  const validConstraints = value.constraints.every((constraint: unknown) => {
    if (!isRecord(constraint)) return false
    return (
      typeof constraint.feature === 'string' &&
      FEATURE_IDS.includes(constraint.feature as (typeof FEATURE_IDS)[number]) &&
      typeof constraint.min === 'number' &&
      Number.isFinite(constraint.min) &&
      typeof constraint.max === 'number' &&
      Number.isFinite(constraint.max) &&
      (constraint.tolerance === undefined ||
        (typeof constraint.tolerance === 'number' &&
          constraint.tolerance > 0)) &&
      (constraint.weight === undefined ||
        (typeof constraint.weight === 'number' && constraint.weight >= 0)) &&
      (constraint.required === undefined ||
        typeof constraint.required === 'boolean') &&
      (constraint.helpBelow === undefined ||
        typeof constraint.helpBelow === 'string') &&
      (constraint.helpAbove === undefined ||
        typeof constraint.helpAbove === 'string')
    )
  })
  return validConstraints && isPlayableLetter(value as unknown as LetterDef)
}

function readOverrides(): LetterSet {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    const parsed: unknown = JSON.parse(stored)
    if (!isRecord(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, value]) => isLetterDef(value, key)),
    ) as LetterSet
  } catch {
    return {}
  }
}

export function loadLetters(): LetterSet {
  return { ...defaultLetters, ...readOverrides() }
}

export function saveLetter(def: LetterDef): void {
  if (!isLetterDef(def, def.letter)) {
    throw new Error('La letra tiene datos que no son válidos.')
  }
  const overrides = readOverrides()
  overrides[def.letter] = def
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function deleteLetterOverride(letter: string): void {
  const overrides = readOverrides()
  delete overrides[letter]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function exportLetters(): string {
  return JSON.stringify(loadLetters(), null, 2)
}

export function importLetters(json: string): number {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('El texto no es un JSON válido.')
  }
  if (!isRecord(parsed)) {
    throw new Error('El JSON debe tener letras válidas con sus condiciones.')
  }
  const entries = Object.entries(parsed)
  if (!entries.length) {
    throw new Error('El archivo no tiene ninguna letra.')
  }
  if (!entries.every(([key, value]) => isLetterDef(value, key))) {
    throw new Error('El JSON debe tener letras válidas con sus condiciones.')
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...readOverrides(), ...parsed }),
  )
  return entries.length
}

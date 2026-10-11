import type { FeatureValues } from '../geometry/features'
import { evaluateLetter } from '../scoring/evaluate'
import type { LetterSet } from '../scoring/types'

const STORAGE_KEY = 'senas-lsp:confusion'
const LETTER_NAME = /^[A-ZÑ]{1,2}$/

export type ConfusionAttempt = {
  target: string
  recognized: string
  accepted: string[]
}

export type ConfusionScore = {
  target: string
  recognized: string
  accepted: string[]
  scores: Record<string, number>
}

export type ConfusionSummary = {
  target: string
  attempts: number
  correct: number
  confusedWith: Record<string, number>
}

function isConfusionAttempt(value: unknown): value is ConfusionAttempt {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const attempt = value as Record<string, unknown>
  return (
    typeof attempt.target === 'string' &&
    LETTER_NAME.test(attempt.target) &&
    typeof attempt.recognized === 'string' &&
    LETTER_NAME.test(attempt.recognized) &&
    Array.isArray(attempt.accepted) &&
    attempt.accepted.every(
      (letter) => typeof letter === 'string' && LETTER_NAME.test(letter),
    )
  )
}

export function loadAttempts(): ConfusionAttempt[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isConfusionAttempt) : []
  } catch {
    return []
  }
}

export function addAttempt(attempt: ConfusionAttempt): void {
  if (!isConfusionAttempt(attempt)) {
    throw new Error('Los datos de la prueba no son válidos.')
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...loadAttempts(), attempt]),
  )
}

export function clearAttempts(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function summarize(attempts: ConfusionAttempt[]): ConfusionSummary[] {
  const summaries = new Map<
    string,
    { target: string; attempts: number; correct: number; confusedWith: Record<string, number> }
  >()

  for (const attempt of attempts) {
    let summary = summaries.get(attempt.target)
    if (!summary) {
      summary = {
        target: attempt.target,
        attempts: 0,
        correct: 0,
        confusedWith: {},
      }
      summaries.set(attempt.target, summary)
    }
    summary.attempts += 1
    if (attempt.recognized === attempt.target) {
      summary.correct += 1
    } else {
      summary.confusedWith[attempt.recognized] =
        (summary.confusedWith[attempt.recognized] ?? 0) + 1
    }
  }

  return [...summaries.values()]
    .sort((first, second) => first.target.localeCompare(second.target))
    .map((summary) => ({
      ...summary,
      confusedWith: Object.fromEntries(
        Object.entries(summary.confusedWith).sort(([first], [second]) =>
          first.localeCompare(second),
        ),
      ),
    }))
}

export function scoreAttempt(
  target: string,
  frames: FeatureValues[],
  handSizes: number[],
  letters: LetterSet,
): ConfusionScore {
  if (frames.length < 10) {
    throw new Error('Necesitas al menos 10 muestras para probar una letra.')
  }
  const definitions = Object.values(letters).sort((first, second) =>
    first.letter.localeCompare(second.letter),
  )
  if (!definitions.length) {
    throw new Error('No hay letras para comparar.')
  }

  const scores: Record<string, number> = {}
  for (const definition of definitions) {
    scores[definition.letter] =
      frames.reduce(
        (total, frame, index) =>
          total +
          evaluateLetter(definition, frame, handSizes[index] ?? 0).score,
        0,
      ) / frames.length
  }

  const recognized = definitions.reduce((best, current) =>
    scores[current.letter] > scores[best.letter] ? current : best,
  )
  return {
    target,
    recognized: recognized.letter,
    accepted: definitions
      .filter((definition) => scores[definition.letter] >= 0.9)
      .map((definition) => definition.letter),
    scores,
  }
}

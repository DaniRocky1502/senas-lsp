export function letterPoints(secondsTaken: number, skipped: boolean): number {
  if (skipped) return 0
  return Math.max(3, 10 - Math.floor(secondsTaken / 3))
}

export function wordStars(results: { skipped: boolean }[]): number {
  const skipped = results.filter((result) => result.skipped).length
  if (skipped === 0) return 3
  if (skipped === 1) return 2
  return 1
}

export function levelStars(results: { skipped: boolean }[]): number {
  if (results.length === 0) return 3
  const skippedFraction =
    results.filter((result) => result.skipped).length / results.length
  if (skippedFraction === 0) return 3
  if (skippedFraction <= 0.25) return 2
  return 1
}

export type LevelProgress = {
  stars: number
  bestScore: number
}

export type Progress = Record<string, LevelProgress>

const PROGRESS_KEY = 'senas-lsp:progress'

export function loadProgress(): Progress {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(PROGRESS_KEY) ?? '{}',
    )
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Progress
    }
    return {}
  } catch {
    return {}
  }
}

export function saveLevelProgress(
  levelId: string,
  stars: number,
  score: number,
): void {
  const progress = loadProgress()
  const previous = progress[levelId] ?? { stars: 0, bestScore: 0 }
  progress[levelId] = {
    stars: Math.max(0, Math.min(3, Math.max(previous.stars, stars))),
    bestScore: Math.max(previous.bestScore, score),
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

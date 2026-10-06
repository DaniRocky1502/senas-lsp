import type { Handedness, Landmarks } from './types'

export function toCanonical(
  landmarks: Landmarks,
  aspect: number,
  handedness: Handedness,
): Landmarks {
  const mirror = handedness === 'Left' ? -1 : 1
  // La convención de espejo es arbitraria, pero calibración y juego usan el mismo recorrido.
  return landmarks.map(({ x, y, z }) => ({
    x: x * aspect * mirror,
    y,
    z: z * aspect,
  }))
}

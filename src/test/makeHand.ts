import type { Landmarks, Point } from '../geometry/types'

export function makeHand(pose: 'open' | 'fist'): Landmarks {
  const points = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }))
  const set = (index: number, point: Point) => {
    points[index] = point
  }

  set(0, { x: 0, y: 0, z: 0 })
  set(1, { x: -0.2, y: -0.1, z: 0 })
  set(2, { x: -0.42, y: -0.22, z: 0 })
  set(3, pose === 'open' ? { x: -0.62, y: -0.42, z: 0 } : { x: -0.4, y: -0.2, z: 0 })
  set(4, pose === 'open' ? { x: -0.82, y: -0.62, z: 0 } : { x: -0.34, y: -0.21, z: 0 })
  set(5, { x: -0.25, y: -0.48, z: 0 })
  set(6, { x: -0.26, y: -0.76, z: 0 })
  set(7, { x: -0.27, y: -0.99, z: 0 })
  set(8, { x: -0.28, y: -1.22, z: 0 })
  set(9, { x: 0, y: -0.54, z: 0 })
  set(10, { x: 0, y: -0.84, z: 0 })
  set(11, { x: 0, y: -1.1, z: 0 })
  set(12, { x: 0, y: -1.36, z: 0 })
  set(13, { x: 0.24, y: -0.5, z: 0 })
  set(14, { x: 0.27, y: -0.77, z: 0 })
  set(15, { x: 0.29, y: -1, z: 0 })
  set(16, { x: 0.31, y: -1.2, z: 0 })
  set(17, { x: 0.44, y: -0.42, z: 0 })
  set(18, { x: 0.51, y: -0.67, z: 0 })
  set(19, { x: 0.57, y: -0.85, z: 0 })
  set(20, { x: 0.63, y: -1.02, z: 0 })

  if (pose === 'fist') {
    for (const [pip, dip, tip] of [
      [6, 7, 8],
      [10, 11, 12],
      [14, 15, 16],
      [18, 19, 20],
    ]) {
      const joint = points[pip]
      points[dip] = { x: joint.x + 0.02, y: joint.y + 0.18, z: 0 }
      points[tip] = { x: joint.x + 0.04, y: joint.y + 0.42, z: 0 }
    }
  }

  return points
}

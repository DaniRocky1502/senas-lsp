import type { Landmarks, Point } from './types'

export const FEATURE_IDS = [
  'curl.thumb',
  'curl.index',
  'curl.middle',
  'curl.ring',
  'curl.pinky',
  'spread.indexMiddle',
  'spread.middleRing',
  'spread.ringPinky',
  'touch.thumbIndex',
  'touch.thumbMiddle',
  'touch.thumbRing',
  'touch.thumbPinky',
  'thumb.across',
  'thumb.height',
  'hand.pointing',
  'hand.facing',
  'tip.thumb.x',
  'tip.thumb.y',
  'tip.index.x',
  'tip.index.y',
  'tip.middle.x',
  'tip.middle.y',
  'tip.ring.x',
  'tip.ring.y',
  'tip.pinky.x',
  'tip.pinky.y',
  'tip.thumb.depth',
  'dir.thumb',
  'dir.index',
  'dir.middle',
  'dir.ring',
  'dir.pinky',
  'base.index',
  'base.middle',
  'base.ring',
  'base.pinky',
  'cross.indexMiddle',
] as const

export type FeatureId = (typeof FEATURE_IDS)[number]
export type FeatureKind = 'linear' | 'angle'

type FeatureInfo = {
  label: string
  unit: string
  kind: FeatureKind
  defaultTolerance: number
  helpBelow: string
  helpAbove: string
}

export const FEATURES: Record<FeatureId, FeatureInfo> = {
  'curl.thumb': {
    label: 'Doblado del pulgar',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Estira más el pulgar',
    helpAbove: 'Dobla el pulgar',
  },
  'curl.index': {
    label: 'Doblado del índice',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Estira más el dedo índice',
    helpAbove: 'Dobla el dedo índice',
  },
  'curl.middle': {
    label: 'Doblado del dedo del medio',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Estira más el dedo del medio',
    helpAbove: 'Dobla el dedo del medio',
  },
  'curl.ring': {
    label: 'Doblado del dedo anular',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Estira más el dedo anular',
    helpAbove: 'Dobla el dedo anular',
  },
  'curl.pinky': {
    label: 'Doblado del dedo chiquito',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Estira más el dedo chiquito',
    helpAbove: 'Dobla el dedo chiquito',
  },
  'spread.indexMiddle': {
    label: 'Separación entre índice y medio',
    unit: 'mano',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Separa un poquito el índice y el dedo del medio',
    helpAbove: 'Junta el índice con el dedo del medio',
  },
  'spread.middleRing': {
    label: 'Separación entre medio y anular',
    unit: 'mano',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Separa un poquito el dedo del medio y el anular',
    helpAbove: 'Junta el dedo del medio con el dedo anular',
  },
  'spread.ringPinky': {
    label: 'Separación entre anular y chiquito',
    unit: 'mano',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Separa un poquito el dedo anular y el chiquito',
    helpAbove: 'Junta el dedo anular con el chiquito',
  },
  'touch.thumbIndex': {
    label: 'Distancia del pulgar al índice',
    unit: 'mano',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Aleja el pulgar del índice',
    helpAbove: 'Junta el pulgar con el índice',
  },
  'touch.thumbMiddle': {
    label: 'Distancia del pulgar al medio',
    unit: 'mano',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Aleja el pulgar del dedo del medio',
    helpAbove: 'Junta el pulgar con el dedo del medio',
  },
  'touch.thumbRing': {
    label: 'Distancia del pulgar al anular',
    unit: 'mano',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Aleja el pulgar del dedo anular',
    helpAbove: 'Junta el pulgar con el dedo anular',
  },
  'touch.thumbPinky': {
    label: 'Distancia del pulgar al chiquito',
    unit: 'mano',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Aleja el pulgar del dedo chiquito',
    helpAbove: 'Junta el pulgar con el dedo chiquito',
  },
  'thumb.across': {
    label: 'Posición del pulgar en la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve el pulgar hacia la palma',
    helpAbove: 'Mueve el pulgar hacia afuera',
  },
  'thumb.height': {
    label: 'Altura del pulgar',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Sube un poquito el pulgar',
    helpAbove: 'Baja un poquito el pulgar',
  },
  'hand.pointing': {
    label: 'Dirección de los dedos',
    unit: '°',
    kind: 'angle',
    defaultTolerance: 30,
    helpBelow: 'Gira la mano como en el dibujo',
    helpAbove: 'Gira la mano como en el dibujo',
  },
  'hand.facing': {
    label: 'Palma o dorso',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.4,
    helpBelow: 'Muestra la palma a la cámara',
    helpAbove: 'Voltea la mano',
  },
  'tip.thumb.x': {
    label: 'Punta del pulgar: a lo ancho de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del pulgar como en la imagen',
    helpAbove: 'Mueve la punta del pulgar como en la imagen',
  },
  'tip.thumb.y': {
    label: 'Punta del pulgar: a lo alto de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del pulgar como en la imagen',
    helpAbove: 'Mueve la punta del pulgar como en la imagen',
  },
  'tip.index.x': {
    label: 'Punta del índice: a lo ancho de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del índice como en la imagen',
    helpAbove: 'Mueve la punta del índice como en la imagen',
  },
  'tip.index.y': {
    label: 'Punta del índice: a lo alto de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del índice como en la imagen',
    helpAbove: 'Mueve la punta del índice como en la imagen',
  },
  'tip.middle.x': {
    label: 'Punta del dedo del medio: a lo ancho de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del dedo del medio como en la imagen',
    helpAbove: 'Mueve la punta del dedo del medio como en la imagen',
  },
  'tip.middle.y': {
    label: 'Punta del dedo del medio: a lo alto de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del dedo del medio como en la imagen',
    helpAbove: 'Mueve la punta del dedo del medio como en la imagen',
  },
  'tip.ring.x': {
    label: 'Punta del anular: a lo ancho de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del anular como en la imagen',
    helpAbove: 'Mueve la punta del anular como en la imagen',
  },
  'tip.ring.y': {
    label: 'Punta del anular: a lo alto de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del anular como en la imagen',
    helpAbove: 'Mueve la punta del anular como en la imagen',
  },
  'tip.pinky.x': {
    label: 'Punta del dedo chiquito: a lo ancho de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del dedo chiquito como en la imagen',
    helpAbove: 'Mueve la punta del dedo chiquito como en la imagen',
  },
  'tip.pinky.y': {
    label: 'Punta del dedo chiquito: a lo alto de la palma',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del dedo chiquito como en la imagen',
    helpAbove: 'Mueve la punta del dedo chiquito como en la imagen',
  },
  'tip.thumb.depth': {
    label: 'Profundidad de la punta del pulgar',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.25,
    helpBelow: 'Mueve la punta del pulgar como en la imagen',
    helpAbove: 'Mueve la punta del pulgar como en la imagen',
  },
  'dir.thumb': {
    label: 'Dirección del pulgar',
    unit: '°',
    kind: 'angle',
    defaultTolerance: 30,
    helpBelow: 'Mueve el pulgar como en la imagen',
    helpAbove: 'Mueve el pulgar como en la imagen',
  },
  'dir.index': {
    label: 'Dirección del índice',
    unit: '°',
    kind: 'angle',
    defaultTolerance: 30,
    helpBelow: 'Mueve el índice como en la imagen',
    helpAbove: 'Mueve el índice como en la imagen',
  },
  'dir.middle': {
    label: 'Dirección del dedo del medio',
    unit: '°',
    kind: 'angle',
    defaultTolerance: 30,
    helpBelow: 'Mueve el dedo del medio como en la imagen',
    helpAbove: 'Mueve el dedo del medio como en la imagen',
  },
  'dir.ring': {
    label: 'Dirección del anular',
    unit: '°',
    kind: 'angle',
    defaultTolerance: 30,
    helpBelow: 'Mueve el anular como en la imagen',
    helpAbove: 'Mueve el anular como en la imagen',
  },
  'dir.pinky': {
    label: 'Dirección del dedo chiquito',
    unit: '°',
    kind: 'angle',
    defaultTolerance: 30,
    helpBelow: 'Mueve el dedo chiquito como en la imagen',
    helpAbove: 'Mueve el dedo chiquito como en la imagen',
  },
  'base.index': {
    label: 'Doblado de la base del índice',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Mueve el índice como en la imagen',
    helpAbove: 'Mueve el índice como en la imagen',
  },
  'base.middle': {
    label: 'Doblado de la base del dedo del medio',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Mueve el dedo del medio como en la imagen',
    helpAbove: 'Mueve el dedo del medio como en la imagen',
  },
  'base.ring': {
    label: 'Doblado de la base del anular',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Mueve el anular como en la imagen',
    helpAbove: 'Mueve el anular como en la imagen',
  },
  'base.pinky': {
    label: 'Doblado de la base del dedo chiquito',
    unit: '°',
    kind: 'linear',
    defaultTolerance: 30,
    helpBelow: 'Mueve el dedo chiquito como en la imagen',
    helpAbove: 'Mueve el dedo chiquito como en la imagen',
  },
  'cross.indexMiddle': {
    label: 'Cruce entre índice y medio',
    unit: '',
    kind: 'linear',
    defaultTolerance: 0.2,
    helpBelow: 'Separa el índice y el dedo del medio como en la imagen',
    helpAbove: 'Cruza el índice y el dedo del medio como en la imagen',
  },
}

const fingerJoints = [
  { name: 'index', mcp: 5, pip: 6, tip: 8 },
  { name: 'middle', mcp: 9, pip: 10, tip: 12 },
  { name: 'ring', mcp: 13, pip: 14, tip: 16 },
  { name: 'pinky', mcp: 17, pip: 18, tip: 20 },
] as const

function distance2D(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function distance3D(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function angleDeg(a: Point, vertex: Point, b: Point): number {
  const first = { x: a.x - vertex.x, y: a.y - vertex.y, z: a.z - vertex.z }
  const second = { x: b.x - vertex.x, y: b.y - vertex.y, z: b.z - vertex.z }
  const product = first.x * second.x + first.y * second.y + first.z * second.z
  const denominator = distance3D(a, vertex) * distance3D(b, vertex)
  if (denominator === 0) return 0
  const cosine = Math.max(-1, Math.min(1, product / denominator))
  return (Math.acos(cosine) * 180) / Math.PI
}

function projection(from: Point, ontoStart: Point, ontoEnd: Point): number {
  const dx = ontoEnd.x - ontoStart.x
  const dy = ontoEnd.y - ontoStart.y
  const denominator = dx * dx + dy * dy
  if (denominator === 0) return 0
  return ((from.x - ontoStart.x) * dx + (from.y - ontoStart.y) * dy) / denominator
}

function cross(a: Point, b: Point): Point {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function scale(point: Point, factor: number): Point {
  return { x: point.x * factor, y: point.y * factor, z: point.z * factor }
}

export type FeatureValues = Record<FeatureId, number>

export function computeFeatures(landmarks: Landmarks): {
  handSize: number
  values: FeatureValues
} {
  const handSize = distance2D(landmarks[0], landmarks[5])
  const divisor = handSize || 1
  const values = {} as FeatureValues

  const palmOrigin = landmarks[0]
  const palmAxis = subtract(landmarks[9], palmOrigin)
  const palmLength = distance3D(landmarks[9], palmOrigin)
  const palmDirection =
    palmLength === 0 ? { x: 0, y: 0, z: 0 } : scale(palmAxis, 1 / palmLength)
  const widthAxis = subtract(landmarks[17], landmarks[5])
  const widthPerpendicular = subtract(
    widthAxis,
    scale(palmDirection, dot(widthAxis, palmDirection)),
  )
  const palmWidth = distance3D(widthPerpendicular, { x: 0, y: 0, z: 0 })
  const widthDirection =
    palmWidth === 0
      ? { x: 0, y: 0, z: 0 }
      : scale(widthPerpendicular, 1 / palmWidth)
  const palmNormal = cross(palmDirection, widthDirection)
  const palmNormalLength = distance3D(palmNormal, { x: 0, y: 0, z: 0 })
  const normalDirection =
    palmNormalLength === 0
      ? { x: 0, y: 0, z: 0 }
      : scale(palmNormal, 1 / palmNormalLength)
  const palmFrameValid =
    palmLength > 0 && palmWidth > 0 && palmNormalLength > 0

  values['curl.thumb'] = angleDeg(landmarks[1], landmarks[2], landmarks[4])
  for (const joint of fingerJoints) {
    values[`curl.${joint.name}`] = angleDeg(
      landmarks[joint.mcp],
      landmarks[joint.pip],
      landmarks[joint.tip],
    )
  }

  values['spread.indexMiddle'] = distance2D(landmarks[8], landmarks[12]) / divisor
  values['spread.middleRing'] = distance2D(landmarks[12], landmarks[16]) / divisor
  values['spread.ringPinky'] = distance2D(landmarks[16], landmarks[20]) / divisor
  values['touch.thumbIndex'] = distance2D(landmarks[4], landmarks[8]) / divisor
  values['touch.thumbMiddle'] = distance2D(landmarks[4], landmarks[12]) / divisor
  values['touch.thumbRing'] = distance2D(landmarks[4], landmarks[16]) / divisor
  values['touch.thumbPinky'] = distance2D(landmarks[4], landmarks[20]) / divisor
  values['thumb.across'] = projection(landmarks[4], landmarks[5], landmarks[17])
  values['thumb.height'] = projection(landmarks[4], landmarks[0], landmarks[9])

  const pointingX = landmarks[9].x - landmarks[0].x
  const pointingY = landmarks[9].y - landmarks[0].y
  values['hand.pointing'] =
    (Math.atan2(pointingX, -pointingY) * 180) / Math.PI

  const normal = cross(
    {
      x: landmarks[5].x - landmarks[0].x,
      y: landmarks[5].y - landmarks[0].y,
      z: landmarks[5].z - landmarks[0].z,
    },
    {
      x: landmarks[17].x - landmarks[0].x,
      y: landmarks[17].y - landmarks[0].y,
      z: landmarks[17].z - landmarks[0].z,
    },
  )
  const normalLength = Math.hypot(normal.x, normal.y, normal.z)
  values['hand.facing'] = normalLength === 0 ? 0 : normal.z / normalLength

  const fingertips = [
    { finger: 'thumb', tip: 4 },
    { finger: 'index', tip: 8 },
    { finger: 'middle', tip: 12 },
    { finger: 'ring', tip: 16 },
    { finger: 'pinky', tip: 20 },
  ] as const
  for (const { finger, tip } of fingertips) {
    const tipFromIndex = subtract(landmarks[tip], landmarks[5])
    const tipFromWrist = subtract(landmarks[tip], palmOrigin)
    values[`tip.${finger}.x` as FeatureId] = palmFrameValid
      ? dot(tipFromIndex, widthDirection) / palmWidth
      : 0
    values[`tip.${finger}.y` as FeatureId] = palmFrameValid
      ? dot(tipFromWrist, palmDirection) / palmLength
      : 0
  }
  values['tip.thumb.depth'] = palmFrameValid
    ? dot(subtract(landmarks[4], palmOrigin), normalDirection) / palmLength
    : 0

  const directionFingers = [
    { finger: 'thumb', base: 2, tip: 4 },
    { finger: 'index', base: 5, tip: 8 },
    { finger: 'middle', base: 9, tip: 12 },
    { finger: 'ring', base: 13, tip: 16 },
    { finger: 'pinky', base: 17, tip: 20 },
  ] as const
  for (const { finger, base, tip } of directionFingers) {
    const direction = subtract(landmarks[tip], landmarks[base])
    values[`dir.${finger}` as FeatureId] = palmFrameValid
      ? (Math.atan2(
          dot(direction, widthDirection),
          dot(direction, palmDirection),
        ) *
          180) /
        Math.PI
      : 0
  }

  for (const joint of fingerJoints) {
    values[`base.${joint.name}` as FeatureId] = angleDeg(
      palmOrigin,
      landmarks[joint.mcp],
      landmarks[joint.pip],
    )
  }
  values['cross.indexMiddle'] =
    values['tip.index.x'] - values['tip.middle.x']

  return { handSize, values }
}

export class FeatureSmoother {
  private previous: Partial<FeatureValues> = {}
  private readonly alpha = 0.5

  update(values: FeatureValues): FeatureValues {
    const smoothed = {} as FeatureValues
    for (const id of FEATURE_IDS) {
      const prior = this.previous[id]
      let next: number
      if (prior === undefined) {
        next = values[id]
      } else if (FEATURES[id].kind === 'angle') {
        const first = (prior * Math.PI) / 180
        const second = (values[id] * Math.PI) / 180
        next =
          (Math.atan2(
            Math.sin(first) * 0.5 + Math.sin(second) * 0.5,
            Math.cos(first) * 0.5 + Math.cos(second) * 0.5,
          ) *
            180) /
          Math.PI
      } else {
        next = prior + (values[id] - prior) * this.alpha
      }
      smoothed[id] = next
    }
    this.previous = smoothed
    return smoothed
  }

  reset(): void {
    this.previous = {}
  }
}

export function getFeatureHelp(
  feature: FeatureId,
  direction: 'below' | 'above',
): string {
  const info = FEATURES[feature]
  return direction === 'below' ? info.helpBelow : info.helpAbove
}

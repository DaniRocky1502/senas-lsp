import { useEffect, useRef, useState } from 'react'
import type { HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { toCanonical } from '../geometry/canonical'
import { computeFeatures, FeatureSmoother, type FeatureValues } from '../geometry/features'
import type { Handedness, Landmarks } from '../geometry/types'
import { createHandTracker } from './handTracker'

export type TrackedHand = {
  canonicalLandmarks: Landmarks | null
  rawLandmarks: Landmarks | null
  features: FeatureValues | null
  handSize: number
  handedness: Handedness | null
}

export type TrackingStatus =
  | 'loadingModel'
  | 'requestingCamera'
  | 'denied'
  | 'ready'
  | 'error'

const noHand: TrackedHand = {
  canonicalLandmarks: null,
  rawLandmarks: null,
  features: null,
  handSize: 0,
  handedness: null,
}

function asPoint(landmark: NormalizedLandmark) {
  return { x: landmark.x, y: landmark.y, z: landmark.z }
}

function handednessFromResult(
  result: ReturnType<HandLandmarker['detectForVideo']>,
): Handedness {
  const category = result.handedness[0]?.[0]?.categoryName
  return category === 'Left' ? 'Left' : 'Right'
}

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active = true,
  onFrame?: (hand: TrackedHand) => void,
) {
  const [status, setStatus] = useState<TrackingStatus>('loadingModel')
  const [hand, setHand] = useState<TrackedHand>(noHand)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const callbackRef = useRef<(hand: TrackedHand) => void>(() => {})

  useEffect(() => {
    callbackRef.current = onFrame ?? (() => {})
  }, [onFrame])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    let stream: MediaStream | null = null
    let tracker: HandLandmarker | null = null
    let animationFrame = 0
    let lastVideoTime = -1
    const smoother = new FeatureSmoother()

    const update = (next: TrackedHand) => {
      setHand(next)
      callbackRef.current(next)
    }

    async function start() {
      try {
        setStatus('loadingModel')
        tracker = await createHandTracker()
        if (cancelled) return
        setStatus('requestingCamera')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setStatus('ready')

        const detect = () => {
          if (cancelled || !tracker || !video) return
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime
            const result = tracker.detectForVideo(video, performance.now())
            if (result.landmarks[0]) {
              const rawLandmarks = result.landmarks[0].map(asPoint)
              const handedness = handednessFromResult(result)
              const canonicalLandmarks = toCanonical(
                rawLandmarks,
                video.videoWidth / video.videoHeight,
                handedness,
              )
              const computed = computeFeatures(canonicalLandmarks)
              update({
                rawLandmarks,
                canonicalLandmarks,
                features: smoother.update(computed.values),
                handSize: computed.handSize,
                handedness,
              })
            } else {
              smoother.reset()
              update(noHand)
            }
          }
          animationFrame = requestAnimationFrame(detect)
        }
        animationFrame = requestAnimationFrame(detect)
      } catch (error) {
        if (cancelled) return
        if (
          error instanceof DOMException &&
          (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')
        ) {
          setStatus('denied')
        } else {
          setErrorMessage('No pudimos iniciar la cámara. Revisa tu conexión y vuelve a intentarlo.')
          setStatus('error')
        }
      }
    }

    void start()
    return () => {
      cancelled = true
      cancelAnimationFrame(animationFrame)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [active, videoRef])

  return { status, hand, errorMessage }
}

import { useEffect, useRef } from 'react'
import type { TrackedHand, TrackingStatus } from '../vision/useHandTracking'
import { useHandTracking } from '../vision/useHandTracking'

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

const STATUS_MESSAGES: Record<TrackingStatus, string> = {
  loadingModel: 'Cargando el modelo de la mano…',
  requestingCamera: 'Pidiendo permiso para usar la cámara…',
  denied: 'No pudimos abrir la cámara. Permite su uso en los ajustes del navegador.',
  ready: 'Pon tu mano frente a la cámara',
  error: 'No pudimos preparar la cámara. Revisa tu conexión y vuelve a intentarlo.',
}

export function CameraView({
  onFrame,
  className = '',
}: {
  onFrame?: (hand: TrackedHand) => void
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tracking = useHandTracking(videoRef, true, onFrame)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !video || !context) return
    const width = video.videoWidth
    const height = video.videoHeight
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    context.clearRect(0, 0, width, height)
    const points = tracking.hand.rawLandmarks
    if (!points) return
    context.lineWidth = Math.max(2, width * 0.006)
    context.strokeStyle = '#ffe06c'
    context.fillStyle = '#ff8c57'
    for (const [start, end] of CONNECTIONS) {
      context.beginPath()
      context.moveTo(points[start].x * width, points[start].y * height)
      context.lineTo(points[end].x * width, points[end].y * height)
      context.stroke()
    }
    for (const point of points) {
      context.beginPath()
      context.arc(point.x * width, point.y * height, Math.max(3, width * 0.009), 0, Math.PI * 2)
      context.fill()
    }
  }, [tracking.hand.rawLandmarks])

  return (
    <div className={`camera-view ${className}`}>
      <div className="camera-frame">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Vista de la cámara" />
        <canvas ref={canvasRef} aria-hidden="true" />
        {tracking.hand.features === null && (
          <p className="camera-message" role="status">
            {tracking.status === 'denied' && <><strong>La cámara está apagada.</strong><br /></>}
            {tracking.status === 'error' ? tracking.errorMessage : STATUS_MESSAGES[tracking.status]}
          </p>
        )}
        {tracking.hand.features !== null && (
          <span className="camera-ready" aria-label="Mano detectada">¡Te veo! 👋</span>
        )}
      </div>
    </div>
  )
}

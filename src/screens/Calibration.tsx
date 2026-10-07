import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraView } from '../components/CameraView'
import { buildFingerLetter, FINGER_FEATURES } from '../calibration/propose'
import { FEATURES, type FeatureId } from '../geometry/features'
import { deleteLetterOverride, exportLetters, importLetters, loadLetters, saveLetter } from '../letters/store'
import { evaluateLetter } from '../scoring/evaluate'
import type { LetterSet } from '../scoring/types'
import type { TrackedHand } from '../vision/useHandTracking'

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'

type CaptureStage = 'idle' | 'countdown' | 'recording'

function displayValue(feature: FeatureId, value: number): string {
  return FEATURES[feature].unit === '°' ? value.toFixed(0) : value.toFixed(2)
}

export function Calibration({
  letters,
  onLettersChanged,
  onHome,
}: {
  letters: LetterSet
  onLettersChanged: (letters: LetterSet) => void
  onHome: () => void
}) {
  const [hand, setHand] = useState<TrackedHand | null>(null)
  const [letter, setLetter] = useState('')
  const [captureStage, setCaptureStage] = useState<CaptureStage>('idle')
  const [countdown, setCountdown] = useState(3)
  const [sampleCount, setSampleCount] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [messageError, setMessageError] = useState(false)
  const samples = useRef<Record<FeatureId, number>[]>([])
  const lettersRef = useRef(letters)
  const onLettersChangedRef = useRef(onLettersChanged)
  const letterRef = useRef('')
  const stageRef = useRef<CaptureStage>('idle')
  const captureRef = useRef(false)
  const countdownTimer = useRef<number | null>(null)
  const captureTimer = useRef<number | null>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const startCaptureRef = useRef<(nextLetter: string) => void>(() => {})

  useEffect(() => {
    lettersRef.current = letters
    onLettersChangedRef.current = onLettersChanged
  }, [letters, onLettersChanged])

  const updateCaptureStage = useCallback((stage: CaptureStage) => {
    stageRef.current = stage
    setCaptureStage(stage)
  }, [])

  const finishCapture = useCallback(() => {
    captureRef.current = false
    captureTimer.current = null
    updateCaptureStage('idle')
    const currentLetter = letterRef.current
    try {
      const definition = buildFingerLetter(
        currentLetter,
        samples.current,
        lettersRef.current[currentLetter],
      )
      saveLetter(definition)
      onLettersChangedRef.current(loadLetters())
      setMessage(`¡Guardamos la ${currentLetter}! Ahora prueba otra letra.`)
      setMessageError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos usar esas muestras.')
      setMessageError(true)
    }
  }, [updateCaptureStage])

  const startCapture = useCallback((nextLetter: string) => {
    if (stageRef.current !== 'idle') return
    letterRef.current = nextLetter
    setLetter(nextLetter)
    if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current)
    if (captureTimer.current !== null) window.clearTimeout(captureTimer.current)
    samples.current = []
    setSampleCount(0)
    captureRef.current = false
    let remaining = 3
    setCountdown(remaining)
    setMessage(null)
    setMessageError(false)
    updateCaptureStage('countdown')
    countdownTimer.current = window.setInterval(() => {
      remaining -= 1
      if (remaining > 0) {
        setCountdown(remaining)
        return
      }
      if (countdownTimer.current !== null) {
        window.clearInterval(countdownTimer.current)
        countdownTimer.current = null
      }
      updateCaptureStage('recording')
      captureRef.current = true
      captureTimer.current = window.setTimeout(finishCapture, 3000)
    }, 1000)
  }, [finishCapture, updateCaptureStage])

  useEffect(() => {
    startCaptureRef.current = startCapture
  }, [startCapture])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      const nextLetter = event.key.toUpperCase()
      if (!ALPHABET.includes(nextLetter) || stageRef.current !== 'idle') return
      startCaptureRef.current(nextLetter)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(
    () => () => {
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current)
      if (captureTimer.current !== null) window.clearTimeout(captureTimer.current)
    },
    [],
  )

  function handleFrame(next: TrackedHand) {
    setHand(next)
    if (captureRef.current && next.features) {
      samples.current.push(next.features)
      setSampleCount(samples.current.length)
    }
  }

  async function handleExport() {
    try {
      await navigator.clipboard.writeText(exportLetters())
      setMessage('¡Copiamos el JSON de todas las letras!')
      setMessageError(false)
    } catch {
      setMessage('No pudimos copiar. Revisa los permisos del navegador.')
      setMessageError(true)
    }
  }

  async function handleImport(file: File | undefined) {
    if (!file) return
    try {
      const count = importLetters(await file.text())
      onLettersChangedRef.current(loadLetters())
      setMessage(`¡Importamos ${count} letras!`)
      setMessageError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos importar el archivo.')
      setMessageError(true)
    }
  }

  function handleDelete() {
    if (!letter || stageRef.current !== 'idle') return
    deleteLetterOverride(letter)
    onLettersChangedRef.current(loadLetters())
    setMessage(`Borramos tu versión de ${letter}.`)
    setMessageError(false)
  }

  const stageMessage =
    captureStage === 'countdown'
      ? `Prepárate: ${countdown}…`
      : captureStage === 'recording'
        ? `Grabando ${letter}… ¡mantén la seña!`
        : letter
          ? 'Lista para la siguiente seña.'
          : 'Elige una letra para empezar.'

  return (
    <main className="page-shell calibration-screen">
      <header className="page-heading">
        <button className="back-button" onClick={onHome} aria-label="Volver al inicio">←</button>
        <div><p className="eyebrow">Herramienta para profes</p><h1>Calibración rápida</h1></div>
      </header>
      <p className="section-intro">
        Elige una letra (o presiona su tecla), haz la seña y mantenla quieta. Se guarda sola.
      </p>
      <p className="calibration-hint">Solo medimos cuánto se dobla cada dedo.</p>
      <div className="letter-grid calibration-letter-grid" aria-label="Elige una letra">
        {[...ALPHABET].map((option) => (
          <button
            key={option}
            className={`letter-choice ${letter === option ? 'selected' : ''}`}
            onClick={() => startCapture(option)}
            disabled={captureStage !== 'idle'}
            aria-pressed={letter === option}
          >
            {option}
            {letters[option]?.status === 'calibrada' ? (
              <span className="calibrated-marker" aria-label="calibrada">✓</span>
            ) : letters[option]?.status === 'borrador' ? (
              <span className="draft-marker" aria-label="borrador">•</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="calibration-grid quick-calibration-grid">
        <section className="calibration-camera-panel">
          <div className="calibration-current">
            <span className="calibration-current-letter" aria-label={letter ? `Letra ${letter}` : 'Sin letra elegida'}>
              {letter || '¿?'}
            </span>
            <div>
              <p className="eyebrow">Letra actual</p>
              <h2>{stageMessage}</h2>
              {captureStage === 'recording' && (
                <p className="capture-count">Muestras: {sampleCount}</p>
              )}
            </div>
          </div>
          <CameraView onFrame={handleFrame} />
        </section>
        <section className="feature-table-panel">
          <h2>Lo que ve la cámara</h2>
          <div className="feature-table calibration-feature-table">
            {FINGER_FEATURES.map((feature) => (
              <div className="feature-live-row" key={feature}>
                <span>{FEATURES[feature].label}</span>
                <strong>
                  {hand?.features ? displayValue(feature, hand.features[feature]) : '—'}
                </strong>
                <small>{FEATURES[feature].unit}</small>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="editor-actions calibration-actions">
        <button className="button button-small" onClick={handleExport}>
          Copiar JSON de todas las letras
        </button>
        <button className="button button-small" onClick={() => importInput.current?.click()}>
          Importar JSON
        </button>
        {letter && (
          <button
            className="button button-danger"
            onClick={handleDelete}
            disabled={captureStage !== 'idle'}
          >
            Borrar mi versión de {letter}
          </button>
        )}
        <input
          ref={importInput}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void handleImport(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      {message && (
        <p className={`form-message ${messageError ? 'message-error' : ''}`} role="status">
          {message}
        </p>
      )}

      <section className="all-letters-panel">
        <h2>Todas las letras a la vez</h2>
        <p>Si varias letras se parecen mucho, quizá les falta una condición.</p>
        <div className="all-letters-grid">
          {Object.values(letters)
            .sort((first, second) => first.letter.localeCompare(second.letter))
            .map((definition) => {
              const result = hand?.features
                ? evaluateLetter(definition, hand.features, hand.handSize).score
                : 0
              return (
                <div className="letter-score-row" key={definition.letter}>
                  <strong>{definition.letter}</strong>
                  <div className="score-track"><span style={{ width: `${result * 100}%` }} /></div>
                  <small>{Math.round(result * 100)}%</small>
                </div>
              )
            })}
        </div>
      </section>
    </main>
  )
}

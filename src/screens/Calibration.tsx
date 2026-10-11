import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CameraView } from '../components/CameraView'
import { buildFingerLetter, FINGER_FEATURES } from '../calibration/propose'
import { findSimilarPairs, separatingFeatures } from '../calibration/analysis'
import {
  addAttempt,
  clearAttempts,
  loadAttempts,
  scoreAttempt,
  summarize,
  type ConfusionAttempt,
} from '../calibration/confusion'
import { FEATURES, type FeatureId } from '../geometry/features'
import {
  combineImportedLetters,
  deleteLetterOverride,
  exportLetters,
  importLetters,
  loadLetters,
  saveLetter,
} from '../letters/store'
import { evaluateLetter } from '../scoring/evaluate'
import type { LetterSet } from '../scoring/types'
import type { TrackedHand } from '../vision/useHandTracking'

const ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVWXY'

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
  const [mode, setMode] = useState<'calibrar' | 'probar'>('calibrar')
  const [captureStage, setCaptureStage] = useState<CaptureStage>('idle')
  const [countdown, setCountdown] = useState(3)
  const [sampleCount, setSampleCount] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [messageError, setMessageError] = useState(false)
  const [attempts, setAttempts] = useState<ConfusionAttempt[]>(loadAttempts)
  const samples = useRef<Record<FeatureId, number>[]>([])
  const sampleHandSizes = useRef<number[]>([])
  const lettersRef = useRef(letters)
  const onLettersChangedRef = useRef(onLettersChanged)
  const letterRef = useRef('')
  const modeRef = useRef<'calibrar' | 'probar'>('calibrar')
  const stageRef = useRef<CaptureStage>('idle')
  const captureRef = useRef(false)
  const countdownTimer = useRef<number | null>(null)
  const captureTimer = useRef<number | null>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const combineInput = useRef<HTMLInputElement>(null)
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
      if (modeRef.current === 'probar') {
        const result = scoreAttempt(
          currentLetter,
          samples.current,
          sampleHandSizes.current,
          lettersRef.current,
        )
        addAttempt({
          target: result.target,
          recognized: result.recognized,
          accepted: result.accepted,
        })
        setAttempts(loadAttempts())
        const acceptedLetters = result.accepted.length
          ? result.accepted.join(', ')
          : 'ninguna'
        setMessage(
          `La app creyó que era ${result.recognized}. Letras que pasaron el 90%: ${acceptedLetters}.`,
        )
      } else {
        const definition = buildFingerLetter(
          currentLetter,
          samples.current,
          lettersRef.current[currentLetter],
        )
        saveLetter(definition)
        onLettersChangedRef.current(loadLetters())
        setMessage(`¡Guardamos la ${currentLetter}! Ahora prueba otra letra.`)
      }
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
    sampleHandSizes.current = []
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
      sampleHandSizes.current.push(next.handSize)
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

  function handleDownload() {
    let objectUrl: string | null = null
    try {
      const blob = new Blob([exportLetters()], { type: 'application/json' })
      objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = 'letras-lsp.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setMessage('¡Descargamos el JSON de todas las letras!')
      setMessageError(false)
    } catch {
      setMessage('No pudimos descargar el archivo.')
      setMessageError(true)
    } finally {
      if (objectUrl) {
        const url = objectUrl
        window.setTimeout(() => URL.revokeObjectURL(url), 0)
      }
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

  async function handleCombineImport(file: File | undefined) {
    if (!file) return
    try {
      const count = combineImportedLetters(await file.text())
      onLettersChangedRef.current(loadLetters())
      setMessage(`¡Combinamos ${count} letras con las tuyas!`)
      setMessageError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos importar el archivo.')
      setMessageError(true)
    }
  }

  function handleDelete() {
    if (!letter || modeRef.current !== 'calibrar' || stageRef.current !== 'idle') return
    deleteLetterOverride(letter)
    onLettersChangedRef.current(loadLetters())
    setMessage(`Borramos tu versión de ${letter}.`)
    setMessageError(false)
  }

  async function handleCopyAttempts() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(attempts, null, 2))
      setMessage('¡Copiamos los resultados de las pruebas!')
      setMessageError(false)
    } catch {
      setMessage('No pudimos copiar. Revisa los permisos del navegador.')
      setMessageError(true)
    }
  }

  function handleClearAttempts() {
    clearAttempts()
    setAttempts([])
    setMessage('Borramos las pruebas de confusión.')
    setMessageError(false)
  }

  function changeMode(nextMode: 'calibrar' | 'probar') {
    modeRef.current = nextMode
    setMode(nextMode)
    setMessage(null)
    setMessageError(false)
  }

  const confusionRows = useMemo(() => summarize(attempts), [attempts])
  const similarPairs = useMemo(() => {
    const pairs = new Map<string, [string, string]>()
    for (const pair of findSimilarPairs(letters)) {
      pairs.set(pair.join('\u0000'), pair)
    }
    for (const attempt of attempts) {
      if (attempt.target === attempt.recognized) continue
      const pair = [attempt.target, attempt.recognized].sort((a, b) =>
        a.localeCompare(b),
      ) as [string, string]
      pairs.set(pair.join('\u0000'), pair)
    }
    return [...pairs.values()].sort(
      (first, second) =>
        first[0].localeCompare(second[0]) ||
        first[1].localeCompare(second[1]),
    )
  }, [letters, attempts])

  const stageMessage =
    captureStage === 'countdown'
      ? `Prepárate: ${countdown}…`
      : captureStage === 'recording'
        ? `Grabando ${letter}… ¡mantén la seña!`
        : letter
          ? mode === 'probar'
            ? 'Lista para probar esta seña.'
            : 'Lista para la siguiente seña.'
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
      <p className="calibration-hint">
        El puntaje usa cuánto se dobla cada dedo. También guardamos otras medidas (pulgar, dirección de los dedos) para separar letras parecidas.
      </p>
      <div className="calibration-mode-toggle" role="group" aria-label="Modo de calibración">
        <button
          className={`button button-small ${mode === 'calibrar' ? 'button-primary' : 'button-muted'}`}
          onClick={() => changeMode('calibrar')}
          disabled={captureStage !== 'idle'}
          aria-pressed={mode === 'calibrar'}
        >
          Calibrar
        </button>
        <button
          className={`button button-small ${mode === 'probar' ? 'button-primary' : 'button-muted'}`}
          onClick={() => changeMode('probar')}
          disabled={captureStage !== 'idle'}
          aria-pressed={mode === 'probar'}
        >
          Probar
        </button>
      </div>
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
        <button className="button button-small" onClick={handleDownload}>
          Descargar JSON
        </button>
        <button className="button button-small" onClick={() => importInput.current?.click()}>
          Importar JSON (reemplaza)
        </button>
        <button className="button button-small" onClick={() => combineInput.current?.click()}>
          Combinar JSON de otra persona
        </button>
        {letter && mode === 'calibrar' && (
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
        <input
          ref={combineInput}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void handleCombineImport(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      <p className="calibration-import-help">
        Reemplazar cambia tus letras por las del archivo. Combinar las suma: la letra aceptará ambas manos.
      </p>
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

      <section className="confusion-panel">
        <h2>Prueba de confusión</h2>
        {!confusionRows.length && (
          <p>Elige Probar y haz cada letra unas 5 veces.</p>
        )}
        <div className="confusion-actions">
          <button className="button button-small" onClick={() => void handleCopyAttempts()}>
            Copiar resultados
          </button>
          <button className="button button-small button-danger" onClick={handleClearAttempts}>
            Borrar pruebas
          </button>
        </div>
        {confusionRows.length > 0 && (
          <div className="confusion-table-wrap">
            <table className="confusion-table">
              <thead>
                <tr>
                  <th>Letra</th>
                  <th>Intentos</th>
                  <th>Aciertos</th>
                  <th>Se confundió con</th>
                </tr>
              </thead>
              <tbody>
                {confusionRows.map((row) => {
                  const confusions = Object.entries(row.confusedWith)
                    .sort(
                      ([firstLetter, firstCount], [secondLetter, secondCount]) =>
                        secondCount - firstCount ||
                        firstLetter.localeCompare(secondLetter),
                    )
                    .map(([otherLetter, count]) => `${otherLetter} (${count})`)
                    .join(', ')
                  return (
                    <tr key={row.target}>
                      <th scope="row">{row.target}</th>
                      <td>{row.attempts}</td>
                      <td>{row.correct}</td>
                      <td>{confusions || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="confusion-panel similar-letters-panel">
        <h2>Letras parecidas y qué las separa</h2>
        <p>Las medidas extra solo existen en letras calibradas desde ahora.</p>
        {similarPairs.length ? (
          <ul className="similar-pair-list">
            {similarPairs.map(([firstLetter, secondLetter]) => {
              const first = letters[firstLetter]
              const second = letters[secondLetter]
              const separating = first && second
                ? separatingFeatures(first, second).slice(0, 3)
                : []
              return (
                <li className="similar-pair-card" key={`${firstLetter}-${secondLetter}`}>
                  <strong>{firstLetter} y {secondLetter}</strong>
                  {separating.length ? (
                    <ul>
                      {separating.map(({ feature, ratio }) => (
                        <li key={feature}>
                          {FEATURES[feature].label} ({ratio.toFixed(1)}×)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      Ninguna medida las separa todavía: vuelve a calibrar estas dos letras.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p>No encontramos letras parecidas todavía.</p>
        )}
      </section>
    </main>
  )
}

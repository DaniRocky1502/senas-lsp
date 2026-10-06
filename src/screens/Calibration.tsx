import { useEffect, useRef, useState } from 'react'
import { CameraView } from '../components/CameraView'
import { FEATURES, FEATURE_IDS, type FeatureId } from '../geometry/features'
import { proposeConstraints } from '../calibration/propose'
import { evaluateLetter } from '../scoring/evaluate'
import type { Constraint, LetterDef, LetterSet } from '../scoring/types'
import type { TrackedHand } from '../vision/useHandTracking'
import {
  deleteLetterOverride,
  exportLetters,
  importLetters,
  loadLetters,
  saveLetter,
} from '../letters/store'

const DEFAULT_SELECTED: FeatureId[] = [
  'curl.thumb',
  'curl.index',
  'curl.middle',
  'curl.ring',
  'curl.pinky',
  'hand.pointing',
]

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
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<FeatureId[]>(DEFAULT_SELECTED)
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [captureStage, setCaptureStage] = useState<'idle' | 'countdown' | 'recording'>('idle')
  const [countdown, setCountdown] = useState(3)
  const [sampleCount, setSampleCount] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [messageError, setMessageError] = useState(false)
  const samples = useRef<Record<FeatureId, number>[]>([])
  const selectedRef = useRef(selected)
  const captureRef = useRef(false)
  const countdownTimer = useRef<number | null>(null)
  const captureTimer = useRef<number | null>(null)
  const importInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

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

  function finishCapture() {
    captureRef.current = false
    setCaptureStage('idle')
    try {
      const proposed = proposeConstraints(samples.current, selectedRef.current)
      setConstraints(
        proposed.map((constraint) => ({
          ...constraint,
          required: constraint.feature === 'hand.pointing',
        })),
      )
      setMessage(`¡Listo! Juntamos ${samples.current.length} muestras.`)
      setMessageError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos usar esas muestras.')
      setMessageError(true)
    }
  }

  function startCapture() {
    if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current)
    if (captureTimer.current !== null) window.clearTimeout(captureTimer.current)
    samples.current = []
    setSampleCount(0)
    captureRef.current = false
    let remaining = 3
    setCountdown(remaining)
    setCaptureStage('countdown')
    setMessage(null)
    countdownTimer.current = window.setInterval(() => {
      remaining -= 1
      if (remaining > 0) {
        setCountdown(remaining)
        return
      }
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current)
      setCaptureStage('recording')
      captureRef.current = true
      captureTimer.current = window.setTimeout(finishCapture, 3000)
    }, 1000)
  }

  function setFeatureSelected(feature: FeatureId, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, feature] : current.filter((item) => item !== feature),
    )
    if (samples.current.length < 10 || !constraints.length) return
    if (checked) {
      if (constraints.some((constraint) => constraint.feature === feature)) return
      const proposal = proposeConstraints(samples.current, [feature])[0]
      if (proposal) {
        setConstraints((current) =>
          current.some((constraint) => constraint.feature === feature)
            ? current
            : [...current, { ...proposal, required: feature === 'hand.pointing' }],
        )
      }
    } else {
      setConstraints((current) =>
        current.filter((constraint) => constraint.feature !== feature),
      )
    }
  }

  function updateConstraint(index: number, change: Partial<Constraint>) {
    setConstraints((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...change } : item,
      ),
    )
  }

  function handleSave() {
    if (!/^[A-ZÑ]{1,2}$/.test(letter) || !description.trim() || !constraints.length) {
      setMessage('Escribe una o dos letras, una descripción y graba las condiciones.')
      setMessageError(true)
      return
    }
    const definition: LetterDef = {
      letter,
      status: 'calibrada',
      description: description.trim(),
      constraints,
    }
    try {
      saveLetter(definition)
      onLettersChanged(loadLetters())
      setMessage(`¡Guardamos la letra ${letter} en este navegador!`)
      setMessageError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos guardar la letra.')
      setMessageError(true)
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
      onLettersChanged(loadLetters())
      setMessage(`¡Importamos ${count} letras!`)
      setMessageError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos importar el archivo.')
      setMessageError(true)
    }
  }

  function handleDelete() {
    if (!letter) return
    deleteLetterOverride(letter)
    onLettersChanged(loadLetters())
    setMessage(`Borramos tu versión de ${letter}.`)
    setMessageError(false)
  }

  return (
    <main className="page-shell calibration-screen">
      <header className="page-heading">
        <button className="back-button" onClick={onHome} aria-label="Volver al inicio">←</button>
        <div><p className="eyebrow">Herramienta para profes</p><h1>Calibración</h1></div>
      </header>
      <p className="section-intro">
        Mira cómo se mueve tu mano y prepara una letra con la guía MINEDU.
      </p>
      <div className="calibration-grid">
        <section className="calibration-camera-panel">
          <CameraView onFrame={handleFrame} />
          <div className="hand-meta">
            <span>Tamaño de la mano: {hand ? hand.handSize.toFixed(3) : '—'}</span>
            <span>
              Mano: {hand?.handedness === 'Left'
                ? 'izquierda'
                : hand?.handedness === 'Right'
                  ? 'derecha'
                  : '—'}
            </span>
          </div>
          <button
            className="button button-secondary record-button"
            onClick={startCapture}
            disabled={captureStage !== 'idle'}
          >
            {captureStage === 'countdown'
              ? `Prepárate: ${countdown}`
              : captureStage === 'recording'
                ? 'Grabando… ¡mantén la seña!'
                : 'Grabar 3 segundos'}
          </button>
          {captureStage === 'recording' && <p className="capture-count">📸 Muestras: {sampleCount}</p>}
        </section>
        <section className="feature-table-panel">
          <h2>Lo que ve la cámara</h2>
          <div className="feature-table">
            {FEATURE_IDS.map((feature) => (
              <div className="feature-live-row" key={feature}>
                <span>{FEATURES[feature].label}</span>
                <strong>
                  {hand?.features
                    ? displayValue(feature, hand.features[feature])
                    : '—'}
                </strong>
                <small>{FEATURES[feature].unit}</small>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="calibration-editor">
        <div className="calibration-form">
          <h2>Prepara la letra</h2>
          <label>
            Letra (una o dos)
            <input
              value={letter}
              maxLength={2}
              onChange={(event) => setLetter(event.target.value.toUpperCase().replace(/[^A-ZÑ]/g, ''))}
              placeholder="A"
            />
          </label>
          <label>
            ¿Cómo hacemos esta seña?
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mano abierta, dedos hacia arriba"
            />
          </label>
          <fieldset className="feature-selectors">
            <legend>¿Qué partes de la mano cuentan?</legend>
            {FEATURE_IDS.map((feature) => (
              <label key={feature} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={selected.includes(feature)}
                  onChange={(event) => setFeatureSelected(feature, event.target.checked)}
                />
                {FEATURES[feature].label}
              </label>
            ))}
          </fieldset>
        </div>
        <div className="constraint-editor">
          <h2>Condiciones propuestas</h2>
          {constraints.length ? (
            <div className="constraint-edit-list">
              {constraints.map((constraint, index) => (
                <fieldset className="constraint-edit-card" key={`${constraint.feature}-${index}`}>
                  <legend>{FEATURES[constraint.feature].label}</legend>
                  <div className="range-inputs">
                    <label>
                      Desde
                      <input
                        type="number"
                        step="0.01"
                        value={constraint.min}
                        onChange={(event) => updateConstraint(index, { min: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      Hasta
                      <input
                        type="number"
                        step="0.01"
                        value={constraint.max}
                        onChange={(event) => updateConstraint(index, { max: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={constraint.required ?? false}
                      onChange={(event) => updateConstraint(index, { required: event.target.checked })}
                    />
                    Esta parte es necesaria
                  </label>
                  <label>
                    Consejo si falta
                    <input
                      value={constraint.helpBelow ?? ''}
                      onChange={(event) => updateConstraint(index, { helpBelow: event.target.value || undefined })}
                      placeholder={FEATURES[constraint.feature].helpBelow}
                    />
                  </label>
                  <label>
                    Consejo si te pasas
                    <input
                      value={constraint.helpAbove ?? ''}
                      onChange={(event) => updateConstraint(index, { helpAbove: event.target.value || undefined })}
                      placeholder={FEATURES[constraint.feature].helpAbove}
                    />
                  </label>
                </fieldset>
              ))}
            </div>
          ) : (
            <p className="empty-note">Graba tres segundos de una seña para proponer sus condiciones.</p>
          )}
          <div className="editor-actions">
            <button className="button button-primary" onClick={handleSave}>Guardar en este navegador</button>
            <button className="button button-small" onClick={handleExport}>Copiar JSON de todas las letras</button>
            <button className="button button-small" onClick={() => importInput.current?.click()}>Importar JSON</button>
            <button className="button button-danger" onClick={handleDelete}>Borrar mi versión</button>
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
          {message && <p className={`form-message ${messageError ? 'message-error' : ''}`} role="status">{message}</p>}
        </div>
      </section>

      <section className="all-letters-panel">
        <h2>Todas las letras a la vez</h2>
        <p>Si varias letras se parecen mucho, quizá les falta una condición.</p>
        <div className="all-letters-grid">
          {Object.values(letters).sort((a, b) => a.letter.localeCompare(b.letter)).map((definition) => {
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

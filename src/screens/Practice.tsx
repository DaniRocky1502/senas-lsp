import { useState } from 'react'
import { CameraView } from '../components/CameraView'
import { HelpBubble } from '../components/HelpBubble'
import { ProgressRing } from '../components/ProgressRing'
import type { TrackedHand } from '../vision/useHandTracking'
import { FEATURES } from '../geometry/features'
import { evaluateLetter } from '../scoring/evaluate'
import type { LetterSet } from '../scoring/types'

export function Practice({
  letters,
  onHome,
}: {
  letters: LetterSet
  onHome: () => void
}) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<ReturnType<typeof evaluateLetter> | null>(null)
  const [visibleScore, setVisibleScore] = useState(0)
  const definition = selectedLetter ? letters[selectedLetter] : null

  function handleFrame(hand: TrackedHand) {
    if (!definition) return
    const next = evaluateLetter(definition, hand.features, hand.handSize)
    setEvaluation(next)
    setVisibleScore((current) => current + (next.score - current) * 0.25)
  }

  return (
    <main className="page-shell practice-screen">
      <header className="page-heading">
        <button className="back-button" onClick={onHome} aria-label="Volver al inicio">←</button>
        <div><p className="eyebrow">Aprende a tu ritmo</p><h1>Practicar</h1></div>
      </header>
      <p className="section-intro">Elige una letra y prueba cómo se hace.</p>
      <div className="letter-grid" aria-label="Letras para practicar">
        {Object.values(letters).sort((a, b) => a.letter.localeCompare(b.letter)).map((letter) => (
          <button
            key={letter.letter}
            className={`letter-choice ${selectedLetter === letter.letter ? 'selected' : ''}`}
            onClick={() => {
              setSelectedLetter(letter.letter)
              setEvaluation(null)
              setVisibleScore(0)
            }}
          >
            {letter.letter}
            {letter.status === 'borrador' && <span aria-label="borrador">•</span>}
          </button>
        ))}
      </div>
      {definition && (
        <section className="practice-panel">
          <div className="target-card practice-target">
            <div className="target-letter">{definition.letter}</div>
            <div>
              <span className={`status-tag ${definition.status}`}>{definition.status}</span>
              <p>{definition.description}</p>
              <p className="visible-percent">{Math.round(visibleScore * 100)}% parecido</p>
            </div>
          </div>
          <div className="play-area">
            <div className="camera-score">
              <CameraView onFrame={handleFrame} />
              <ProgressRing score={visibleScore} label="Parecido con la seña" />
            </div>
            <div className="practice-feedback">
              <HelpBubble tip={evaluation?.tip ?? 'Muestra tu mano a la cámara'} />
              <h2>Probemos cada parte</h2>
              <ul className="constraint-list">
                {definition.constraints
                  .map((constraint, index) => ({ constraint, index }))
                  .filter(({ constraint }) => (constraint.weight ?? 1) > 0)
                  .map(({ constraint, index }) => {
                    const result = evaluation?.perConstraint[index]
                    const state = !result
                      ? 'waiting'
                      : result.score >= 0.8
                        ? 'good'
                        : result.score >= 0.5
                          ? 'close'
                          : 'try-again'
                    const feature = FEATURES[constraint.feature]
                    return (
                      <li key={`${constraint.feature}-${index}`} className={`constraint-row ${state}`}>
                        <span aria-hidden="true">{state === 'good' ? '✓' : state === 'close' ? '●' : '○'}</span>
                        <span>{feature.label}</span>
                        <strong>
                          {result
                            ? `${feature.kind === 'angle' ? Math.round(result.value) : result.value.toFixed(2)}${feature.unit}`
                            : '—'}
                        </strong>
                      </li>
                    )
                  })}
              </ul>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

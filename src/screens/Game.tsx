import { useEffect, useMemo, useRef, useState } from 'react'
import { CameraView } from '../components/CameraView'
import { Celebration } from '../components/Celebration'
import { HelpBubble } from '../components/HelpBubble'
import { ProgressRing } from '../components/ProgressRing'
import { Stars } from '../components/Stars'
import type { TrackedHand } from '../vision/useHandTracking'
import { evaluateLetter } from '../scoring/evaluate'
import { AcceptanceTracker, ScoreAnimator } from '../scoring/stability'
import type { LetterSet } from '../scoring/types'
import { LEVELS, playableWords, type Level } from '../game/levels'
import { letterPoints, saveLevelProgress, wordStars } from '../game/scoring'

type LetterResult = { skipped: boolean; points: number }

export function Game({
  levelId,
  letters,
  onHome,
}: {
  levelId: string
  letters: LetterSet
  onHome: () => void
}) {
  const level: Level = LEVELS.find((item) => item.id === levelId) ?? LEVELS[0]
  const words = useMemo(() => playableWords(level, letters), [level, letters])
  const [wordIndex, setWordIndex] = useState(0)
  const [letterIndex, setLetterIndex] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'wordDone' | 'levelDone'>('playing')
  const [score, setScore] = useState(0)
  const [tip, setTip] = useState<string | null>('Muestra tu mano a la cámara')
  const [results, setResults] = useState<LetterResult[]>([])
  const [wordScore, setWordScore] = useState(0)
  const [completedStars, setCompletedStars] = useState(0)
  const [completedPoints, setCompletedPoints] = useState(0)
  const animator = useRef(new ScoreAnimator())
  const acceptance = useRef(new AcceptanceTracker())
  const letterStartedAt = useRef(0)
  const lastTipAt = useRef(0)
  const locked = useRef(false)

  const word = words[wordIndex] ?? ''
  const targetLetter = word[letterIndex]
  const definition = letters[targetLetter]

  useEffect(() => {
    acceptance.current.reset()
    animator.current.reset()
    letterStartedAt.current = performance.now()
    locked.current = false
  }, [wordIndex, letterIndex])

  function finishLetter(skipped: boolean) {
    if (locked.current || phase !== 'playing') return
    locked.current = true
    const points = letterPoints((performance.now() - letterStartedAt.current) / 1000, skipped)
    const nextResults = [...results, { skipped, points }]
    setResults(nextResults)
    setWordScore((current) => current + points)
    if (letterIndex + 1 < word.length) {
      window.setTimeout(() => {
        setScore(0)
        setTip('Muestra tu mano a la cámara')
        setLetterIndex((current) => current + 1)
      }, 750)
    } else {
      const stars = wordStars(nextResults)
      setCompletedStars((current) => current + stars)
      setCompletedPoints((current) => current + nextResults.reduce((sum, result) => sum + result.points, 0))
      setPhase('wordDone')
    }
  }

  const handleFrame = (hand: TrackedHand) => {
    if (phase !== 'playing' || !definition) return
    const evaluation = evaluateLetter(definition, hand.features, hand.handSize)
    const now = performance.now()
    setScore(animator.current.update(evaluation.score, now))
    if (evaluation.tip && now - lastTipAt.current >= 700) {
      setTip(evaluation.tip)
      lastTipAt.current = now
    } else if (!evaluation.tip && now - lastTipAt.current >= 700) {
      setTip(null)
      lastTipAt.current = now
    }
    if (acceptance.current.update(evaluation.score, now)) finishLetter(false)
  }

  function nextWord() {
    if (wordIndex + 1 < words.length) {
      setWordIndex((current) => current + 1)
      setLetterIndex(0)
      setResults([])
      setWordScore(0)
      setScore(0)
      setTip('Muestra tu mano a la cámara')
      setPhase('playing')
      return
    }
    saveLevelProgress(level.id, completedStars, completedPoints)
    setPhase('levelDone')
  }

  if (phase === 'levelDone') {
    return (
      <main className="page-shell finish-screen">
        <span className="finish-emoji" aria-hidden="true">🏆</span>
        <p className="eyebrow">¡Terminaste {level.name}!</p>
        <h1>¡Lo lograste!</h1>
        <Stars count={Math.min(3, completedStars)} />
        <p>¡Sumaste {completedStars} estrellas y {completedPoints} puntos!</p>
        <button className="button button-primary" onClick={onHome}>Volver al inicio</button>
      </main>
    )
  }

  if (!words.length || !definition) {
    return (
      <main className="page-shell finish-screen">
        <h1>Faltan letras por calibrar</h1>
        <button className="button button-primary" onClick={onHome}>Volver</button>
      </main>
    )
  }

  return (
    <main className="page-shell game-screen">
      <header className="game-header">
        <button className="back-button" onClick={onHome} aria-label="Volver a los niveles">←</button>
        <div><span className="level-number">{level.emoji} {level.name}</span><h1>¡Forma la palabra!</h1></div>
        <span className="word-points">⭐ {wordScore}</span>
      </header>
      <div className="word-progress" aria-label={`Palabra ${wordIndex + 1} de ${words.length}`}>
        {word.split('').map((letter, index) => (
          <span
            className={`${index < letterIndex || phase === 'wordDone' ? 'letter-done' : ''} ${index === letterIndex && phase === 'playing' ? 'letter-current' : ''}`}
            key={`${index}-${letter}`}
          >{letter}</span>
        ))}
      </div>

      {phase === 'wordDone' ? (
        <section className="word-finish-card">
          <Celebration>¡Lo lograste!</Celebration>
          <Stars count={wordStars(results)} />
          <p>¡Terminaste la palabra {word}!</p>
          <button className="button button-primary" onClick={nextWord}>
            {wordIndex + 1 < words.length ? 'Siguiente palabra' : 'Ver resumen'}
          </button>
        </section>
      ) : (
        <>
          <section className="target-card">
            <div className="target-letter">{targetLetter}</div>
            <div>
              <span className={`status-tag ${definition.status}`}>{definition.status}</span>
              <p>{definition.description}</p>
            </div>
          </section>
          <section className="play-area">
            <div className="camera-score">
              <CameraView onFrame={handleFrame} />
              <ProgressRing score={score} label="Puntaje de la seña" />
            </div>
            <div className="game-guidance">
              <HelpBubble tip={tip} />
              <p className="gentle-reminder">No hay apuro. ¡Tú puedes!</p>
              <button className="button button-skip" onClick={() => finishLetter(true)}>Saltar letra</button>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

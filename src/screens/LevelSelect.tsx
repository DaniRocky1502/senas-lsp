import { loadProgress } from '../game/scoring'
import { LEVELS, missingLetters, playableWords } from '../game/levels'
import type { LetterSet } from '../scoring/types'
import { Stars } from '../components/Stars'

export function LevelSelect({
  letters,
  onChoose,
  onHome,
  onCalibration,
}: {
  letters: LetterSet
  onChoose: (levelId: string) => void
  onHome: () => void
  onCalibration: () => void
}) {
  const progress = loadProgress()
  return (
    <main className="page-shell">
      <header className="page-heading">
        <button className="back-button" onClick={onHome} aria-label="Volver al inicio">←</button>
        <div><p className="eyebrow">Elige una aventura</p><h1>¡Vamos a jugar!</h1></div>
      </header>
      <div className="level-grid">
        {LEVELS.map((level, index) => {
          const words = playableWords(level, letters)
          const missing = missingLetters(level, letters)
          const unlocked = words.length > 0
          return (
            <article className={`level-card ${unlocked ? '' : 'is-locked'}`} key={level.id}>
              <span className="level-emoji" aria-hidden="true">{level.emoji}</span>
              <div className="level-card-copy">
                <span className="level-number">AVENTURA {index + 1}</span>
                <h2>{level.name}</h2>
                {unlocked ? (
                  <>
                    <p>{words.length} {words.length === 1 ? 'palabra lista' : 'palabras listas'}</p>
                    {progress[level.id] && (
                      <Stars count={Math.max(0, Math.min(3, progress[level.id].stars))} />
                    )}
                  </>
                ) : (
                  <p className="locked-copy">Faltan letras por calibrar: {missing.join(', ')}</p>
                )}
              </div>
              {unlocked ? (
                <button className="button button-small" onClick={() => onChoose(level.id)}>¡Jugar!</button>
              ) : (
                <button className="button button-small button-muted" onClick={onCalibration}>Calibrar</button>
              )}
            </article>
          )
        })}
      </div>
    </main>
  )
}

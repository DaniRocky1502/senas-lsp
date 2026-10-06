import { useState } from 'react'
import { loadLetters } from './letters/store'
import type { LetterSet } from './scoring/types'
import { Home } from './screens/Home'
import { LevelSelect } from './screens/LevelSelect'
import { Game } from './screens/Game'
import { Practice } from './screens/Practice'
import { Calibration } from './screens/Calibration'

type Screen = 'home' | 'levels' | 'game' | 'practice' | 'calibration'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [levelId, setLevelId] = useState<string>('vocales')
  const [letters, setLetters] = useState<LetterSet>(() => loadLetters())

  return (
    <div className="app-frame">
      {screen === 'home' && (
        <Home
          onPlay={() => setScreen('levels')}
          onPractice={() => setScreen('practice')}
          onCalibration={() => setScreen('calibration')}
        />
      )}
      {screen === 'levels' && (
        <LevelSelect
          letters={letters}
          onChoose={(id) => {
            setLevelId(id)
            setScreen('game')
          }}
          onHome={() => setScreen('home')}
          onCalibration={() => setScreen('calibration')}
        />
      )}
      {screen === 'game' && (
        <Game levelId={levelId} letters={letters} onHome={() => setScreen('levels')} />
      )}
      {screen === 'practice' && (
        <Practice letters={letters} onHome={() => setScreen('home')} />
      )}
      {screen === 'calibration' && (
        <Calibration
          letters={letters}
          onLettersChanged={setLetters}
          onHome={() => setScreen('home')}
        />
      )}
    </div>
  )
}

export default App

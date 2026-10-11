import { PrivacyNotice } from '../components/PrivacyNotice'

export function Home({
  onPlay,
  onPractice,
  onCalibration,
}: {
  onPlay: () => void
  onPractice: () => void
  onCalibration: () => void
}) {
  return (
    <main className="home-screen">
      <div className="home-sparkle" aria-hidden="true">🌈</div>
      <p className="eyebrow">¡Aprendamos jugando!</p>
      <h1>Señas <span>LSP</span></h1>
      <p className="home-intro">¡Muestra tus manos y descubre las letras!</p>
      <div className="home-actions">
        <button className="button button-primary" onClick={onPlay}>Jugar</button>
        <button className="button button-secondary" onClick={onPractice}>Practicar</button>
      </div>
      <PrivacyNotice />
      <button className="text-link" onClick={onCalibration}>
        Calibración (para profes)
      </button>
      <div className="home-decoration" aria-hidden="true">
        <span>✦</span><span>🖐️</span><span>✿</span>
      </div>
    </main>
  )
}

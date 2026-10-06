export function HelpBubble({ tip }: { tip: string | null }) {
  return (
    <div className="help-bubble" aria-live="polite">
      {tip ?? '¡Sigue así!'}
    </div>
  )
}

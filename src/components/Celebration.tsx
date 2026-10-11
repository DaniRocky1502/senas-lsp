export function Celebration({ children = '¡Muy bien!' }: { children?: string }) {
  return (
    <div className="celebration" role="status">
      <span aria-hidden="true">✨</span> {children} <span aria-hidden="true">🎉</span>
    </div>
  )
}

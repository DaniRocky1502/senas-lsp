export function ProgressRing({ score, label }: { score: number; label?: string }) {
  const percentage = Math.max(0, Math.min(1, score)) * 100
  const color =
    percentage < 50 ? '#f06b69' : percentage < 80 ? '#ffd45c' : '#52c987'
  return (
    <div
      className="progress-ring"
      style={{ '--progress': `${percentage}%`, '--ring-color': color } as React.CSSProperties}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progreso de la seña'}
    >
      <span>{Math.round(percentage)}%</span>
    </div>
  )
}

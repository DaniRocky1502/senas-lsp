export function Stars({ count }: { count: number }) {
  return (
    <span className="stars" aria-label={`${count} estrellas`}>
      {'★'.repeat(Math.max(0, Math.min(3, count)))}
      {'☆'.repeat(Math.max(0, 3 - count))}
    </span>
  )
}

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

// Se arma en el mismo orden que la cuenta carcelera: izquierda, arriba,
// derecha, abajo, y la diagonal cruza al llegar a 5.
const SEGMENTS: Segment[] = [
  { x1: 5, y1: 27, x2: 5, y2: 5 },
  { x1: 5, y1: 5, x2: 27, y2: 5 },
  { x1: 27, y1: 5, x2: 27, y2: 27 },
  { x1: 27, y1: 27, x2: 5, y2: 27 },
  { x1: 5, y1: 5, x2: 27, y2: 27 },
]

export function TallyGroup({ count }: { count: number }) {
  const n = Math.max(0, Math.min(5, count))
  return (
    <svg viewBox="0 0 32 32" className="w-full h-full" aria-hidden>
      <rect x={5} y={5} width={22} height={22} rx={1} fill="none" stroke="var(--color-paper-200)" strokeWidth={1} strokeDasharray="2 3" opacity={0.25} />
      {SEGMENTS.slice(0, n).map((seg, i) => (
        <line
          key={i}
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke="var(--color-ember-500)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

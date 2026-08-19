interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

// Pinwheel order around the box: left, top, right, bottom, then the diagonal.
const SEGMENTS: Segment[] = [
  { x1: 8, y1: 34, x2: 8, y2: 8 }, // 1: left side, head at top
  { x1: 8, y1: 8, x2: 34, y2: 8 }, // 2: top side, head at right
  { x1: 34, y1: 8, x2: 34, y2: 34 }, // 3: right side, head at bottom
  { x1: 34, y1: 34, x2: 8, y2: 34 }, // 4: bottom side, head at left
  { x1: 8, y1: 8, x2: 34, y2: 34 }, // 5: diagonal, head at bottom-right
]

function Stick({ seg, dim }: { seg: Segment; dim?: boolean }) {
  const headR = 3.4
  return (
    <g opacity={dim ? 1 : 1} className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
      <line
        x1={seg.x1}
        y1={seg.y1}
        x2={seg.x2}
        y2={seg.y2}
        stroke="var(--color-matchwood-500)"
        strokeWidth={3.1}
        strokeLinecap="round"
      />
      <line
        x1={seg.x1}
        y1={seg.y1}
        x2={seg.x2}
        y2={seg.y2}
        stroke="var(--color-matchwood-400)"
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.7}
      />
      <circle cx={seg.x2} cy={seg.y2} r={headR} fill="var(--color-matchhead-600)" />
      <circle cx={seg.x2} cy={seg.y2} r={headR} fill="var(--color-matchhead-500)" opacity={0.9} />
      <circle cx={seg.x2 - 1} cy={seg.y2 - 1} r={1} fill="#f3a48f" opacity={0.8} />
    </g>
  )
}

export function MatchstickGroup({ count }: { count: number }) {
  const n = Math.max(0, Math.min(5, count))
  return (
    <svg viewBox="0 0 42 42" className="w-full h-full" aria-hidden>
      <rect x={7} y={7} width={28} height={28} rx={2} fill="none" stroke="var(--color-paper-300)" strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
      {SEGMENTS.slice(0, n).map((seg, i) => (
        <Stick key={i} seg={seg} />
      ))}
    </svg>
  )
}

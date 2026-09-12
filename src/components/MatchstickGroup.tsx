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

// Proporción real de public/matchstick.webp (ancho/alto): la imagen viene
// "parada", con la cabecita arriba, así que cada segmento la escala a su
// largo y la rota para que apunte de un extremo al otro.
const MATCHSTICK_ASPECT = 96 / 220

function Matchstick({ x1, y1, x2, y2 }: Segment) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy)
  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
  const width = length * MATCHSTICK_ASPECT

  return (
    <image
      href="/matchstick.webp"
      x={cx - width / 2}
      y={cy - length / 2}
      width={width}
      height={length}
      transform={`rotate(${angle} ${cx} ${cy})`}
      preserveAspectRatio="none"
    />
  )
}

export function TallyGroup({ count }: { count: number }) {
  const n = Math.max(0, Math.min(5, count))
  return (
    <svg viewBox="0 0 32 32" className="w-full h-full" aria-hidden>
      <rect x={5} y={5} width={22} height={22} rx={1} fill="none" stroke="var(--color-paper-200)" strokeWidth={1} strokeDasharray="2 3" opacity={0.25} />
      {SEGMENTS.slice(0, n).map((seg, i) => (
        <Matchstick key={i} {...seg} />
      ))}
    </svg>
  )
}

import { useRef, useState } from 'react'
import type { ScoreEvent } from '../types'
import { TARGET_SCORE } from '../types'
import { buildProgressionSeries, buildTimeTicks, evalProgressionAt, type ProgressionPoint } from '../lib/scoreProgression'
import { formatDuration } from '../lib/formatDuration'

const VIEW_W = 300
const VIEW_H = 168
const PAD_LEFT = 20
const PAD_RIGHT = 20
const PAD_TOP = 10
const PAD_BOTTOM = 20
const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM
const Y_TICKS = [0, 5, 10, 15, 20, 25, 30]

function mapX(t: number, duration: number): number {
  return PAD_LEFT + (t / duration) * PLOT_W
}
function mapY(v: number): number {
  return PAD_TOP + PLOT_H - (v / TARGET_SCORE) * PLOT_H
}

// Línea recta de un punto al siguiente (no en escalera): son los momentos en
// que ese equipo sumó, unidos directo.
function linePath(points: ProgressionPoint[], duration: number): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.t, duration).toFixed(1)} ${mapY(p.v).toFixed(1)}`)
    .join(' ')
}

export function MatchProgressionChart({
  teamAName,
  teamBName,
  scoreEvents,
  durationSeconds,
}: {
  teamAName: string
  teamBName: string
  scoreEvents: ScoreEvent[]
  durationSeconds: number | null
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverT, setHoverT] = useState<number | null>(null)

  const duration =
    durationSeconds && durationSeconds > 0
      ? durationSeconds
      : scoreEvents.length > 0
        ? Math.max(...scoreEvents.map((e) => e.atSeconds), 1)
        : 0

  // Partidos guardados antes de este campo no tienen eventos: no hay nada
  // que dibujar (y no se puede reconstruir después del hecho).
  if (scoreEvents.length === 0 || duration <= 0) return null

  const pointsA = buildProgressionSeries(scoreEvents, 'A', duration)
  const pointsB = buildProgressionSeries(scoreEvents, 'B', duration)

  const xTicks = buildTimeTicks(duration)

  function handlePointer(clientX: number) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const localX = ((clientX - rect.left) / rect.width) * VIEW_W
    setHoverT(Math.max(0, Math.min(duration, ((localX - PAD_LEFT) / PLOT_W) * duration)))
  }

  const hoverA = hoverT != null ? evalProgressionAt(pointsA, hoverT) : null
  const hoverB = hoverT != null ? evalProgressionAt(pointsB, hoverT) : null
  const hoverX = hoverT != null ? mapX(hoverT, duration) : null

  return (
    <div className="rounded-2xl p-4 border" style={{ borderColor: 'rgba(203, 170, 106, 0.25)' }}>
      <h3 className="font-poster text-lg mb-2 text-center" style={{ color: 'var(--color-ember-500)' }}>
        Progresión
      </h3>
      <div className="flex items-center justify-center gap-4 mb-2 text-xs font-bold">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: 'var(--color-ember-500)' }} />
          <span className="truncate" style={{ color: 'var(--color-paper-100)' }}>
            {teamAName}
          </span>
        </span>
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: 'var(--color-sky-500)' }} />
          <span className="truncate" style={{ color: 'var(--color-paper-100)' }}>
            {teamBName}
          </span>
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto block"
          style={{ touchAction: 'none' }}
          onMouseMove={(e) => handlePointer(e.clientX)}
          onMouseLeave={() => setHoverT(null)}
          onTouchStart={(e) => handlePointer(e.touches[0].clientX)}
          onTouchMove={(e) => handlePointer(e.touches[0].clientX)}
          onTouchEnd={() => setHoverT(null)}
        >
          {Y_TICKS.map((v) => (
            <g key={v}>
              <line
                x1={PAD_LEFT}
                x2={VIEW_W - PAD_RIGHT}
                y1={mapY(v)}
                y2={mapY(v)}
                stroke="rgba(203, 170, 106, 0.15)"
              />
              <text x={PAD_LEFT - 5} y={mapY(v) + 3} fontSize={7} textAnchor="end" fill="var(--color-paper-100)" opacity={0.5}>
                {v}
              </text>
            </g>
          ))}

          {xTicks.map((t) => (
            <g key={t}>
              <line
                x1={mapX(t, duration)}
                x2={mapX(t, duration)}
                y1={PAD_TOP}
                y2={PAD_TOP + PLOT_H}
                stroke="rgba(203, 170, 106, 0.15)"
              />
              <text
                x={mapX(t, duration)}
                y={PAD_TOP + PLOT_H + 12}
                fontSize={7}
                textAnchor={t === 0 ? 'start' : 'middle'}
                fill="var(--color-paper-100)"
                opacity={0.5}
              >
                {Math.round(t / 60)}m
              </text>
            </g>
          ))}
          <line
            x1={mapX(duration, duration)}
            x2={mapX(duration, duration)}
            y1={PAD_TOP}
            y2={PAD_TOP + PLOT_H}
            stroke="var(--color-paper-100)"
            strokeOpacity={0.35}
          />
          <text
            x={mapX(duration, duration)}
            y={PAD_TOP + PLOT_H + 12}
            fontSize={7}
            fontWeight={700}
            textAnchor="end"
            fill="var(--color-paper-100)"
            opacity={0.75}
          >
            {formatDuration(duration)}
          </text>

          <path d={linePath(pointsA, duration)} fill="none" stroke="var(--color-ember-500)" strokeWidth={2} strokeLinejoin="round" />
          <path d={linePath(pointsB, duration)} fill="none" stroke="var(--color-sky-500)" strokeWidth={2} strokeLinejoin="round" />

          {hoverX != null && (
            <>
              <line
                x1={hoverX}
                x2={hoverX}
                y1={PAD_TOP}
                y2={PAD_TOP + PLOT_H}
                stroke="var(--color-paper-100)"
                strokeOpacity={0.4}
                strokeDasharray="2 2"
              />
              <circle cx={hoverX} cy={mapY(hoverA ?? 0)} r={3} fill="var(--color-ember-500)" stroke="var(--color-wood-900)" strokeWidth={1.5} />
              <circle cx={hoverX} cy={mapY(hoverB ?? 0)} r={3} fill="var(--color-sky-500)" stroke="var(--color-wood-900)" strokeWidth={1.5} />
            </>
          )}
        </svg>

        {hoverT != null && hoverX != null && (
          <div
            className="absolute pointer-events-none rounded-lg px-2 py-1.5 text-[11px] leading-tight z-10"
            style={{
              backgroundColor: 'var(--color-wood-800)',
              border: '1px solid rgba(203, 170, 106, 0.3)',
              left: `${(hoverX / VIEW_W) * 100}%`,
              top: `${(Math.min(mapY(hoverA ?? 0), mapY(hoverB ?? 0)) / VIEW_H) * 100}%`,
              transform: 'translate(-50%, -100%)',
              whiteSpace: 'nowrap',
            }}
          >
            <div className="font-bold opacity-60 mb-0.5">{formatDuration(hoverT)}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: 'var(--color-ember-500)' }} />
              <span className="font-num" style={{ color: 'var(--color-paper-100)' }}>
                {Math.round(hoverA ?? 0)}
              </span>
              <span className="w-1.5 h-1.5 rounded-sm shrink-0 ml-1.5" style={{ backgroundColor: 'var(--color-sky-500)' }} />
              <span className="font-num" style={{ color: 'var(--color-paper-100)' }}>
                {Math.round(hoverB ?? 0)}
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-[10.5px] opacity-50 mt-2">Minutos de partido, hasta que terminó</p>
    </div>
  )
}

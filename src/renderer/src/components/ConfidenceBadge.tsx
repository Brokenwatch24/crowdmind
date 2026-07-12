import { useState } from 'react'
import type { ConfianzaBreakdown } from '@shared/types'
import { confidenceLevel } from '@shared/types'
import { cn } from '@renderer/lib/utils'

const LEVEL_STYLE = {
  alta: { dot: 'bg-success', text: 'text-success', label: 'Alta' },
  media: { dot: 'bg-warning', text: 'text-warning', label: 'Media' },
  baja: { dot: 'bg-danger', text: 'text-danger', label: 'Baja' },
  desconocida: { dot: 'bg-text-dim', text: 'text-text-dim', label: '—' }
} as const

export function ConfidenceBadge({
  indice,
  disclaimers,
  breakdown
}: {
  indice: number | null
  disclaimers: string[]
  breakdown: ConfianzaBreakdown | null
}) {
  const [open, setOpen] = useState(false)
  const level = confidenceLevel(indice)
  const style = LEVEL_STYLE[level]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-chip border border-border bg-surface-2 px-2.5 py-1 font-mono-label text-xs font-medium text-text-muted"
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
        Confianza: <span className={style.text}>{style.label}</span>
        {indice !== null && <span className="text-text-dim">({indice}/100)</span>}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-card border border-border bg-surface p-4 shadow-xl">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-text">
            <span className={cn('h-2 w-2 rounded-full', style.dot)} />
            Confianza: {style.label}
          </div>
          {breakdown ? (
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-text-dim">Varianza de scores</span>
                <span className="font-mono-label text-text">{breakdown.desviacionScores.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-dim">Cobertura demográfica</span>
                <span className="font-mono-label text-text">
                  {breakdown.segmentosCubiertos} de {breakdown.segmentosTotales} segmentos
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-dim">Tamaño de muestra</span>
                <span className="font-mono-label text-text">{breakdown.tamanoMuestra} personas</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-text-dim">Aún no calculado.</div>
          )}
          {disclaimers.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-[11.5px] leading-relaxed text-text-dim">
              {disclaimers.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

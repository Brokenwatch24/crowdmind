import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import type { FunnelResultSummary, NivelIngreso } from '@shared/types'
import { NIVELES_INGRESO } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Card } from '@renderer/components/ui/card'

const STAGE_COLORS = ['var(--color-primary)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)']

export function FunnelResultsPage() {
  const { testId } = useParams<{ testId: string }>()
  const [summary, setSummary] = useState<FunnelResultSummary | null>(null)

  useEffect(() => {
    if (!testId) return
    api.funnel.getResults(testId).then(setSummary)
  }, [testId])

  if (!summary) return <div className="p-8 text-sm text-text-dim">Cargando resultados del funnel…</div>

  const primerEtapaTotal = summary.etapas[0]?.entraron || 1

  return (
    <div className="p-8">
      <PageHeader eyebrow="PANEL > TEST" title={`Resultados del funnel — "${summary.test.nombre}"`} />

      <Card className="max-w-4xl p-6">
        {summary.etapas.map((stage, i) => {
          const pct = Math.round((stage.entraron / primerEtapaTotal) * 100)
          const dropFromPrev = i > 0 ? summary.etapas[i - 1].entraron - stage.entraron : 0
          const dropPct = i > 0 && summary.etapas[i - 1].entraron > 0 ? Math.round((dropFromPrev / summary.etapas[i - 1].entraron) * 100) : 0
          return (
            <div key={stage.etapa.id}>
              <div className="mb-1.5 flex items-center gap-3.5">
                <div className="w-48 flex-none truncate text-[12.5px] font-medium text-text-muted">{stage.etapa.titulo}</div>
                <div className="h-[30px] flex-1 overflow-hidden rounded-md bg-bg">
                  <div
                    className="h-full rounded-md"
                    style={{ width: `${pct}%`, background: STAGE_COLORS[i % STAGE_COLORS.length] }}
                  />
                </div>
                <div className="w-28 flex-none text-right font-mono-label text-[12.5px] font-semibold text-text">
                  {stage.entraron} · {pct}%
                </div>
              </div>
              {i > 0 && dropFromPrev > 0 && (
                <div className="mb-3 ml-[13.5rem] font-mono-label text-[11px] font-semibold text-danger">↓ {dropPct}% de caída</div>
              )}
              {!(i > 0 && dropFromPrev > 0) && <div className="mb-3" />}
            </div>
          )
        })}
      </Card>

      <div className="mt-6 max-w-4xl">
        <div className="mb-3 text-sm font-medium text-text-muted">Funnel comparativo por nivel de ingreso</div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {NIVELES_INGRESO.map((nivel, colorIdx) => {
            const bars = summary.etapas.map((stage) => {
              const enNivel = stage.respuestas.filter((r) => r.persona.nivelIngreso === nivel).length
              const primerEtapaEnNivel =
                summary.etapas[0]?.respuestas.filter((r: { persona: { nivelIngreso: NivelIngreso } }) => r.persona.nivelIngreso === nivel)
                  .length || 1
              return Math.round((enNivel / primerEtapaEnNivel) * 100)
            })
            return (
              <Card key={nivel} className="p-4">
                <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-text">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: STAGE_COLORS[colorIdx % STAGE_COLORS.length] }} />
                  Ingreso {nivel}
                </div>
                {bars.map((pct, i) => (
                  <div
                    key={i}
                    className="mb-1.5 h-3 rounded"
                    style={{ width: `${pct}%`, background: STAGE_COLORS[colorIdx % STAGE_COLORS.length] }}
                  />
                ))}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Network } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { TestResultSummary } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Avatar } from '@renderer/components/Avatar'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { ConfidenceBadge } from '@renderer/components/ConfidenceBadge'
import { ThemesSection } from '@renderer/components/ThemesSection'
import { ExportDialog } from '@renderer/components/ExportDialog'

export function TestResultsPage() {
  const { workspaceId, panelId, testId } = useParams<{ workspaceId: string; panelId: string; testId: string }>()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<TestResultSummary | null>(null)

  useEffect(() => {
    if (!testId) return
    api.tests.getResults(testId).then(setSummary)
  }, [testId])

  if (!summary) return <div className="p-8 text-sm text-text-dim">Cargando resultados…</div>

  const total = summary.respuestas.length || 1
  const distPct = {
    positivo: (summary.distribucion.positivo / total) * 100,
    neutro: (summary.distribucion.neutro / total) * 100,
    negativo: (summary.distribucion.negativo / total) * 100
  }

  return (
    <div className="p-8">
      <PageHeader
        eyebrow={`PANEL > TEST`}
        title={`Resultados — "${summary.test.nombre}"`}
        actions={
          <>
            <ConfidenceBadge indice={summary.test.indiceConfianza} disclaimers={summary.test.disclaimers} breakdown={summary.test.confianzaBreakdown} />
            <Button variant="secondary" size="sm" onClick={() => navigate(`/w/${workspaceId}/panels/${panelId}/tests/${testId}/swarm`)}>
              <Network size={14} /> Ver enjambre
            </Button>
            {testId && <ExportDialog testId={testId} />}
          </>
        }
      />

      {summary.test.estimuloMetadata.imagenDataUri && (
        <img
          src={summary.test.estimuloMetadata.imagenDataUri}
          alt="Estímulo"
          className="mb-4 max-h-52 rounded-card border border-border object-cover"
        />
      )}

      <div className="grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="font-mono-label text-[10.5px] text-text-dim">SCORE PROMEDIO</div>
          <div className="mt-1 text-2xl font-semibold text-text">{summary.scorePromedio.toFixed(1)} / 10</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono-label text-[10.5px] text-text-dim">RESPUESTAS</div>
          <div className="mt-1 text-2xl font-semibold text-text">{summary.respuestas.length}</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono-label text-[10.5px] text-text-dim">DISTRIBUCIÓN</div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full">
            <div style={{ width: `${distPct.positivo}%`, background: 'var(--color-success)' }} />
            <div style={{ width: `${distPct.neutro}%`, background: 'var(--color-warning)' }} />
            <div style={{ width: `${distPct.negativo}%`, background: 'var(--color-danger)' }} />
          </div>
        </Card>
      </div>

      {summary.test.resumenEjecutivo && (
        <Card className="mt-4 max-w-4xl p-4">
          <div className="flex gap-3">
            <div className="h-fit flex-none rounded px-1.5 py-0.5 font-mono-label text-[9.5px] font-bold text-bg bg-warning">IA</div>
            <div className="text-sm leading-relaxed text-text-muted">{summary.test.resumenEjecutivo}</div>
          </div>
        </Card>
      )}

      <div className="mt-6 max-w-4xl">
        <div className="mb-3 text-sm font-medium text-text-muted">Respuestas por persona</div>
        <div className="space-y-2">
          {summary.respuestas.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar seed={r.persona.avatarSeed} name={r.persona.nombre} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-text">{r.persona.nombre}</div>
                    <div className="font-mono-label text-xs font-semibold text-text">{r.scoreSatisfaccion}/10</div>
                  </div>
                  <div className="mt-1 text-sm text-text-muted">{r.opinionTexto}</div>
                  {r.aspectosPositivos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.aspectosPositivos.map((a, i) => (
                        <Badge key={i} variant="success">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {r.objeciones.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.objeciones.map((o, i) => (
                        <Badge key={i} variant="danger">
                          {o}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {summary.respuestas.length === 0 && (
        <Card className="mt-4 max-w-4xl">
          <CardContent className="text-sm text-text-dim">No hay respuestas para este test.</CardContent>
        </Card>
      )}

      {summary.respuestas.length > 0 && workspaceId && (
        <ThemesSection
          testId={summary.test.id}
          workspaceId={workspaceId}
          personasById={new Map(summary.respuestas.map((r) => [r.personaId, r.persona]))}
        />
      )}
    </div>
  )
}

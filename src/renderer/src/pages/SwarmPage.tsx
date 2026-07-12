import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { FollowUp, FollowUpResultSummary, TestResultSummary } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Card } from '@renderer/components/ui/card'
import { Textarea } from '@renderer/components/ui/textarea'
import { Button } from '@renderer/components/ui/button'
import { Avatar } from '@renderer/components/Avatar'
import { SwarmCanvas, type SwarmNode } from '@renderer/components/SwarmCanvas'

export function SwarmPage() {
  const { workspaceId, panelId, testId } = useParams<{ workspaceId: string; panelId: string; testId: string }>()
  const navigate = useNavigate()
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const [summary, setSummary] = useState<TestResultSummary | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pregunta, setPregunta] = useState('')
  const [sending, setSending] = useState(false)
  const [pastFollowUps, setPastFollowUps] = useState<FollowUp[]>([])
  const [activeResult, setActiveResult] = useState<FollowUpResultSummary | null>(null)

  async function refresh() {
    if (!testId) return
    const [s, fus] = await Promise.all([api.tests.getResults(testId), api.followUps.listForTest(testId)])
    setSummary(s)
    setPastFollowUps(fus)
    if (fus[0]) setActiveResult(await api.followUps.getResults(fus[0].id))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  if (!summary || !workspaceId || !testId) return <div className="p-8 text-sm text-text-dim">Cargando…</div>

  const nodes: SwarmNode[] = summary.respuestas.map((r) => ({
    id: r.personaId,
    nombre: r.persona.nombre,
    score: r.scoreSatisfaccion,
    quote: r.opinionTexto.slice(0, 90)
  }))

  async function handleSend() {
    if (!pregunta.trim() || selectedIds.length === 0) return
    setSending(true)
    try {
      const result = await api.followUps.run({
        testId: testId!,
        workspaceId: workspaceId!,
        personaIds: selectedIds,
        pregunta,
        provider,
        model: model ?? undefined
      })
      setActiveResult(result)
      setPastFollowUps((prev) => [result.followUp, ...prev])
      setPregunta('')
      setSelectedIds([])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8">
      <PageHeader eyebrow="TEST > ENJAMBRE" title={`Vista de enjambre — "${summary.test.nombre}"`} />

      <div className="flex flex-wrap gap-5">
        <div className="min-w-[420px] max-w-4xl flex-1">
          <div className="mb-2 text-xs text-text-dim">Arrastra sobre el grafo para seleccionar un grupo de personas.</div>
          <Card className="h-[440px] overflow-hidden">
            <SwarmCanvas
              nodes={nodes}
              selectable
              onSelectionChange={setSelectedIds}
              onNodeClick={(id) => navigate(`/w/${workspaceId}/panels/${panelId}/personas/${id}`)}
            />
          </Card>

          {activeResult && (
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="text-sm font-semibold text-text">Resultados del follow-up</div>
                <div className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono-label text-[10.5px] text-text-dim">
                  ↳ "{activeResult.followUp.pregunta}"
                </div>
              </div>
              <div className="flex flex-col overflow-hidden rounded-card border border-border">
                {activeResult.respuestas.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 border-b border-border p-3 last:border-b-0">
                    <Avatar seed={r.persona.avatarSeed} name={r.persona.nombre} size={26} />
                    <div className="w-32 flex-none truncate text-xs font-medium text-text">{r.persona.nombre}</div>
                    <div className="flex-1 text-xs text-text-muted">"{r.respuestaTexto}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-80 flex-none rounded-card border border-border bg-surface-2 p-5">
          <div className="mb-1 text-sm font-semibold text-text">Pregunta de seguimiento</div>
          <div className="mb-3.5 font-mono-label text-[10.5px] text-text-dim">↳ vinculado a "{summary.test.nombre}"</div>
          <Textarea
            rows={4}
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="¿Qué te haría reconsiderar tu decisión?"
          />
          <div className="mt-2.5 text-xs font-medium text-text-dim">{selectedIds.length} personas seleccionadas</div>
          <div className="mt-3.5 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSend} disabled={sending || !pregunta.trim() || selectedIds.length === 0}>
              {sending ? 'Enviando…' : `Enviar a los ${selectedIds.length}`}
            </Button>
          </div>

          {pastFollowUps.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <div className="mb-2 font-mono-label text-[10.5px] font-semibold tracking-wide text-text-dim">
                FOLLOW-UPS ANTERIORES
              </div>
              <div className="flex flex-col gap-1.5">
                {pastFollowUps.map((fu) => (
                  <button
                    key={fu.id}
                    className="truncate rounded-md px-2 py-1.5 text-left text-xs text-text-muted hover:bg-surface"
                    onClick={() => api.followUps.getResults(fu.id).then(setActiveResult)}
                  >
                    "{fu.pregunta}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

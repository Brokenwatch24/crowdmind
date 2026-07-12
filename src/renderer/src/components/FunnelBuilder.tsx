import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { EstimuloTipo, EtapaFunnelDraft } from '@shared/types'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { ImagePicker } from '@renderer/components/ImagePicker'

function emptyStage(orden: number): EtapaFunnelDraft {
  return { orden, tipoEstimulo: 'texto', estimuloContenido: '', estimuloMetadata: {}, titulo: `Etapa ${orden + 1}` }
}

function inferTipo(hasText: boolean, hasImage: boolean): EstimuloTipo {
  if (hasImage && hasText) return 'multimodal'
  if (hasImage) return 'imagen'
  return 'texto'
}

export function FunnelBuilder({
  etapas,
  onChange
}: {
  etapas: EtapaFunnelDraft[]
  onChange: (etapas: EtapaFunnelDraft[]) => void
}) {
  function update(index: number, patch: Partial<EtapaFunnelDraft>) {
    onChange(
      etapas.map((e, i) => {
        if (i !== index) return e
        const next = { ...e, ...patch }
        return { ...next, tipoEstimulo: inferTipo(next.estimuloContenido.trim().length > 0, Boolean(next.estimuloMetadata.imagenDataUri)) }
      })
    )
  }

  function remove(index: number) {
    onChange(etapas.filter((_, i) => i !== index).map((e, i) => ({ ...e, orden: i })))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= etapas.length) return
    const next = [...etapas]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((e, i) => ({ ...e, orden: i })))
  }

  function add() {
    onChange([...etapas, emptyStage(etapas.length)])
  }

  return (
    <div className="space-y-3">
      {etapas.map((etapa, i) => (
        <div key={i} className="rounded-card border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-border bg-surface-2 font-mono-label text-[10.5px] text-text">
              {i + 1}
            </div>
            <Input
              value={etapa.titulo}
              onChange={(e) => update(i, { titulo: e.target.value })}
              className="h-8 flex-1 text-sm font-semibold"
              placeholder={`Etapa ${i + 1}`}
            />
            <div className="flex flex-none gap-0.5">
              <button className="rounded p-1 text-text-dim hover:text-text disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>
                <ChevronUp size={14} />
              </button>
              <button
                className="rounded p-1 text-text-dim hover:text-text disabled:opacity-30"
                disabled={i === etapas.length - 1}
                onClick={() => move(i, 1)}
              >
                <ChevronDown size={14} />
              </button>
              <button className="rounded p-1 text-text-dim hover:text-danger" onClick={() => remove(i)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <Textarea
            rows={3}
            value={etapa.estimuloContenido}
            onChange={(e) => update(i, { estimuloContenido: e.target.value })}
            placeholder="¿Qué ve/experimenta la persona en esta etapa?"
          />
          <div className="mt-2.5">
            <ImagePicker
              value={etapa.estimuloMetadata.imagenDataUri ?? null}
              onChange={(dataUri) => update(i, { estimuloMetadata: dataUri ? { imagenDataUri: dataUri } : {} })}
            />
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-border py-3 text-xs font-medium text-text-dim hover:text-text"
      >
        <Plus size={13} /> Añadir etapa
      </button>
      {etapas.length === 0 && <Label className="text-[11px] normal-case">Añade al menos una etapa para configurar el funnel.</Label>}
    </div>
  )
}

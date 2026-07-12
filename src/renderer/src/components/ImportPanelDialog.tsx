import { useEffect, useState } from 'react'
import { Download, FolderOpen, Users } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { MarketplacePanelTemplate } from '@shared/types'
import { PALETTE_COLORS } from '@renderer/lib/colors'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'

export function ImportPanelDialog({ workspaceId, onImported }: { workspaceId: string; onImported: () => void }) {
  const [open, setOpen] = useState(false)
  const [bundled, setBundled] = useState<Array<{ fileName: string; template: MarketplacePanelTemplate }>>([])
  const [template, setTemplate] = useState<MarketplacePanelTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) api.marketplace.listBundled().then(setBundled)
  }, [open])

  async function handlePickFile() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.marketplace.importPanel()
      if (!result) return
      setTemplate(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!template) return
    setSaving(true)
    try {
      const panel = await api.panels.create({
        workspaceId,
        nombre: template.nombre,
        descripcion: template.descripcionPublica,
        color: PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)]
      })
      await api.personas.saveBulk(panel.id, template.personas)
      setOpen(false)
      setTemplate(null)
      onImported()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setTemplate(null)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Download size={14} /> Marketplace
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>Marketplace de paneles</DialogTitle>

        {!template ? (
          <div className="space-y-3">
            <div className="text-xs text-text-muted">
              Plantillas incluidas con la app — creadas por el equipo o propuestas por la comunidad vía PR a{' '}
              <code className="rounded bg-surface-2 px-1 py-0.5 font-mono-label text-[11px]">resources/templates/</code>.
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {bundled.map((b) => (
                <button key={b.fileName} className="w-full text-left" onClick={() => setTemplate(b.template)}>
                  <Card className="p-3.5 hover:border-primary/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-text">{b.template.nombre}</div>
                      <div className="flex flex-none items-center gap-1 font-mono-label text-[10.5px] text-text-dim">
                        <Users size={11} /> {b.template.personas.length}
                      </div>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-text-muted">{b.template.descripcionPublica}</div>
                    {b.template.autorPublico && <div className="mt-1 text-[11px] text-text-dim">por {b.template.autorPublico}</div>}
                  </Card>
                </button>
              ))}
              {bundled.length === 0 && <div className="py-6 text-center text-xs text-text-dim">No hay plantillas incluidas.</div>}
            </div>
            <div className="border-t border-border pt-3">
              <Button variant="secondary" size="sm" onClick={handlePickFile} disabled={loading}>
                <FolderOpen size={13} /> {loading ? 'Leyendo…' : 'Importar desde archivo…'}
              </Button>
              {error && <div className="mt-1.5 text-xs text-danger">Archivo inválido: {error}</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-bg p-3">
              <div className="text-sm font-semibold text-text">{template.nombre}</div>
              <div className="mt-1 text-xs text-text-muted">{template.descripcionPublica || 'Sin descripción.'}</div>
              {template.autorPublico && <div className="mt-1 text-xs text-text-dim">por {template.autorPublico}</div>}
              <div className="mt-2 font-mono-label text-[10.5px] text-text-dim">{template.personas.length} personas</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setTemplate(null)}>
                Volver
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={saving}>
                {saving ? 'Creando panel…' : 'Crear panel con estas personas'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

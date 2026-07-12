import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'

export function ExportPanelDialog({ panelId }: { panelId: string }) {
  const [open, setOpen] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [autor, setAutor] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function handleExport() {
    setBusy(true)
    setStatus(null)
    try {
      const result = await api.marketplace.exportPanel({ panelId, descripcionPublica: descripcion, autorPublico: autor })
      setStatus(result.success ? `Guardado en: ${result.filePath}` : 'Exportación cancelada.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Share2 size={14} /> Exportar panel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Exportar panel como plantilla pública</DialogTitle>
        <div className="space-y-3">
          <div className="text-xs text-text-muted">
            Genera un archivo .json con las personas de este panel (sin resultados de tests) que puedes compartir donde quieras
            — un Gist, un foro, etc. Cualquiera con Crowdmind podrá importarlo.
          </div>
          <div>
            <Label htmlFor="export-desc">Descripción pública</Label>
            <Textarea id="export-desc" className="mt-1.5" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿A quién representa este panel?" />
          </div>
          <div>
            <Label htmlFor="export-autor">Autor</Label>
            <Input id="export-autor" className="mt-1.5" value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Tu nombre o el de tu equipo" />
          </div>
          <Button className="w-full" onClick={handleExport} disabled={busy}>
            {busy ? 'Exportando…' : 'Exportar plantilla'}
          </Button>
          {status && <div className="text-xs text-text-dim">{status}</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { FileJson, FileText, FileCode } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'

export function ExportDialog({ testId }: { testId: string }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState<'pdf' | 'json' | 'markdown' | null>(null)

  async function run(kind: 'pdf' | 'json' | 'markdown', action: () => Promise<{ success: boolean; filePath?: string }>) {
    setBusy(kind)
    setStatus(null)
    try {
      const result = await action()
      setStatus(result.success ? `Guardado en: ${result.filePath}` : 'Exportación cancelada.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <FileText size={14} /> Exportar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Exportar resultados</DialogTitle>
        <div className="flex flex-col gap-2.5">
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
              <FileJson size={15} className="text-text-dim" /> JSON crudo
            </div>
            <div className="mb-3 text-xs text-text-dim">Todas las respuestas, metadatos y temas extraídos, sin formatear.</div>
            <Button size="sm" variant="secondary" onClick={() => run('json', () => api.tests.exportJson(testId))} disabled={busy !== null}>
              {busy === 'json' ? 'Exportando…' : 'Descargar JSON'}
            </Button>
          </Card>
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
              <FileCode size={15} className="text-text-dim" /> Reporte narrativo (Markdown)
            </div>
            <div className="mb-3 text-xs text-text-dim">Mismo reporte que el PDF, en texto plano — fácil de pegar en Notion, docs o un PR.</div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run('markdown', () => api.tests.exportMarkdown(testId))}
              disabled={busy !== null}
            >
              {busy === 'markdown' ? 'Exportando…' : 'Descargar Markdown'}
            </Button>
          </Card>
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
              <FileText size={15} className="text-text-dim" /> Reporte narrativo (PDF)
            </div>
            <div className="mb-3 text-xs text-text-dim">Metodología, hallazgos, recomendaciones y limitaciones en un documento listo para compartir.</div>
            <Button size="sm" onClick={() => run('pdf', () => api.tests.exportPdf(testId))} disabled={busy !== null}>
              {busy === 'pdf' ? 'Generando…' : 'Descargar PDF'}
            </Button>
          </Card>
          {status && <div className="text-xs text-text-dim">{status}</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

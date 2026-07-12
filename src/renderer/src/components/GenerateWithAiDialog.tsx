import { useState } from 'react'
import { Sparkles, Pencil, Trash2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { PersonaDraft } from '@shared/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { PersonaForm } from './PersonaForm'
import { useT } from '@renderer/i18n/useT'

export function GenerateWithAiDialog({
  workspaceId,
  panelId,
  onSaved
}: {
  workspaceId: string
  panelId: string
  onSaved: () => void
}) {
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const [open, setOpen] = useState(false)
  const [brief, setBrief] = useState('')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PersonaDraft[] | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  async function handleGenerate() {
    if (!brief.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.personas.generatePreview({
        workspaceId,
        brief,
        count,
        provider,
        model: model ?? undefined
      })
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!preview || preview.length === 0) return
    setSaving(true)
    try {
      await api.personas.saveBulk(panelId, preview)
      setOpen(false)
      setPreview(null)
      setBrief('')
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  function removeAt(idx: number) {
    setPreview((prev) => prev?.filter((_, i) => i !== idx) ?? null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setPreview(null)
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Sparkles size={14} /> {t('genAi.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{t('genAi.title')}</DialogTitle>

        {!preview ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="brief">{t('genAi.briefLabel')}</Label>
              <Textarea
                id="brief"
                className="mt-1.5"
                rows={4}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={t('genAi.briefPlaceholder')}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="count">{t('genAi.countLabel')}</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={30}
                className="mt-1.5"
                value={count}
                onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
            {error && <div className="text-xs text-danger">{error}</div>}
            <Button className="w-full" onClick={handleGenerate} disabled={loading || !brief.trim()}>
              {loading ? t('genAi.generating') : t('genAi.generate', { count })}
            </Button>
          </div>
        ) : editingIndex !== null ? (
          <PersonaForm
            initial={preview[editingIndex]}
            submitLabel={t('personaDetail.saveChanges')}
            onSubmit={(draft) => {
              setPreview((prev) => prev!.map((p, i) => (i === editingIndex ? draft : p)))
              setEditingIndex(null)
            }}
          />
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-text-muted">{t('genAi.reviewHint', { count: preview.length })}</div>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {preview.map((p, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">
                      {p.nombre} <span className="font-normal text-text-dim">· {p.edad} {t('personaDetail.years')}</span>
                    </div>
                    <div className="truncate text-xs text-text-muted">
                      {p.ocupacion} · {p.ciudad}, {p.pais} · {p.disposicionBase}
                    </div>
                  </div>
                  <div className="flex flex-none gap-1">
                    <button className="rounded p-1.5 text-text-dim hover:text-text" onClick={() => setEditingIndex(idx)}>
                      <Pencil size={13} />
                    </button>
                    <button className="rounded p-1.5 text-text-dim hover:text-danger" onClick={() => removeAt(idx)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPreview(null)}>
                {t('genAi.back')}
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={saving || preview.length === 0}>
                {saving ? t('genAi.saving') : t('genAi.save', { count: preview.length })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { Workspace } from '@shared/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const currentWorkspaceId = useAppStore((s) => s.currentWorkspaceId)
  const setCurrentWorkspaceId = useAppStore((s) => s.setCurrentWorkspaceId)

  async function refresh(selectId?: string) {
    const list = await api.workspaces.list()
    setWorkspaces(list)
    setLoading(false)
    if (selectId) {
      setCurrentWorkspaceId(selectId)
    } else if (!currentWorkspaceId && list.length > 0) {
      setCurrentWorkspaceId(list[0].id)
    } else if (currentWorkspaceId && !list.some((w) => w.id === currentWorkspaceId)) {
      setCurrentWorkspaceId(list[0]?.id ?? null)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    const ws = await api.workspaces.create(newName.trim())
    setNewName('')
    setOpen(false)
    await refresh(ws.id)
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-1.5 font-mono-label text-[9.5px] font-semibold tracking-wider text-text-dim">WORKSPACE</div>
      {loading ? (
        <div className="text-xs text-text-dim">Cargando…</div>
      ) : workspaces.length === 0 ? (
        <div className="text-xs text-text-dim">Sin workspaces</div>
      ) : (
        <select
          className="w-full truncate bg-transparent text-[12.5px] font-medium text-text outline-none"
          value={currentWorkspaceId ?? ''}
          onChange={(e) => setCurrentWorkspaceId(e.target.value)}
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id} className="bg-surface text-text">
              {w.nombre}
            </option>
          ))}
        </select>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary">
            <Plus size={12} /> Nuevo workspace
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Nuevo workspace</DialogTitle>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ws-name">Nombre</Label>
              <Input
                id="ws-name"
                autoFocus
                className="mt-1.5"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Damory Foods LatAm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <Button className="w-full" onClick={handleCreate}>
              Crear workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

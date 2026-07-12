import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAppStore } from '@renderer/store/useAppStore'
import { api } from '@renderer/lib/api'
import { Logo } from '@renderer/layout/Logo'
import { Button } from '@renderer/components/ui/button'

export function WorkspacesPage() {
  const currentWorkspaceId = useAppStore((s) => s.currentWorkspaceId)
  const setCurrentWorkspaceId = useAppStore((s) => s.setCurrentWorkspaceId)
  const navigate = useNavigate()
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    if (currentWorkspaceId) navigate(`/w/${currentWorkspaceId}/panels`, { replace: true })
  }, [currentWorkspaceId, navigate])

  async function handleSeedDemo() {
    setSeeding(true)
    try {
      const workspace = await api.workspaces.seedDemo()
      setCurrentWorkspaceId(workspace.id)
      navigate(`/w/${workspace.id}/panels`)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <Logo withWordmark={false} />
      <div className="text-lg font-semibold text-text">Bienvenido a Crowdmind</div>
      <div className="max-w-sm text-sm text-text-muted">
        Crea o selecciona un workspace desde la barra lateral para empezar a construir paneles de personas.
      </div>
      <Button variant="secondary" size="sm" className="mt-2" onClick={handleSeedDemo} disabled={seeding}>
        <Sparkles size={14} /> {seeding ? 'Generando ejemplo…' : 'Cargar workspace de ejemplo'}
      </Button>
      <div className="max-w-sm text-xs text-text-dim">
        Crea un panel con 8 personas y un test ya ejecutado, todo con el proveedor local — sin API keys.
      </div>
    </div>
  )
}

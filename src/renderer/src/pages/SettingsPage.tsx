import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { PROVIDER_DEFAULT_MODELS, PROVIDER_LABELS, type ProviderSetting } from '@shared/types'
import { PageHeader } from '@renderer/components/PageHeader'
import { Card } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'

function ProviderRow({ setting, onChanged }: { setting: ProviderSetting; onChanged: () => void }) {
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const isLocal = setting.provider === 'local'

  async function handleSaveKey() {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await api.settings.setApiKey({ provider: setting.provider, workspaceId: null, apiKey: apiKey.trim() })
      setApiKey('')
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function handleClearKey() {
    await api.settings.clearApiKey({ provider: setting.provider, workspaceId: null })
    onChanged()
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-text">{PROVIDER_LABELS[setting.provider]}</div>
          <div className="mt-1">
            {isLocal ? (
              <Badge variant="neutral">no requiere API key</Badge>
            ) : setting.hasApiKey ? (
              <Badge variant="success">API key configurada</Badge>
            ) : (
              <Badge variant="warning">sin API key</Badge>
            )}
          </div>
        </div>
        <div className="w-52">
          <Label>Modelo por defecto</Label>
          <Select
            value={setting.defaultModel}
            onValueChange={(model) =>
              api.settings.setDefaultModel({ provider: setting.provider, workspaceId: null, model }).then(onChanged)
            }
          >
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_DEFAULT_MODELS[setting.provider].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isLocal && (
        <div className="mt-3 flex gap-2">
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
          />
          <Button size="sm" onClick={handleSaveKey} disabled={saving || !apiKey.trim()}>
            Guardar
          </Button>
          {setting.hasApiKey && (
            <Button size="sm" variant="secondary" onClick={handleClearKey}>
              Borrar
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export function SettingsPage() {
  const [settings, setSettings] = useState<ProviderSetting[]>([])
  const [encryptionAvailable, setEncryptionAvailable] = useState<boolean | null>(null)

  async function refresh() {
    const [list, enc] = await Promise.all([api.settings.listProviders(), api.settings.isEncryptionAvailable()])
    setSettings(list)
    setEncryptionAvailable(enc)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="p-8">
      <PageHeader eyebrow="AJUSTES" title="Proveedores de IA" />

      {encryptionAvailable !== null && (
        <div className="mb-5 flex max-w-2xl items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
          {encryptionAvailable ? (
            <>
              <ShieldCheck size={14} className="text-success" /> Las API keys se cifran con el llavero del sistema operativo antes
              de guardarse localmente.
            </>
          ) : (
            <>
              <ShieldAlert size={14} className="text-warning" /> El cifrado del sistema operativo no está disponible en esta
              máquina — las API keys se guardan en texto plano en tu base de datos local.
            </>
          )}
        </div>
      )}

      <div className="max-w-2xl space-y-3">
        {settings.map((s) => (
          <ProviderRow key={s.provider} setting={s} onChanged={refresh} />
        ))}
      </div>
    </div>
  )
}

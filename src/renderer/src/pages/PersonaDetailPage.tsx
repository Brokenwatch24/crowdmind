import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { ChatMensaje, Persona } from '@shared/types'
import { PersonaAvatarEditor } from '@renderer/components/PersonaAvatarEditor'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { PersonaForm } from '@renderer/components/PersonaForm'
import { VersionsTimeline } from '@renderer/components/VersionsTimeline'
import { Card } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { formatDateTime } from '@renderer/lib/utils'
import { useT } from '@renderer/i18n/useT'

export function PersonaDetailPage() {
  const t = useT()
  const { workspaceId, panelId, personaId } = useParams<{ workspaceId: string; panelId: string; personaId: string }>()
  const navigate = useNavigate()
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function refresh() {
    if (!personaId) return
    const [p, msgs] = await Promise.all([api.personas.get(personaId), api.chat.list(personaId)])
    setPersona(p)
    setMensajes(msgs)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [mensajes])

  async function handleSend() {
    if (!chatInput.trim() || !personaId || !workspaceId) return
    setSending(true)
    const text = chatInput
    setChatInput('')
    try {
      const { userMsg, personaMsg } = await api.chat.send({
        personaId,
        workspaceId,
        mensaje: text,
        provider,
        model: model ?? undefined
      })
      setMensajes((prev) => [...prev, userMsg, personaMsg])
    } finally {
      setSending(false)
    }
  }

  if (!persona) return <div className="p-8 text-sm text-text-dim">{t('personaDetail.loading')}</div>

  return (
    <div className="p-8">
      <button
        className="mb-4 font-mono-label text-[10.5px] text-text-dim hover:text-text"
        onClick={() => navigate(`/w/${workspaceId}/panels/${panelId}`)}
      >
        {t('personaDetail.back')}
      </button>

      <div className="mb-5 flex items-center gap-4">
        {workspaceId && <PersonaAvatarEditor persona={persona} workspaceId={workspaceId} onUpdated={setPersona} />}
        <div>
          <div className="text-lg font-semibold text-text">{persona.nombre}</div>
          <div className="text-xs text-text-dim">
            {persona.edad} {t('personaDetail.years')} · {persona.ciudad} · {t('personaDetail.disposicion')}: {persona.disposicionBase}
          </div>
        </div>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">{t('personaDetail.tabProfile')}</TabsTrigger>
          <TabsTrigger value="chat">{t('personaDetail.tabChat')}</TabsTrigger>
          <TabsTrigger value="versiones">{t('personaDetail.tabVersions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <div className="max-w-2xl">
            <PersonaForm
              initial={persona}
              submitLabel={t('personaDetail.saveChanges')}
              onSubmit={async (draft) => {
                await api.personas.update(persona.id, draft)
                refresh()
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="flex h-[520px] max-w-2xl flex-col">
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {mensajes.length === 0 && (
                <div className="py-10 text-center text-xs text-text-dim">
                  {t('personaDetail.chatEmpty', { name: persona.nombre })}
                </div>
              )}
              {mensajes.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[75%] rounded-lg bg-primary/15 border border-primary/30 px-3 py-2 text-sm text-text'
                        : 'max-w-[75%] rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text-muted'
                    }
                  >
                    {m.contenido}
                    <div className="mt-1 font-mono-label text-[9.5px] text-text-dim">{formatDateTime(m.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
                placeholder={t('personaDetail.chatPlaceholder', { name: persona.nombre })}
                disabled={sending}
              />
              <Button size="sm" onClick={handleSend} disabled={sending || !chatInput.trim()}>
                <Send size={14} />
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="versiones">
          <VersionsTimeline personaId={persona.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

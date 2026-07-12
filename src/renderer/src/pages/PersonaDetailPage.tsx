import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { ChatMensaje, Persona } from '@shared/types'
import { Avatar } from '@renderer/components/Avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { PersonaForm } from '@renderer/components/PersonaForm'
import { VersionsTimeline } from '@renderer/components/VersionsTimeline'
import { Card } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { formatDateTime } from '@renderer/lib/utils'

export function PersonaDetailPage() {
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

  if (!persona) return <div className="p-8 text-sm text-text-dim">Cargando…</div>

  return (
    <div className="p-8">
      <button
        className="mb-4 font-mono-label text-[10.5px] text-text-dim hover:text-text"
        onClick={() => navigate(`/w/${workspaceId}/panels/${panelId}`)}
      >
        &larr; Volver al panel
      </button>

      <div className="mb-5 flex items-center gap-4">
        <Avatar seed={persona.avatarSeed} name={persona.nombre} size={46} />
        <div>
          <div className="text-lg font-semibold text-text">{persona.nombre}</div>
          <div className="text-xs text-text-dim">
            {persona.edad} años · {persona.ciudad} · disposición: {persona.disposicionBase}
          </div>
        </div>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="versiones">Historial de versiones</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <div className="max-w-2xl">
            <PersonaForm
              initial={persona}
              submitLabel="Guardar cambios"
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
                  Empieza una conversación 1:1 con {persona.nombre}.
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
                placeholder={`Escríbele a ${persona.nombre}…`}
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

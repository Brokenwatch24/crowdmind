import type { ChatMensaje, EtapaFunnel, Persona, PersonaDraft, ProviderId, RespuestaConPersona } from '@shared/types'
import { providerRegistry } from './providerRegistry'
import { generatePersonasLocal } from './local/personaGenerator'
import { respondToStimulusLocal, type LocalRespuesta } from './local/testResponder'
import { chatReplyLocal } from './local/chatReplier'
import { confidenceDisclaimerLocal } from './local/confidenceDisclaimer'
import { resumenEjecutivoLocal } from './local/resumenEjecutivo'
import { temasExtractorLocal, type LocalTema } from './local/temasExtractor'
import { followUpReplyLocal } from './local/followUpReplier'
import { funnelStageResponseLocal, type LocalFunnelRespuesta } from './local/funnelResponder'
import {
  personaGenSchema,
  testResponseSchema,
  chatReplySchema,
  confidenceDisclaimersSchema,
  resumenEjecutivoSchema,
  temasExtraccionSchema,
  funnelStageResponseSchema,
  PERSONA_GEN_SHAPE_HINT,
  TEST_RESPONSE_SHAPE_HINT,
  CHAT_REPLY_SHAPE_HINT,
  CONFIDENCE_DISCLAIMERS_SHAPE_HINT,
  RESUMEN_EJECUTIVO_SHAPE_HINT,
  TEMAS_EXTRACCION_SHAPE_HINT,
  FUNNEL_STAGE_RESPONSE_SHAPE_HINT
} from './schemas'
import {
  personaGenSystemPrompt,
  personaGenUserPrompt,
  personaSystemPrompt,
  testStimulusUserPrompt,
  chatUserPrompt,
  followUpUserPrompt,
  confidenceDisclaimersSystemPrompt,
  confidenceDisclaimersUserPrompt,
  resumenEjecutivoSystemPrompt,
  resumenEjecutivoUserPrompt,
  temasSystemPrompt,
  temasUserPrompt,
  funnelStageUserPrompt,
  type EtapaPropiaHistorial
} from './promptTemplates'

export interface ProviderCall {
  provider: ProviderId
  apiKey: string | null
  model: string
}

export async function generatePersonasWithAi(call: ProviderCall, brief: string, count: number): Promise<PersonaDraft[]> {
  if (call.provider === 'local') {
    return generatePersonasLocal(brief, count)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: personaGenSystemPrompt(),
    user: personaGenUserPrompt(brief, count),
    schema: personaGenSchema,
    shapeHint: PERSONA_GEN_SHAPE_HINT
  })
  return result.personas.map((p) => ({ ...p, llmProviderOverride: null, llmModelOverride: null }))
}

export async function getPersonaResponseToStimulus(
  call: ProviderCall,
  persona: Persona,
  estimulo: string,
  imageDataUri?: string
): Promise<LocalRespuesta> {
  if (call.provider === 'local') {
    return respondToStimulusLocal(persona, estimulo, Boolean(imageDataUri))
  }
  return providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: personaSystemPrompt(persona),
    user: testStimulusUserPrompt(estimulo, Boolean(imageDataUri)),
    schema: testResponseSchema,
    shapeHint: TEST_RESPONSE_SHAPE_HINT,
    imageDataUri
  })
}

export async function getPersonaChatReply(
  call: ProviderCall,
  persona: Persona,
  historia: ChatMensaje[],
  mensajeNuevo: string
): Promise<string> {
  if (call.provider === 'local') {
    return chatReplyLocal(persona, historia, mensajeNuevo)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: personaSystemPrompt(persona),
    user: chatUserPrompt(historia, mensajeNuevo),
    schema: chatReplySchema,
    shapeHint: CHAT_REPLY_SHAPE_HINT
  })
  return result.respuesta
}

export async function getFollowUpReply(
  call: ProviderCall,
  persona: Persona,
  opinionOriginal: string,
  pregunta: string
): Promise<string> {
  if (call.provider === 'local') {
    return followUpReplyLocal(persona, opinionOriginal, pregunta)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: personaSystemPrompt(persona),
    user: followUpUserPrompt(opinionOriginal, pregunta),
    schema: chatReplySchema,
    shapeHint: CHAT_REPLY_SHAPE_HINT
  })
  return result.respuesta
}

export async function getFunnelStageResponse(
  call: ProviderCall,
  persona: Persona,
  etapa: EtapaFunnel,
  historialPropio: EtapaPropiaHistorial[],
  peerSummary?: string
): Promise<LocalFunnelRespuesta> {
  if (call.provider === 'local') {
    return funnelStageResponseLocal(persona, etapa, historialPropio, peerSummary)
  }
  return providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: personaSystemPrompt(persona),
    user: funnelStageUserPrompt(etapa, historialPropio, peerSummary),
    schema: funnelStageResponseSchema,
    shapeHint: FUNNEL_STAGE_RESPONSE_SHAPE_HINT,
    imageDataUri: etapa.estimuloMetadata.imagenDataUri
  })
}

export async function getConfidenceDisclaimersQualitative(call: ProviderCall, respuestas: RespuestaConPersona[]): Promise<string[]> {
  if (respuestas.length === 0) return []
  if (call.provider === 'local') {
    return confidenceDisclaimerLocal(respuestas)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: confidenceDisclaimersSystemPrompt(),
    user: confidenceDisclaimersUserPrompt(respuestas),
    schema: confidenceDisclaimersSchema,
    shapeHint: CONFIDENCE_DISCLAIMERS_SHAPE_HINT
  })
  return result.disclaimers
}

export async function generarResumenEjecutivo(call: ProviderCall, estimulo: string, respuestas: RespuestaConPersona[]): Promise<string> {
  if (respuestas.length === 0) return ''
  if (call.provider === 'local') {
    return resumenEjecutivoLocal(respuestas)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: resumenEjecutivoSystemPrompt(),
    user: resumenEjecutivoUserPrompt(estimulo, respuestas),
    schema: resumenEjecutivoSchema,
    shapeHint: RESUMEN_EJECUTIVO_SHAPE_HINT
  })
  return result.resumen
}

export async function extraerTemasConIa(call: ProviderCall, respuestas: RespuestaConPersona[]): Promise<LocalTema[]> {
  if (respuestas.length === 0) return []
  if (call.provider === 'local') {
    return temasExtractorLocal(respuestas)
  }
  const result = await providerRegistry[call.provider].chatJson({
    apiKey: call.apiKey,
    model: call.model,
    system: temasSystemPrompt(),
    user: temasUserPrompt(respuestas),
    schema: temasExtraccionSchema,
    shapeHint: TEMAS_EXTRACCION_SHAPE_HINT
  })
  const validIds = new Set(respuestas.map((r) => r.personaId))
  return result.temas
    .map((t) => ({ ...t, representativas: t.representativas.filter((rep) => validIds.has(rep.personaId)) }))
    .filter((t) => t.representativas.length > 0)
}

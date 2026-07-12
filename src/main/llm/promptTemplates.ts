import type { ChatMensaje, EtapaFunnel, Persona, RespuestaConPersona } from '@shared/types'

export function personaGenSystemPrompt(): string {
  return [
    'Eres un generador de personas sintéticas para investigación de mercado.',
    'Debes crear personas realistas, diversas entre sí (edad, género, ciudad, nivel de ingreso, disposición hacia las marcas)',
    'y coherentes internamente (la historia personal debe encajar con la ocupación y la disposición base).',
    'Evita clichés repetidos entre personas del mismo lote.'
  ].join(' ')
}

export function personaGenUserPrompt(brief: string, count: number): string {
  return `Genera ${count} personas para este panel de investigación:\n\n"${brief}"\n\nDevuelve exactamente ${count} personas.`
}

export function personaSystemPrompt(persona: Persona): string {
  return [
    `Actúas como ${persona.nombre}, ${persona.edad} años, ${persona.genero}, de ${persona.ciudad}, ${persona.pais}.`,
    `Ocupación: ${persona.ocupacion}. Nivel educativo: ${persona.nivelEducativo}. Estado civil: ${persona.estadoCivil}.`,
    `Nivel de ingreso: ${persona.nivelIngreso}. Disposición base ante marcas/estímulos nuevos: ${persona.disposicionBase}.`,
    `Rasgos de personalidad: ${persona.rasgos.join(', ') || 'sin datos'}.`,
    `Valores: ${persona.valores.join(', ') || 'sin datos'}.`,
    `Historia personal: ${persona.historiaPersonal || 'sin datos'}.`,
    `Objeciones típicas que sueles tener: ${persona.objecionesTipicas.join(', ') || 'ninguna en particular'}.`,
    `Canal de comunicación preferido: ${persona.canalPreferido || 'sin datos'}.`,
    'Responde SIEMPRE en primera persona, en el tono y vocabulario que usaría esta persona, siendo coherente con su perfil.',
    'No rompas el personaje ni menciones que eres una IA.'
  ].join(' ')
}

export function testStimulusUserPrompt(estimulo: string, tieneImagen = false): string {
  return [
    tieneImagen
      ? 'Este es el estímulo que se te presenta — analiza también la imagen adjunta (puede ser un anuncio, producto, empaque o landing page):'
      : 'Este es el estímulo que se te presenta (puede ser un anuncio, producto, mensaje o landing page):',
    estimulo ? `"${estimulo}"` : '',
    '',
    'Reacciona como lo harías tú, en base a tu perfil. Da una opinión honesta, con un puntaje de satisfacción del 1 al 10,',
    'los aspectos que más te gustan y tus objeciones u dudas, si las tienes.'
  ]
    .filter(Boolean)
    .join('\n')
}

export function confidenceDisclaimersSystemPrompt(): string {
  return [
    'Eres un analista de investigación de mercado revisando los resultados de un panel sintético.',
    'Dado un resumen de las opiniones del panel, genera 0 a 2 observaciones cualitativas breves y honestas',
    'sobre limitaciones de este resultado (ej. sesgos de perfil, falta de matices, riesgos de sobregeneralizar).',
    'No repitas observaciones obvias sobre tamaño de muestra o varianza estadística — eso ya se calcula aparte.',
    'Si no ves nada cualitativo relevante que añadir, devuelve una lista vacía.'
  ].join(' ')
}

export function confidenceDisclaimersUserPrompt(respuestas: RespuestaConPersona[]): string {
  const resumen = respuestas
    .slice(0, 20)
    .map((r) => `- ${r.persona.nombre} (${r.persona.edad}a, ${r.persona.ciudad}, ${r.persona.disposicionBase}): "${r.opinionTexto}"`)
    .join('\n')
  return `Opiniones del panel para este test:\n\n${resumen}`
}

export function resumenEjecutivoSystemPrompt(): string {
  return [
    'Eres un analista de investigación de mercado escribiendo el resumen ejecutivo de un test con un panel sintético.',
    'Escribe 2-4 frases, en español, directas y accionables: qué tan bien recibido fue el estímulo, el hallazgo principal,',
    'y una recomendación breve si aplica. No repitas cifras exactas que ya se muestran en la pantalla (score, distribución).'
  ].join(' ')
}

export function resumenEjecutivoUserPrompt(estimulo: string, respuestas: RespuestaConPersona[]): string {
  const resumen = respuestas
    .slice(0, 20)
    .map((r) => `- ${r.persona.nombre}: score ${r.scoreSatisfaccion}/10 — "${r.opinionTexto}"`)
    .join('\n')
  return `Estímulo testeado: "${estimulo}"\n\nRespuestas del panel:\n${resumen}`
}

export function temasSystemPrompt(): string {
  return [
    'Eres un analista cualitativo revisando las opiniones de un panel sintético sobre un mismo estímulo.',
    'Identifica 3 a 5 temas recurrentes entre las opiniones. Para cada tema, estima cuántas personas lo tocan',
    'y elige 1-2 personas representativas citando su ID EXACTO de la lista dada junto con una frase corta',
    'tomada casi textualmente de su opinión real — nunca inventes una cita que esa persona no dijo.'
  ].join(' ')
}

export function temasUserPrompt(respuestas: RespuestaConPersona[]): string {
  const lista = respuestas
    .slice(0, 40)
    .map((r) => `- id="${r.personaId}" (${r.persona.nombre}): "${r.opinionTexto}"`)
    .join('\n')
  return `Opiniones del panel:\n\n${lista}`
}

export interface EtapaPropiaHistorial {
  tituloEtapa: string
  opinion: string
  avanzo: boolean
}

export function funnelStageUserPrompt(etapa: EtapaFunnel, historialPropio: EtapaPropiaHistorial[], peerSummary?: string): string {
  const historial = historialPropio
    .map((h, i) => `Etapa ${i + 1} ("${h.tituloEtapa}"): dijiste "${h.opinion}" y decidiste ${h.avanzo ? 'continuar' : 'abandonar'}.`)
    .join('\n')

  return [
    historial ? `Así reaccionaste en las etapas anteriores de este mismo recorrido:\n${historial}\n` : 'Esta es la primera etapa del recorrido.',
    peerSummary ? `\nAsí han reaccionado otras personas del panel en esta misma etapa hasta ahora:\n${peerSummary}\n` : '',
    `\nEtapa actual — "${etapa.titulo}"${etapa.estimuloMetadata.imagenDataUri ? ' (analiza también la imagen adjunta)' : ''}:`,
    etapa.estimuloContenido ? `"${etapa.estimuloContenido}"` : '',
    '',
    'Reacciona como lo harías tú. Da tu opinión, un puntaje de satisfacción del 1 al 10, aspectos positivos, objeciones si las tienes,',
    'y decide honestamente si CONTINUARÍAS al siguiente paso de este recorrido o lo ABANDONARÍAS aquí mismo.'
  ].join('\n')
}

export function followUpUserPrompt(opinionOriginal: string, pregunta: string): string {
  return [
    `En un test anterior dijiste esto sobre un estímulo: "${opinionOriginal}"`,
    '',
    `Ahora el investigador te hace esta pregunta de seguimiento: "${pregunta}"`,
    '',
    'Responde en primera persona, siendo coherente con tu opinión anterior y tu personaje.'
  ].join('\n')
}

export function chatUserPrompt(historia: ChatMensaje[], mensajeNuevo: string): string {
  const historial = historia
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'Investigador' : 'Tú'}: ${m.contenido}`)
    .join('\n')
  return [
    historial ? `Conversación previa:\n${historial}\n` : '',
    `El investigador te dice ahora: "${mensajeNuevo}"`,
    '',
    'Responde en primera persona, manteniendo tu personaje.'
  ].join('\n')
}

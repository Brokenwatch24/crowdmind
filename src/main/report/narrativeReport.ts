import { getTestResults } from '../db/repo/tests'
import { listTemas } from '../db/repo/temas'
import { confidenceLevel } from '@shared/types'
import type { CrowdmindTest, RespuestaConPersona, TemaTest } from '@shared/types'

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface ReportData {
  test: CrowdmindTest
  respuestas: RespuestaConPersona[]
  scorePromedio: number
  distribucion: { positivo: number; neutro: number; negativo: number }
  scorecardPromedios: Record<string, number>
  benchmark: { previousTests: number; previousAverage: number | null; delta: number | null }
  temas: TemaTest[]
  nivel: ReturnType<typeof confidenceLevel>
  topObjeciones: Array<[string, number]>
  porDisposicion: Map<string, { count: number; scoreSum: number }>
  recomendaciones: string[]
}

function gatherReportData(testId: string): ReportData | null {
  const results = getTestResults(testId)
  if (!results) return null
  const temas = listTemas(testId)

  const { test, respuestas, scorePromedio, distribucion, scorecardPromedios, benchmark } = results
  const nivel = confidenceLevel(test.indiceConfianza)

  const objecionCounts = new Map<string, number>()
  for (const r of respuestas) for (const o of r.objeciones) objecionCounts.set(o, (objecionCounts.get(o) ?? 0) + 1)
  const topObjeciones = [...objecionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

  const porDisposicion = new Map<string, { count: number; scoreSum: number }>()
  for (const r of respuestas) {
    const e = porDisposicion.get(r.persona.disposicionBase) ?? { count: 0, scoreSum: 0 }
    e.count++
    e.scoreSum += r.scoreSatisfaccion
    porDisposicion.set(r.persona.disposicionBase, e)
  }

  const recomendaciones = topObjeciones.map(
    ([obj, count]) => `Considera abordar directamente: "${obj}" — mencionada por ${count} de ${respuestas.length} personas.`
  )
  if (recomendaciones.length === 0) recomendaciones.push('No se registraron objeciones recurrentes relevantes en este test.')

  return { test, respuestas, scorePromedio, distribucion, scorecardPromedios, benchmark, temas, nivel, topObjeciones, porDisposicion, recomendaciones }
}

/** Builds a self-contained HTML report — no external assets, safe to printToPDF or preview directly. */
export function generarReporteNarrativoHtml(testId: string): string | null {
  const data = gatherReportData(testId)
  if (!data) return null
  const { test, respuestas, scorePromedio, distribucion, scorecardPromedios, benchmark, temas, nivel, porDisposicion, recomendaciones } = data

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<style>
  body { font-family: system-ui, sans-serif; color: #15171a; padding: 40px; max-width: 780px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #5a5f68; font-size: 12px; margin-bottom: 28px; font-family: ui-monospace, monospace; }
  h2 { font-size: 15px; margin-top: 32px; border-bottom: 1px solid #e5e2db; padding-bottom: 6px; }
  p, li { font-size: 13px; line-height: 1.6; }
  .stat-row { display: flex; gap: 24px; margin: 12px 0; }
  .stat { font-family: ui-monospace, monospace; font-size: 12px; }
  .stat b { display: block; font-size: 20px; font-family: system-ui, sans-serif; }
  .tag { display: inline-block; background: #f2f3f5; border-radius: 12px; padding: 2px 9px; font-size: 11px; margin: 2px 4px 2px 0; }
  .limitations { background: #fff8f0; border: 1px solid #f0e0c8; border-radius: 8px; padding: 14px 16px; }
</style></head>
<body>
  <h1>Reporte de investigación — "${escapeHtml(test.nombre)}"</h1>
  <div class="meta">Generado el ${fmtDate(Date.now())} · Confianza del panel: ${nivel}${test.indiceConfianza !== null ? ` (${test.indiceConfianza}/100)` : ''}</div>

  <h2>Metodología</h2>
  <p>Se testeó el siguiente estímulo contra un panel de ${respuestas.length} personas sintéticas generadas con IA:</p>
  <p><em>"${escapeHtml(test.estimuloContenido)}"</em></p>
  <p>Fecha del test: ${fmtDate(test.createdAt)}. Tipo de test: ${test.tipo === 'funnel' ? 'secuencia / funnel' : 'estímulo único'}.</p>

  <h2>Hallazgos principales</h2>
  <div class="stat-row">
    <div class="stat"><b>${scorePromedio.toFixed(1)}/10</b>SCORE PROMEDIO</div>
    <div class="stat"><b>${distribucion.positivo}</b>POSITIVAS</div>
    <div class="stat"><b>${distribucion.neutro}</b>NEUTRAS</div>
    <div class="stat"><b>${distribucion.negativo}</b>NEGATIVAS</div>
  </div>
  ${test.resumenEjecutivo ? `<p>${escapeHtml(test.resumenEjecutivo)}</p>` : ''}
  ${
    benchmark.previousTests > 0
      ? `<p><strong>Benchmark:</strong> ${benchmark.delta !== null && benchmark.delta >= 0 ? '+' : ''}${benchmark.delta?.toFixed(1)} puntos vs. el promedio histÃ³rico del panel (${benchmark.previousAverage?.toFixed(1)}/10 en ${benchmark.previousTests} tests previos).</p>`
      : ''
  }
  ${
    Object.keys(scorecardPromedios).length > 0
      ? `<p><strong>Scorecard:</strong> ${Object.entries(scorecardPromedios)
          .map(([k, v]) => `${escapeHtml(k)} ${v.toFixed(1)}/10`)
          .join(' Â· ')}</p>`
      : ''
  }
  ${
    temas.length > 0
      ? `<p><strong>Temas recurrentes:</strong></p><p>${temas.map((t) => `<span class="tag">${escapeHtml(t.nombreTema)} (${t.cantidadMenciones})</span>`).join('')}</p>`
      : ''
  }

  <h2>Hallazgos por segmento (disposición base)</h2>
  <ul>
    ${[...porDisposicion.entries()]
      .map(([disp, e]) => `<li><strong>${escapeHtml(disp)}</strong>: ${e.count} personas, score promedio ${(e.scoreSum / e.count).toFixed(1)}/10</li>`)
      .join('')}
  </ul>

  <h2>Recomendaciones</h2>
  <ul>
    ${recomendaciones.map((r) => `<li>${escapeHtml(r).replace(/&quot;([^&]*)&quot;/g, '<em>&quot;$1&quot;</em>')}</li>`).join('')}
  </ul>

  <h2>Limitaciones</h2>
  <div class="limitations">
    ${
      test.disclaimers.length > 0
        ? `<ul>${test.disclaimers.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
        : '<p>No se detectaron limitaciones adicionales más allá de las inherentes a un panel sintético.</p>'
    }
    <p style="margin-top:10px;color:#8a8e96;font-size:11.5px">Este reporte fue generado a partir de un panel de personas sintéticas (IA). Úsalo como insumo direccional, no como sustituto de investigación con personas reales.</p>
  </div>
</body></html>`
}

/** Same content as the HTML report, as plain Markdown — handy for pasting into Notion/docs/PRs. */
export function generarReporteNarrativoMarkdown(testId: string): string | null {
  const data = gatherReportData(testId)
  if (!data) return null
  const { test, respuestas, scorePromedio, distribucion, scorecardPromedios, benchmark, temas, nivel, porDisposicion, recomendaciones } = data

  const lines: string[] = []
  lines.push(`# Reporte de investigación — "${test.nombre}"`)
  lines.push('')
  lines.push(
    `_Generado el ${fmtDate(Date.now())} · Confianza del panel: ${nivel}${test.indiceConfianza !== null ? ` (${test.indiceConfianza}/100)` : ''}_`
  )
  lines.push('')
  lines.push('## Metodología')
  lines.push('')
  lines.push(`Se testeó el siguiente estímulo contra un panel de ${respuestas.length} personas sintéticas generadas con IA:`)
  lines.push('')
  lines.push(`> ${test.estimuloContenido}`)
  lines.push('')
  lines.push(`Fecha del test: ${fmtDate(test.createdAt)}. Tipo de test: ${test.tipo === 'funnel' ? 'secuencia / funnel' : 'estímulo único'}.`)
  lines.push('')
  lines.push('## Hallazgos principales')
  lines.push('')
  lines.push(`- **Score promedio**: ${scorePromedio.toFixed(1)}/10`)
  lines.push(`- **Positivas**: ${distribucion.positivo} · **Neutras**: ${distribucion.neutro} · **Negativas**: ${distribucion.negativo}`)
  if (test.resumenEjecutivo) {
    lines.push('')
    lines.push(test.resumenEjecutivo)
  }
  if (benchmark.previousTests > 0) {
    lines.push('')
    lines.push(
      `**Benchmark**: ${benchmark.delta !== null && benchmark.delta >= 0 ? '+' : ''}${benchmark.delta?.toFixed(1)} puntos vs. promedio historico del panel (${benchmark.previousAverage?.toFixed(1)}/10 en ${benchmark.previousTests} tests previos).`
    )
  }
  if (Object.keys(scorecardPromedios).length > 0) {
    lines.push('')
    lines.push(`**Scorecard**: ${Object.entries(scorecardPromedios).map(([k, v]) => `${k} ${v.toFixed(1)}/10`).join(' · ')}`)
  }
  if (temas.length > 0) {
    lines.push('')
    lines.push(`**Temas recurrentes**: ${temas.map((t) => `${t.nombreTema} (${t.cantidadMenciones})`).join(', ')}`)
  }
  lines.push('')
  lines.push('## Hallazgos por segmento (disposición base)')
  lines.push('')
  for (const [disp, e] of porDisposicion.entries()) {
    lines.push(`- **${disp}**: ${e.count} personas, score promedio ${(e.scoreSum / e.count).toFixed(1)}/10`)
  }
  lines.push('')
  lines.push('## Recomendaciones')
  lines.push('')
  for (const r of recomendaciones) lines.push(`- ${r}`)
  lines.push('')
  lines.push('## Limitaciones')
  lines.push('')
  if (test.disclaimers.length > 0) {
    for (const d of test.disclaimers) lines.push(`- ${d}`)
  } else {
    lines.push('No se detectaron limitaciones adicionales más allá de las inherentes a un panel sintético.')
  }
  lines.push('')
  lines.push('_Este reporte fue generado a partir de un panel de personas sintéticas (IA). Úsalo como insumo direccional, no como sustituto de investigación con personas reales._')

  return lines.join('\n')
}

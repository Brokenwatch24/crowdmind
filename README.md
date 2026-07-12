# Crowdmind

Crowdmind is a local-first desktop app for building panels of AI-simulated "personas" and testing
marketing/product stimuli against them — get directional qualitative feedback (opinions, satisfaction
scores, objections, positives) from a synthetic audience before you spend on real research.

Everything runs on your machine: personas, tests, and responses are stored in a local SQLite database.
The only network calls are the ones you explicitly make to an LLM provider (or none at all, if you use
the built-in offline provider).

> **Status:** v1 core loop + the full v2 feature set below are implemented and verified end-to-end
> (`npm run smoke-test`). Packaging into an installer (electron-builder config) is the one thing left
> outside this scope — `npm run dev` / `npm run build` are the supported ways to run it today.

## Features

**Core loop**
- **Workspaces & panels** — organize personas into named audiences per client/project.
- **Personas** — create manually, generate a batch with AI from a short brief, or **import from a CSV**
  of real survey data (map columns to fields, optionally group near-duplicate rows into one
  representative persona). Every path lands in the same editable preview before saving. Each persona
  gets a deterministic, seed-based avatar.
- **Tests** — single-stimulus, or a full **funnel/sequence** of stages (multi-step landing→checkout style
  flows), run in **individual** mode (everyone reacts independently and in parallel) or **focus group**
  mode (personas respond one at a time, seeing a rotating summary of what peers already said, so the
  first responder doesn't anchor the group).
- **Swarm view** — every response plotted as a force-directed graph node, colored by sentiment, with
  hover tooltips, click-through to the persona, and **drag-to-select a group** to fire a batch follow-up
  question at just those people.
- **1:1 chat** — talk to any persona in character, with conversation history.
- **Multi-provider LLM support** — OpenAI, Anthropic, Google Gemini, and OpenRouter, selectable per
  session, with a **Local (offline)** provider that needs no API key at all (deterministic, seeded
  responses) so you can try the whole app without signing up for anything.

**Analysis & trust**
- **Confidence/diversity badge** — an auditable 0-100 score (sample size + score variance + demographic
  coverage, formula documented in `src/main/analytics/confidence.ts`) plus rule-based and AI-generated
  disclaimers, shown on every test.
- **Recurring themes** — after each test, 3-5 themes are extracted with representative persona quotes
  (validated against real responses — the model can't invent a quote from someone who didn't say it).
- **Persona version history** — every edit snapshots the persona's prior state with a plain-English diff;
  past test results always show which version of a persona actually produced that response.
- **Panel/audience comparison** — diff any two tests (same panel, two stimuli — or two panels, one
  stimulus) side by side with a per-persona score delta.
- **Panel evolution timeline** — score trend across every test ever run against a panel.
- **Narrative report export** — a methodology/findings/recommendations/limitations report, exportable as
  PDF or raw JSON.
- **Marketplace (file-based)** — export a panel as a portable `.json` template (personas only, no
  internal IDs or results) to share anywhere; import someone else's template to spin up a new panel.

## Getting started

Requirements: **Node.js 20+**, **npm**. On Windows, native module compilation for `better-sqlite3` needs
Python and MSVC Build Tools (Visual Studio Build Tools with the "Desktop development with C++" workload)
— see [Troubleshooting](#troubleshooting) if `npm install` fails on that step.

```bash
npm install     # also rebuilds better-sqlite3 for Electron's ABI (postinstall)
npm run dev     # launches the app in development mode
```

No API key is required to try the app — it defaults to the **Local (offline)** provider. To use a real
LLM, go to **Ajustes** (Settings) in the sidebar, paste an API key for OpenAI / Anthropic / Gemini /
OpenRouter, pick a default model, then switch the provider selector in the top bar.

API keys are stored in the local SQLite database, encrypted at rest via the OS keychain
(`safeStorage`) when available on your platform; if OS-level encryption isn't available, Settings will
tell you and fall back to a clearly-labeled plaintext store. Keys never leave your machine except in the
direct HTTPS request to the provider you chose.

### Other scripts

```bash
npm run build       # production build (main + preload + renderer) via electron-vite
npm run typecheck   # strict TypeScript check across main/preload/renderer
npm run smoke-test  # end-to-end check of every feature using the Local provider (no API keys needed)
npm run db:generate # generate a Drizzle migration after changing src/main/db/schema.ts
```

## How it's built

- **Shell**: Electron, built with [electron-vite](https://electron-vite.org/) (React 18 + TypeScript
  renderer, Vite dev server with HMR).
- **State**: Zustand for lightweight session state (current workspace, current LLM provider).
- **UI**: Tailwind CSS + a small set of hand-built shadcn-style components on top of Radix primitives.
  Dark theme tokens are lifted from the original Crowdmind design reference.
- **Database**: SQLite via `better-sqlite3`, schema managed with Drizzle ORM. The DB file lives in
  Electron's `userData` directory (e.g. `%APPDATA%/crowdmind/crowdmind.sqlite` on Windows). Bootstrap is
  idempotent (`CREATE TABLE IF NOT EXISTS`) and columns added after first release are backfilled with
  guarded `ALTER TABLE ... ADD COLUMN` calls in `src/main/db/client.ts` — upgrading an existing local DB
  never loses data and never needs a manual migration step.
- **LLM layer** (`src/main/llm/`): a small `LlmProvider` interface implemented once per real provider
  (`openai.ts`, `anthropic.ts`, `gemini.ts`, `openrouter.ts`), each using a plain `fetch` call (no SDKs)
  and validating the response against a `zod` schema with one retry on malformed JSON. The `local`
  provider bypasses this entirely with deterministic, seeded generators (`src/main/llm/local/`) — same
  inputs always produce the same personas/opinions, which is what powers `npm run smoke-test`.
- **Funnel engine** (`src/main/engine/funnelEngine.ts`): individual mode runs personas in parallel, each
  walking their own stage sequence and stopping at their own drop-off point. Focus-group mode is
  deliberately sequential — one persona at a time per stage, peer-response order rotated per stage so the
  first respondent doesn't dominate.
- **Process boundary**: all DB, LLM, filesystem, and dialog access happens in the Electron **main**
  process. The renderer only ever talks to a narrow, typed `window.crowdmind.*` API exposed via
  `contextBridge` in `src/preload/index.ts` (`contextIsolation` on, `nodeIntegration` off) — no API keys
  or SQL ever reach the renderer.
- **Swarm graph**: `d3-force` simulation, rendered directly on `<canvas>` (no DOM-per-node), in
  `src/renderer/src/components/SwarmCanvas.tsx`, with drag-to-select (marquee) for batch follow-ups.

## Data model

SQLite tables (see `src/main/db/schema.ts` for the source of truth):

| Table | Purpose |
|---|---|
| `workspaces` | Top-level container per client/project |
| `provider_settings` | API keys (encrypted) + default model, global or per-workspace |
| `paneles` | Named audience within a workspace; `es_publico`/`descripcion_publica`/`autor_publico` for marketplace exports |
| `personas` | The synthetic people in a panel — demographics, traits, values, backstory |
| `persona_versiones` | Snapshot + plain-English diff on every persona edit |
| `tests` | A stimulus run against a panel — simple or funnel, plus confidence index/disclaimers/executive summary |
| `etapas_funnel` | Ordered stages for a funnel-type test |
| `respuestas` | One persona's response to a test or funnel stage (score, opinion, objections, positives, drop-off flag) |
| `temas_test` | Extracted recurring themes + representative quotes per test |
| `follow_ups` / `follow_up_respuestas` | Batch follow-up questions fired from the swarm view and their answers |
| `comparaciones` | History of panel/audience comparisons run |
| `chat_mensajes` | 1:1 chat history with a persona |

## Troubleshooting

**`npm install` fails while building `better-sqlite3`** — this project bundles a native SQLite binding
that must be compiled for Electron's exact V8 ABI, not your system Node's. The `postinstall` script runs
`electron-rebuild` automatically, which needs a C++ toolchain:
- **Windows**: install "Desktop development with C++" via the Visual Studio Installer, plus Python 3.
- **macOS**: `xcode-select --install`.
- **Linux**: `build-essential` (or your distro's equivalent) + Python 3.

If it still fails after that, delete `node_modules` and re-run `npm install`.

**Settings shows "OS-level encryption not available"** — this happens on some Linux setups without a
keyring daemon running. Your API keys still work, they're just stored in plaintext locally; use a
scoped/limited-permission key if that's a concern on that machine.

**Focus-group funnel tests are slow** — that's by design: personas are processed one at a time within
each stage so each one can see what peers already said. The UI warns when you select more than ~20
personas for a focus-group run; keep those panels small.

## License

MIT

# Crowdmind

Crowdmind is a local-first desktop app for building panels of AI-simulated "personas" and testing
marketing/product stimuli against them — get directional qualitative feedback (opinions, satisfaction
scores, objections, positives) from a synthetic audience before you spend on real research.

Everything runs on your machine: personas, tests, and responses are stored in a local SQLite database.
The only network calls are the ones you explicitly make to an LLM provider (or none at all, if you use
the built-in offline provider) — plus an optional, best-effort check against GitHub for app updates and
new community-contributed persona templates.

Repo: **https://github.com/Brokenwatch24/crowdmind**

> **Status:** the full feature set below is implemented and verified end-to-end
> (`npm run smoke-test`, 19 checks covering every feature). **[v0.1.0](https://github.com/Brokenwatch24/crowdmind/releases/tag/v0.1.0)**
> is published with a Windows installer — download it directly, no build required. macOS/Linux
> packaging is configured but unverified (this dev machine can't produce those builds) — see
> [Cutting a release](#cutting-a-release) if you want to build and publish them from a Mac/Linux
> machine.

## Features

**Core loop**
- **Workspaces & panels** — organize personas into named audiences per client/project.
- **Personas** — create manually, generate a batch with AI from a short brief, or **import from a CSV**
  of real survey data (map columns to fields, optionally group near-duplicate rows into one
  representative persona). Every path lands in the same editable preview before saving. Each persona
  gets a deterministic, seed-based avatar.
- **Tests** — single-stimulus (**text, image, or both**) or a full **funnel/sequence** of stages
  (multi-step landing→checkout style flows, each stage optionally with its own image), run in
  **individual** mode (everyone reacts independently and in parallel) or **focus group** mode (personas
  respond one at a time, seeing a rotating summary of what peers already said, so the first responder
  doesn't anchor the group). A rough cost estimate (tokens × approximate provider pricing) shows before
  you run anything.
- **Swarm view** — every response plotted as a force-directed graph node, colored by sentiment, with
  hover tooltips, click-through to the persona, and **drag-to-select a group** to fire a batch follow-up
  question at just those people.
- **1:1 chat** — talk to any persona in character, with conversation history.
- **Multi-provider LLM support** — OpenAI, Anthropic, Google Gemini, and OpenRouter (all with automatic
  retry + exponential backoff on rate limits), selectable per session, with a **Local (offline)**
  provider that needs no API key at all (deterministic, seeded responses) so you can try the whole app
  without signing up for anything.
- **Demo workspace** — one click on first launch generates a fully populated example (panel, 8 personas,
  a completed test with confidence index/themes/summary) using the Local provider, so the app is never
  just an empty screen.

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
  **PDF, Markdown, or raw JSON**.
- **Marketplace** — export a panel as a portable `.json` template (personas only, no internal IDs or
  results) to share anywhere; import someone else's template, browse templates bundled with the app, or
  pull the latest ones straight from GitHub without waiting for an app update.

## Getting started

**Just want to use the app on Windows?** Download the installer from the
[latest release](https://github.com/Brokenwatch24/crowdmind/releases/latest) and skip straight to running
it — no Node/build tooling needed. The rest of this section is for running from source or contributing.

Requirements: **Node.js 20+**, **npm**. On Windows, native module compilation for `better-sqlite3` needs
Python and MSVC Build Tools (Visual Studio Build Tools with the "Desktop development with C++" workload)
— see [Troubleshooting](#troubleshooting) if `npm install` fails on that step.

```bash
git clone https://github.com/Brokenwatch24/crowdmind.git
cd crowdmind
npm install     # also rebuilds better-sqlite3 for Electron's ABI (postinstall)
npm run dev     # launches the app in development mode
```

No API key is required to try the app — it defaults to the **Local (offline)** provider, and the
"Cargar workspace de ejemplo" button on first launch gives you something to click around immediately. To
use a real LLM, go to **Ajustes** (Settings) in the sidebar, paste an API key for OpenAI / Anthropic /
Gemini / OpenRouter, pick a default model, then switch the provider selector in the top bar.

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
npm run dist:win    # build + package a Windows installer into release/
npm run dist:mac    # build + package a macOS dmg (must run on macOS)
npm run dist:linux  # build + package a Linux AppImage
npm run release     # build + package + publish to GitHub Releases (needs a GH token, see below)
```

## Packaging & distribution

`electron-builder.yml` configures NSIS (Windows), dmg (macOS), and AppImage (Linux) targets, plus an app
icon at `build/icon.png`. Only the Windows build has actually been produced and launch-tested on this
project so far — `npm run dist:win` builds `release/Crowdmind Setup <version>.exe` and a `win-unpacked/`
folder you can run directly to sanity-check without installing.

### Cutting a release

The app checks GitHub Releases for updates (see below), so a release needs to exist for that to do
anything. To publish one:

```bash
export GH_TOKEN=<a github token with repo scope>
npm version patch   # or minor/major — bumps package.json and tags
npm run release      # builds, packages, and uploads to a GitHub Release matching the new tag
```

`electron-builder`'s `--publish=always` creates a **draft** release with the installer(s) and the
`latest.yml`/`latest-mac.yml` metadata electron-updater needs — review it in GitHub and publish it
manually when ready. Until a release is published, `npm run dist:win` (no publish) is the safe way to
produce a local installer to test.

## Auto-update

Packaged builds check GitHub Releases ~3 seconds after launch (`src/main/update/autoUpdate.ts`, via
[`electron-updater`](https://www.electron.build/auto-update)). It never installs anything without
confirmation:

1. A thin banner appears if a newer version is published: **"Nueva versión vX.Y.Z disponible" → Descargar**.
2. Once downloaded: **"Actualización lista para instalar" → Reiniciar ahora** (calls `quitAndInstall()`).

Dev mode (`npm run dev`, unpackaged) never checks — there's nothing to update. This is intentionally
**not** silent/automatic; nothing downloads or installs without an explicit click.

## Contributing a persona template

Templates live as plain `.json` files in [`resources/templates/`](resources/templates), in the exact
format the app's own "Exportar panel" produces (`MarketplacePanelTemplate`: `formatVersion`, `nombre`,
`descripcionPublica`, `autorPublico`, `personas[]`). To contribute one:

1. Build a panel in the app you're happy with, then use **Exportar panel** to save it as `.json`.
2. Drop that file into `resources/templates/` in a fork of this repo (rename it something descriptive,
   kebab-case, ending in `.json`).
3. Open a PR. Once merged, anyone can pull it immediately via the **Actualizar** button in the
   Marketplace dialog (fetches straight from `main` on GitHub — no new app release needed) — and it ships
   bundled with the app starting from the next release.

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
  wrapped in exponential backoff on 429/5xx (`fetchWithBackoff.ts`), and validating the response against
  a `zod` schema with one retry on malformed JSON. Vision-capable providers accept an optional stimulus
  image (base64 data URI) alongside text. The `local` provider bypasses all of this with deterministic,
  seeded generators (`src/main/llm/local/`) — same inputs always produce the same personas/opinions,
  which is what powers `npm run smoke-test`.
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
| `tests` | A stimulus run against a panel — simple or funnel, plus stimulus type/image, confidence index/disclaimers/executive summary |
| `etapas_funnel` | Ordered stages for a funnel-type test, each with its own stimulus (+ optional image) |
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

**Stimulus images are capped at 4MB** — sent as a base64 data URI to the provider; larger images are
rejected client-side before anything is uploaded.

## License

MIT

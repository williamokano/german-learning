# TECH-STACK.md — chosen stack & rationale

> Decision owner already approved this stack. This file records **what to install,
> how to configure it, how it deploys, and why** — so an implementer reproduces it
> without re-litigating choices.

---

## 1. The stack at a glance

| Layer | Choice | Role |
|---|---|---|
| Site framework / build | **Astro 5** | content-first SSG, markdown/MDX native, routing, build-time schema validation, island hydration |
| Lesson content | **Markdown + MDX** (`@astrojs/mdx`) | lesson source with inline `<AudioPlay>` components |
| Interactive widgets | **Svelte 5** islands (`@astrojs/svelte`) | the exercise widgets (drag/click, reactive state) |
| Domain logic | **TypeScript** (framework-free `core/`) | grading, scoring, services, content types |
| Schema validation | **Zod** (via `astro:content`) | validate `exercises.yml` + lesson frontmatter at build |
| YAML parsing | **`yaml`** (npm) in `build/`, Astro's loader for content | parse `exercises.yml` |
| Drag & drop | **native Pointer Events** (no DnD library) | gap-bank / categorize / order — see §5 |
| Styling | **plain CSS + CSS custom properties** (optionally `@layer`) | no UI framework, no Tailwind requirement |
| Tests | **Vitest** | unit tests for `core/` (engine, scoring, services) |
| Package manager | **pnpm** (npm acceptable) | — |
| Deploy | **GitHub Actions → GitHub Pages** | static `/dist` |

Node ≥ 20. Pin exact versions in `web/package.json` at scaffold time; the majors
above are the contract.

---

## 2. Why Astro (and why not the alternatives)

The product is **content-heavy** (26+ lessons of reading) with **pockets of
interactivity** (the exercises). Astro is purpose-built for exactly this:

- **Markdown/MDX is a first-class source**, not a plugin afterthought. Lessons
  render with near-zero JS; only widgets ship JavaScript (island architecture).
- **Content Collections + Zod** validate `exercises.yml` and lesson frontmatter at
  **build time** — a missing answer or malformed exercise **fails the build**, so
  it can never reach a learner. This directly serves the "no silently-wrong answer"
  constraint.
- **Framework-agnostic islands**: widgets are Svelte, but Astro doesn't care; the
  reading shell stays HTML. Components are reusable across pages.
- **No host lock-in.** `astro build` emits a static `/dist` for GitHub Pages today.
  Adding `@astrojs/node` later turns on SSR + `/api` routes for the backend, self-
  hosted anywhere (Docker) — **never Vercel**.

Rejected, briefly: **Next.js** — the explicit "no Vercel marriage" veto, and SSR
is overkill for static content. **SvelteKit / Nuxt** — fuller app frameworks where
every page is a component and markdown rendering is DIY; heavier than needed for a
reading-first site (Astro reaches the same backend-later endpoint with less
ceremony now). **Vanilla / Solid-Start** — more hand-built plumbing (routing,
content schema) for no benefit here.

## 3. Why Svelte for the widgets

The widgets are small, stateful, and reactive (a placed token, a revealed
correctness state). Svelte 5 runes (`$state`, `$derived`, `$props`) express this
with minimal boilerplate and compile to tiny bundles. They hydrate as Astro islands
(`client:visible` for below-the-fold exercises, `client:load` only where needed).

> The widgets depend on `core/` for all logic (checking, scoring, persistence).
> Svelte holds **only view state** (what's placed where, is it revealed). If Svelte
> were ever swapped, `core/` and the content model survive untouched. The widgets
> being Svelte-bound is an accepted, contained cost.

---

## 4. Project configuration

`web/astro.config.mjs` (shape — pin versions at scaffold):

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://<user>.github.io',
  base: '/german-learning',          // GitHub Pages project-site base path
  output: 'static',                  // → 'hybrid' when the backend lands
  integrations: [mdx(), svelte()],
  // markdown.remarkPlugins / rehypePlugins: the lesson-enrichment passes
  // (see CONTENT-MODEL.md §Lesson and BUILD-PIPELINE.md §Lesson rendering)
});
```

`web/package.json` dependencies (majors; pin exact at scaffold):

```
dependencies:   astro@^5  @astrojs/mdx@^4  @astrojs/svelte@^7  svelte@^5  zod@^3  yaml@^2
devDependencies: typescript@^5  vitest@^2  @types/node@^20
```

`tsconfig.json`: extend `astro/tsconfigs/strict`; add a path alias
`@core/* → src/core/*` so widgets import logic cleanly.

> **`base` matters.** On a project Pages site the app is served from
> `/<repo>/`. Every internal link and asset URL must respect `import.meta.env.BASE_URL`
> (Astro's `<a href>` + `astro:assets` handle this; raw `audio/*.mp3` refs must be
> resolved through a helper — see `AudioService` in `SCORING.md`/`COMPONENTS.md`).

---

## 5. Drag & drop: no library

The required interactions — gap-bank, categorize, order — all need: **drag a token**
*and* **click-to-place / click-to-return**. That click behavior is custom logic we
own regardless, so a DnD library would only cover half the job while adding weight
and touch-quirks. Use **native Pointer Events** with a small shared helper
(`makeDraggable`) in the widget layer, plus the click handlers. Requirements the
helper must meet: mouse + touch + keyboard accessibility (tokens are focusable;
Enter/Space place; Escape returns). Spec lives in `COMPONENTS.md §Drag interaction`.

If a library is ever wanted, prefer a **framework-agnostic** one (e.g. Atlassian
Pragmatic drag-and-drop) over a React-coupled one — but the default is none.

---

## 6. Audio

A single `AudioService` in `core/services` wraps `HTMLAudioElement`:

- resolves a lesson-relative `src` (e.g. `dialog1_a.mp3`) to a base-path-correct URL,
- enforces a **one-active-clip policy** (starting a clip stops any other),
- exposes `play(src)`, `pause()`, `toggle(src)`, and a `playing` signal.

The `AudioPlay` Svelte component is a thin view over it. Audio files are **not**
imported as modules; they are referenced from `public/`-mirrored lesson audio (see
`BUILD-PIPELINE.md §Audio assets`).

---

## 7. Deployment — GitHub Pages via Actions

`.github/workflows/deploy-pages.yml` (shape):

```yaml
name: Deploy site
on:
  push: { branches: [main], paths: ['web/**', 'A1/**', 'A2/**', 'B1/**', 'docs/web/**'] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { lfs: true }              # audio is in Git LFS (see README)
      - run: git lfs pull
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm, cache-dependency-path: web/pnpm-lock.yaml }
      - run: pnpm -C web install --frozen-lockfile
      # optional: regenerate exercises.md/solutions.md to assert they're in sync
      # - run: pnpm -C web exec tsx ../build/gen-exercises.ts --all --check
      - run: pnpm -C web build
      - uses: actions/upload-pages-artifact@v3
        with: { path: web/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps: [ { id: deployment, uses: actions/deploy-pages@v4 } ]
```

Key points: **LFS checkout** (audio MP3s live in Git LFS — see repo `README.md`);
build reads content directly from the `A*/` folders (the Astro content collection
globs them — see `BUILD-PIPELINE.md §Content collections`).

> **`gen-exercises --check` in CI (recommended):** assert that the committed
> `exercises.md`/`solutions.md` match what the current `exercises.yml` would
> generate, so the printable artifacts can never silently fall out of sync with the
> source. Fail the build on drift.

---

## 8. Future backend (designed, not built)

Add `@astrojs/node`, switch `output` to `'hybrid'`, put endpoints under
`web/src/pages/api/*.ts`, and register `ApiStorage` (implements `StorageService`)
in the composition root. Self-host the Node server in a container. Auth/payments
for mentoring become additional `/api/*` routes + an `AuthService` in `core/`. The
widgets, lessons, grading, and scoring do not change. See `ARCHITECTURE.md §6`.

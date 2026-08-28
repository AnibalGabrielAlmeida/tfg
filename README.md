# Harmonic Progressions Platform

> An interactive web platform for building, hearing, and understanding harmonic progressions — bridging music theory, ear training, and hands-on experimentation in a single browser-based environment.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=flat-square&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql)
![Tone.js](https://img.shields.io/badge/Audio-Tone.js%2015-FF6B35?style=flat-square)

**Live demo:** https://tfg-plataforma-interactiva-armonica.netlify.app/

Final degree project (TFG). The application UI is in Spanish; this document is in English.

---

## The Problem

Learning harmony is traditionally fragmented. You read a chord progression in a textbook, then pick up your instrument to try it, then search for recordings to hear how it sounds. Theory, practice, and listening happen separately — and that gap slows understanding.

This platform integrates all three into a single interactive experience: **build visually, hear immediately, understand functionally**.

---

## Features

### Visual progression editor

Chord blocks are added from a chord bank grouped by theory system (diatonic, secondary dominants, modal interchange), reordered by drag and drop, resized in beats, duplicated or deleted. Each block shows its Roman numeral degree, so you think in harmonic function rather than in chord names. Edits that would push a bar past 4 beats are rejected instead of applied (`chordflow/src/modules/progression/useProgressionManager.ts`).

### Real-time audio playback

Tone.js schedules the progression as a loop over `Tone.Transport`, using a sampled Rhodes (`chordflow/public/samples/rhodes/`), drop-2 voicings with voice leading between consecutive chords, and light timing/velocity humanization. The currently sounding block is highlighted. Spacebar toggles play/stop. No plugins, no installs.

### Tonal function visualization

Every chord displays its tonal function — **Tonic (T)**, **Subdominant (S)** or **Dominant (D)** — computed by `functionalRoleMajor` (`chordflow/src/modules/theory/functions.ts`), a heuristic for major mode that also feeds the explanation strings.

### Harmonic recommendation engine

A side panel proposes the next degrees from the last chord in the progression, each with a one-line explanation in functional terms. Clicking one appends it to the progression. Three signals are combined:

| Layer | What it does |
|---|---|
| **Markov** | Hand-authored transition weights between degrees, one matrix per style (Pop and Neo-Soul) |
| **Berklee boost** | A rule table for named harmonic devices that adds score to theoretically strong moves — `V → I` +3, `ii → V` +2, `♭VII → I` +1.5 |
| **Voice leading penalty** | Penalizes large leaps between the two chords' MIDI triads, discounted by 0.5 when they share a pitch class |

**Score formula:** `score = markovWeight + berkleeBoost − voiceLeadingCost` (`chordflow/src/modules/recommendation/scoring.ts`)

Each suggestion carries a plain-language explanation of *why* that chord makes sense, turning every recommendation into a micro-lesson.

Style selects the matrix rather than the selection method: `useSuggestions` calls the engine with `alpha = 1` for Pop and `alpha = 0` for Neo, and `getBlendedMarkovRow` can linearly blend the two matrices for intermediate values. The panel itself is deterministic — it shows the top 3 by score.

### User authentication and persistence

Progressions are saved to `localStorage` and can be exported to / imported from a JSON file. With an account they can also be saved to and loaded from the backend. Passwords are hashed with bcrypt, sessions are stateless JWTs. Frontend and backend are deployed on separate domains, with CORS configured explicitly.

Key and style are picked from fixed sets in this version: keys `C`, `G`, `D`, `F` and styles `Pop` / `Neo` (`chordflow/src/App.tsx`).

---

## Tech Stack

**Frontend** (`chordflow/`) — TypeScript 5.9, Vite 7.1

- React 19.1 — state held in `useState` inside domain hooks; no external state library, the complexity didn't warrant it
- Tone.js 15.1 — audio scheduling and synthesis over the Web Audio API; `Transport` handles BPM, loop and playback state
- `@dnd-kit/core` 6.3 + `@dnd-kit/sortable` 10.0 for the drag-and-drop timeline
- ESLint 9.36 with `typescript-eslint` 8.45
- No CSS framework — styles are hand-written in `chordflow/src/styles/global.css`

**Backend** (`backend/`) — TypeScript 5.9, compiled to CommonJS, `dist/` output

- Express 5.2 — layered: routes → controllers → services, plus auth middleware
- PostgreSQL via `pg` 8.16
- `jsonwebtoken` 9.0 (7-day expiry) and `bcryptjs` 3.0
- `helmet` 8.1, `cors` 2.8, `express-rate-limit` 8.6
- `dotenv` 17.2, `ts-node-dev` 2.0 for development

**Database** — PostgreSQL, hosted on Neon. Schema in `db/schema.sql`: `users`, `musical_key` and `progressions`, with the chord blocks stored in a `JSONB` column rather than in a chord-level table.

**Deployment** — frontend on Netlify (CI/CD from GitHub), backend on Render, database on Neon.

TODO: neither `package.json` declares an `engines` field, so the minimum Node version is not pinned anywhere in the repo.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                      Browser                          │
│                                                       │
│  ┌────────────────────┐   ┌───────────────────────┐  │
│  │  React UI          │   │  Tone.js / Web Audio   │  │
│  │  components/       │   │  modules/audio/        │  │
│  │  (ChordPool,       │   │  (player, sampler,     │  │
│  │   ProgressionList, │   │   fxChain, usePlayback)│  │
│  │   SuggestionPanel) │   └───────────────────────┘  │
│  └─────────┬──────────┘                              │
│            │                                          │
│  ┌─────────▼──────────────────────────────────────┐  │
│  │  modules/  theory · recommendation · progression│  │
│  │            storage · presets                    │  │
│  └────────────────────────────────────────────────┘  │
│            │ REST (JWT in Authorization header)       │
└────────────┼─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│                 Node.js + Express                     │
│                                                       │
│  routes → controllers → services                      │
│  ├── auth.middleware   (JWT verify)                   │
│  └── AppError + handleError (normalized JSON errors)  │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│              PostgreSQL (Neon)                        │
│                                                       │
│  users ──< progressions >── musical_key               │
│                 └── data JSONB (the ChordBlock array) │
└──────────────────────────────────────────────────────┘
```

---

## Running it locally

You need Node with npm, and a PostgreSQL instance.

**1. Clone and install**

```bash
git clone https://github.com/AnibalGabrielAlmeida/tfg.git
cd tfg
cd backend && npm install
cd ../chordflow && npm install
```

**2. Create the database and run the schema**

The schema uses `gen_random_uuid()`, so it enables the `pgcrypto` extension — the role you connect with needs permission to do that.

```bash
createdb chordflow
psql -d chordflow -f db/schema.sql
```

**3. Configure the backend**

Copy `backend.env.example` to `backend/.env` and fill it in.

| Variable | Example | What it's for |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/chordflow` | Postgres connection string for the `pg` pool (`backend/src/config/db.ts`). |
| `PORT` | `4000` | Port the Express server listens on. Falls back to `4000` if unset (`backend/src/index.ts`). |
| `JWT_SECRET` | `a-long-random-string` | Secret used to sign and verify the auth JWT, issued with a 7-day expiry (`backend/src/services/auth.service.ts`, `backend/src/middlewares/auth.middleware.ts`). |
| `FRONTEND_URL` | `http://localhost:5173` | The single origin CORS will accept. Compared with `===` against the request `Origin`, so it must match exactly — no trailing slash (`backend/src/index.ts`). |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Fallback for `FRONTEND_URL`, used only when that one is empty. Same meaning. |
| `CORS_ORIGIN` | `http://localhost:5173` | Second fallback, used only when both of the above are empty. Same meaning. |

The three CORS variables exist because the deployed environment already had one name set; the code reads whichever is non-empty, in that order. Set one of them.

Note: the pool is created with `ssl: { rejectUnauthorized: true }`, unconditionally. A default local Postgres without SSL will fail to connect — either point `DATABASE_URL` at an SSL-enabled instance, or change that line in `backend/src/config/db.ts` while developing locally.

**4. Configure the frontend**

Copy `chordflow.env.example` to `chordflow/.env`.

| Variable | Example | What it's for |
| --- | --- | --- |
| `VITE_API_BASE` | `http://localhost:4000` | Base URL the frontend prefixes onto every API call. Falls back to `http://localhost:4000` if unset (`chordflow/src/api/client.ts`). |

**5. Run both**

```bash
cd backend && npm run dev      # ts-node-dev, watches and respawns
cd chordflow && npm run dev    # Vite dev server, prints its URL (5173 by default)
```

Check the backend is up and can reach the database at `GET /health`, which returns `{ "status": "ok", "dbTime": ... }`.

**6. Create an account (optional)**

Saving to the backend needs an account, but the UI only exposes a login form — nothing in the frontend calls the register endpoint. Register with a direct request:

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"at-least-8-chars"}'
```

Then log in from the Biblioteca panel in the app. Everything except cloud save/load works without an account.

**Tests:** `npm test` in `chordflow/` runs the Vitest suite over the pure theory and recommendation modules; `npm run test:watch` re-runs on save. There are no tests in `backend/` yet.

**Production builds:** `npm run build` in `backend/` (`tsc` → `dist/`, then `npm start` runs `node dist/index.js`) and in `chordflow/` (`tsc -b && vite build`).

**Requirements:** Node.js 18+, PostgreSQL (or a Neon connection string).

---

## API

All `/progressions` routes require an `Authorization: Bearer <token>` header.

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/auth/register` | Email format checked, password min. 8 chars. Rate limited to 20 requests / 15 min per IP. |
| `POST` | `/auth/login` | Returns `{ token }`. Same rate limit. |
| `POST` | `/progressions` | Requires `title` and `data`; `data` is stored as `JSONB`. |
| `GET` | `/progressions` | Lists the caller's progressions (metadata only, no `data`). |
| `GET` | `/progressions/:id` | Full record. Returns 404 if it belongs to another user. |
| `GET` | `/health` | Runs `SELECT NOW()` against the pool. |

---

## Design notes

### The recommendation engine combines a Markov model with theory rules, rather than using either alone

The engine lives entirely in the frontend and operates on harmonic degrees (I, ii, IV, V, vi, ♭VII, V/ii…) rather than raw chord names, so it is key-agnostic.

`getScoredSuggestions` scores each candidate degree as `markovWeight + berkleeBoost − voiceLeadingCost` (`recommendation/scoring.ts`). The Markov weight comes from hand-authored transition matrices per style (`markov.ts`); the boost comes from a rule table for named harmonic devices (`theory/berklee.ts`); the cost penalizes large leaps between the two chords' MIDI triads (`recommendation/heuristics.ts`).

One extra mechanism is live on this path: a **tonal function fallback** — if a degree has no row in the matrix, `buildFallbackRow` constructs a generic row from its T/S/D function, so no degree is ever stranded without candidates.

Why: the Markov matrices capture what a style actually tends to do, including moves theory doesn't privilege, but they're a flat table with no notion of *why* a move works — and the app's main value is explaining itself. The rule table supplies that: each rule carries a description string that the UI shows next to the suggestion. Neither part alone gives both "this is idiomatic for pop" and "because ♭VII resolves to I like a backdoor cadence."

The Markov matrices were defined manually from functional theory and stylistic knowledge, not trained on a corpus. That makes them interpretable, controllable, and honest about what they are: *informed heuristics*, not learned statistics.

Trade-off: the score is a sum of three quantities on three unrelated scales, with weights tuned by ear rather than fitted to anything. Nothing guarantees the rule boost and the Markov weight are commensurable — a +3 cadence boost can outrank a genuinely more common transition. Making this principled would mean estimating the transitions from real data and learning the weights, which was out of scope here.

### The frontend is organized by domain, not by technical layer

`chordflow/src/modules/` splits into `theory/`, `recommendation/`, `audio/`, `progression/`, `storage/` and `presets/` — each holding its own logic, types and hooks together (`useProgressionManager` sits in `progression/`, `usePlayback` in `audio/`, `useSuggestions` in `recommendation/`). Only presentational components live under `components/`, and `App.tsx` does nothing but compose them and hold session state.

Why: the hard parts of this project are musical, not architectural. A `hooks/` + `utils/` + `services/` split would have scattered the harmony code across three folders and made it impossible to see the boundary between "how chords work" and "how they're drawn." The domain split also made the theory engine swappable — `roman2.ts` replaced the original `roman.ts` for the scoring path, and only the importing modules had to change.

Trade-off: the boundaries aren't perfectly clean. `roman.ts` and `roman2.ts` both still exist, with `player.ts` using the first and `scoring.ts` the second — a migration left half-finished that now needs a reader to know which is which. Domain folders also make a module's public API implicit; nothing stops a component from reaching into an internal helper, since there are no barrel files enforcing what's exported.

### Playback is scheduled in ticks, and changes wait for the next downbeat

`scheduleProgression` computes positions in PPQ ticks (`beats * Tone.Transport.PPQ`) rather than in seconds or bar:beat strings, and sets the transport loop from those tick values (`audio/player.ts`). When the progression, BPM or key changes while playing, `rescheduleAtNextDownbeat` doesn't reschedule immediately: it computes `ceil(nowTicks / ticksPerMeasure) * ticksPerMeasure` and defers the swap to that point with `Transport.scheduleOnce`.

Why: ticks are tempo-independent, so a BPM change doesn't invalidate the positions already computed, and there's no float drift accumulating across loop repetitions. Deferring to the downbeat solves a UX problem — every edit runs through a `useEffect` on `[progression, bpm, key]`, so without it, dragging a block would restart the loop mid-bar and produce an audible stutter on every keystroke.

Trade-off: edits take effect up to a full bar later, which feels unresponsive at slow tempos. The downbeat calculation also hardcodes `ppq * 4` as the bar length, so it silently assumes 4/4 — the schema has a `time_signature` column and the frontend always sends `"4/4"`, but the audio engine couldn't honor anything else if it did. And because scheduling state (`scheduledIds`, `lastVoicing`, `pendingReschedule`) lives in module-level variables rather than in React, there can only ever be one transport, and the audio engine's state is invisible to React DevTools.

---

## Known gaps

Scope limits here are deliberate; the rest are real debts, listed so a reader doesn't have to discover them.

**Musical scope**

- **Four keys, major mode only, 4/4 only, triads only.** `theorySets.ts` has tritone substitutions and harmonic-minor borrowings written out but commented off, because the theory engine doesn't voice them correctly yet.
- **First-order Markov** — the engine considers only the current chord, not the progression history.
- **The UI is Spanish-only**, with no i18n layer.

**Written but not wired up**

- **The anti-repetition penalties and the secondary-dominant guarantee never run.** `applyPenalties` (0.4 on a trivial I→V→I bounce, 0.6 on repeating the last suggestion, 0.3 on staying put) and the guaranteed resolution for secondary dominants live in `suggestNextDegree`, `suggestNextTopN` and `suggestNextDegreePop` — and none of those three functions is imported anywhere. The path the UI actually runs (`useSuggestions` → `getScoredSuggestions` → `getBlendedMarkovRow`) applies none of them.
- **`getContextualExplanation` returns an empty string.** It's an extension point wired through `getSuggestionExplanation`, designed for a future version.

**Engineering debt**

- **The backend has no tests.** The frontend covers its pure modules with 82 Vitest cases (`npm test` in `chordflow/`), but `backend/` has no test runner and no test file.
- **No CI.** No `.github/` workflows; nothing runs the build, `tsc` or `npm run lint` on push.
- **No containerization.** No `Dockerfile` or `docker-compose.yml`, so local setup means installing Postgres by hand.
- **The backend forces SSL on the database connection**, which makes a default local Postgres unusable without editing the source.
- **Cloud progressions can't be edited or deleted.** The API only has `POST` and two `GET` routes — saving twice creates two rows.
- **The musical key isn't persisted to the backend.** The frontend always sends `key_id: null`, the `musical_key` table is never populated, and loading a cloud progression restores title, BPM, style and blocks but leaves the key at whatever it currently is.
- **No registration in the UI.** `api.register` exists in the client but no component calls it.
- **`tsc` runs with `strict: false`** on the backend, and error handling leans on `as any` casts in a few places (`auth.middleware.ts`, the cloud-load path in `App.tsx`).
- **Compiled `.js` files sit next to the `.ts` sources** in `backend/src/` from an earlier build setup. They're gitignored and unused — `tsc` now outputs to `dist/` — but they're stale and confusing on disk.

**Validation**

- **No formal usability study.** A pilot with 4 musicians provided qualitative feedback; a controlled study with pre/post measurement is listed as future work.

---

## Future Work

- Tests on the backend, then CI running build + lint + tests
- Full CRUD for cloud progressions, and registration from the UI
- Minor mode, modal matrices and more keys; time signatures other than 4/4 (which also means touching the audio engine, not just the theory)
- Second-order Markov model for richer context awareness
- Wiring up the contextual explanation module
- Export progressions to MIDI / MusicXML
- Formal usability study with pre/post measurement

---

## What I Learned Building This

- **Integrating a real-time audio engine with a reactive UI is non-trivial.** The Web Audio API runs on a high-priority thread separate from JavaScript's event loop. Keeping Tone.js's Transport in sync with React's render cycle required separating audio state from UI state — and is why the scheduling state ended up outside React entirely.
- **Typing a musical domain pays off.** Modeling `RomanDegree`, `ChordBlock`, `TonalKey` and `Style` as explicit TypeScript types meant the compiler caught domain logic errors, not just type errors, before runtime.
- **Scope decisions are architectural decisions.** Choosing first-order Markov over second-order, or manual weights over a trained corpus, weren't limitations I stumbled into. They were deliberate calls that kept the system explainable.

---

## Academic Context

Final thesis project — *Licenciatura en Informática*, Universidad Siglo 21, Argentina (2025).

The thesis document covers the full system design, risk analysis, security architecture, cost estimation and pilot validation.

---

## Author

**Gabriel Almeida**
[Portfolio](https://portfoliogabr.netlify.app/en) · [GitHub](https://github.com/AnibalGabrielAlmeida) · [LinkedIn](https://linkedin.com/in/gabriel-almeida-5916a1284)

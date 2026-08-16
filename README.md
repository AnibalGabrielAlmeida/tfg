# Plataforma Web Interactiva para la Creación y Exploración de Progresiones Armónicas

A web app for building chord progressions in the browser: you arrange roman-numeral chord blocks on a timeline, hear them played back through a sampled Rhodes, and get suggestions for the next chord with a short explanation of why. Built as a final degree project (TFG); the UI is in Spanish.

**Live demo:** https://tfg-plataforma-interactiva-armonica.netlify.app/

## What it does

- **Build and edit a progression.** Chord blocks are added from a chord bank grouped by theory system (diatonic, secondary dominants, modal interchange), reordered by drag and drop, resized in beats, duplicated or deleted. Edits that would push a bar past 4 beats are rejected instead of applied (`chordflow/src/modules/progression/useProgressionManager.ts`).
- **Play it back.** Tone.js schedules the progression as a loop over `Tone.Transport`, using a sampled Rhodes (`chordflow/public/samples/rhodes/`), drop-2 voicings with voice leading between consecutive chords, and light timing/velocity humanization. The currently sounding block is highlighted. Spacebar toggles play/stop.
- **Get explained suggestions.** A side panel proposes the next degrees from the last chord in the progression, each with a one-line explanation in functional terms (tonic / subdominant / dominant, cadences, secondary dominants, modal interchange). Clicking one appends it to the progression.
- **Save your work.** Progressions are saved to `localStorage`, and can be exported to / imported from a JSON file. With an account, they can also be saved to and loaded from the backend (Postgres).

Key and style are picked from fixed sets in this version: keys `C`, `G`, `D`, `F` and styles `Pop` / `Neo` (`chordflow/src/App.tsx`).

## Stack

**Backend** (`backend/`) — TypeScript 5.9, compiled to CommonJS, `dist/` output

- Express 5.2
- PostgreSQL via `pg` 8.16
- `jsonwebtoken` 9.0 for auth, `bcryptjs` 3.0 for password hashing
- `helmet` 8.1, `cors` 2.8, `express-rate-limit` 8.6
- `dotenv` 17.2, `ts-node-dev` 2.0 for development

**Frontend** (`chordflow/`) — TypeScript 5.9, Vite 7.1

- React 19.1
- Tone.js 15.1 for audio scheduling and synthesis
- `@dnd-kit/core` 6.3 + `@dnd-kit/sortable` 10.0 for drag and drop
- ESLint 9.36 with `typescript-eslint` 8.45

No CSS framework — styles are hand-written in `chordflow/src/styles/global.css`.

**Database** — PostgreSQL. Schema in `db/schema.sql`: `users`, `musical_key`, and `progressions` (the chord blocks are stored in a `JSONB` column).

TODO: neither `package.json` declares an `engines` field, so the minimum Node version required is not pinned anywhere in the repo.

## Running it locally

You need Node with npm, and a PostgreSQL instance.

**1. Clone and install**

```bash
git clone <repo-url>
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

Copy `backend/.env.example` to `backend/.env` and fill it in.

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

Copy `chordflow/.env.example` to `chordflow/.env`.

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

**Production builds:** `npm run build` in `backend/` (`tsc` → `dist/`, then `npm start` runs `node dist/index.js`) and in `chordflow/` (`tsc -b && vite build`).

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

## Design notes

**The recommendation engine combines a Markov model with theory rules, rather than using either alone.**

`getScoredSuggestions` scores each candidate degree as `markovWeight + berkleeBoost − voiceLeadingCost` (`chordflow/src/modules/recommendation/scoring.ts`). The Markov weight comes from hand-authored transition matrices per style (`markov.ts`); the boost comes from a rule table for named harmonic devices — `V → I` gets +3, `ii → V` +2, `♭VII → I` +1.5, and so on (`theory/berklee.ts`); the cost penalizes large leaps between the two chords' MIDI triads and discounts by 0.5 when they share a pitch class (`recommendation/heuristics.ts`).

Why: the Markov matrices capture what a style actually tends to do, including moves theory doesn't privilege, but they're a flat table with no notion of *why* a move works — and the app's main value is explaining itself. The rule table supplies that: each rule carries a description string that the UI shows next to the suggestion. Neither part alone gives both "this is idiomatic for pop" and "because ♭VII resolves to I like a backdoor cadence."

Trade-off: the score is a sum of three quantities on three unrelated scales, with weights that were tuned by ear rather than fitted to anything. Nothing guarantees the rule boost and the Markov weight are commensurable — a +3 cadence boost can outrank a genuinely more common transition. The matrices are also hand-written rather than learned from a corpus, so "Pop" means what I encoded, not what a dataset says. Making this principled would mean estimating the transitions from real data and learning the weights, which was out of scope here.

**The frontend is organized by domain, not by technical layer.**

`chordflow/src/modules/` splits into `theory/`, `recommendation/`, `audio/`, `progression/`, `storage/`, and `presets/` — each holding its own logic, types, and hooks together (`useProgressionManager` sits in `progression/`, `usePlayback` in `audio/`, `useSuggestions` in `recommendation/`). Only presentational components live under `components/`, and `App.tsx` does nothing but compose them and hold session state.

Why: the hard parts of this project are musical, not architectural. A `hooks/` + `utils/` + `services/` split would have scattered the harmony code across three folders and made it impossible to see the boundary between "how chords work" and "how they're drawn." The domain split also made the theory engine swappable — `roman2.ts` replaced the original `roman.ts` for the scoring path, and only the importing modules had to change.

Trade-off: the boundaries aren't perfectly clean. `roman.ts` and `roman2.ts` both still exist, with `player.ts` using the first and `scoring.ts` the second — a migration that was left half-finished and now needs a reader to know which is which. Domain folders also make a module's "public API" implicit; nothing stops a component from reaching into an internal helper, since there are no barrel files enforcing what's exported.

**Playback is scheduled in ticks, and changes wait for the next downbeat.**

`scheduleProgression` computes positions in PPQ ticks (`beats * Tone.Transport.PPQ`) rather than in seconds or bar:beat strings, and sets the transport loop from those tick values (`chordflow/src/modules/audio/player.ts`). When the progression, BPM, or key changes while playing, `rescheduleAtNextDownbeat` doesn't reschedule immediately: it computes `ceil(nowTicks / ticksPerMeasure) * ticksPerMeasure` and defers the swap to that point with `Transport.scheduleOnce`.

Why: ticks are tempo-independent, so a BPM change doesn't invalidate the positions already computed, and there's no float drift accumulating across loop repetitions. Deferring to the downbeat solves a UX problem — every edit runs through a `useEffect` on `[progression, bpm, key]`, so without it, dragging a block would restart the loop mid-bar and produce an audible stutter on every keystroke.

Trade-off: edits take effect up to a full bar later, which feels unresponsive at slow tempos. The downbeat calculation also hardcodes `ppq * 4` as the bar length, so it silently assumes 4/4 — the schema has a `time_signature` column and the frontend always sends `"4/4"`, but the audio engine couldn't honor anything else if it did. And because scheduling state (`scheduledIds`, `lastVoicing`, `pendingReschedule`) lives in module-level variables rather than in React, there can only ever be one transport, and the audio engine's state is invisible to React DevTools.

## Known gaps

- **No tests.** Neither package has a test runner or a single test file. The pure modules (`markov.ts`, `heuristics.ts`, `roman2.ts`, `metrics.ts`) are the obvious place to start — they're all deterministic functions with no I/O.
- **No CI.** No `.github/` workflows; nothing runs the build, `tsc`, or `npm run lint` on push.
- **No containerization.** No `Dockerfile` or `docker-compose.yml`, so local setup means installing Postgres by hand.
- **The backend forces SSL on the database connection**, which makes a default local Postgres unusable without editing the source.
- **Cloud progressions can't be edited or deleted.** The API only has `POST` and two `GET` routes — saving twice creates two rows.
- **The musical key isn't persisted to the backend.** The frontend always sends `key_id: null`, the `musical_key` table is never populated, and loading a cloud progression restores title, BPM, style, and blocks but leaves the key at whatever it currently is.
- **No registration in the UI.** `api.register` exists in the client but no component calls it.
- **`tsc` runs with `strict: false`** on the backend, and error handling leans on `as any` casts in a few places (`auth.middleware.ts`, the cloud-load path in `App.tsx`).
- **Compiled `.js` files sit next to the `.ts` sources** in `backend/src/` from an earlier build setup. They're gitignored and unused — `tsc` now outputs to `dist/` — but they're stale and confusing on disk.
- **Musical scope is deliberately narrow:** four keys, major mode only, 4/4 only, triads only. `theorySets.ts` has tritone substitutions and harmonic-minor borrowings written out but commented off, because the theory engine doesn't voice them correctly yet.
- **The UI is Spanish-only**, with no i18n layer.

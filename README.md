# Harmonic Progressions Platform

> An interactive web platform for building, hearing, and understanding harmonic progressions — bridging music theory, ear training, and hands-on experimentation in a single browser-based environment.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql)
![Tone.js](https://img.shields.io/badge/Audio-Tone.js-FF6B35?style=flat-square)

---

## The Problem

Learning harmony is traditionally fragmented. You read a chord progression in a textbook, then pick up your instrument to try it, then search for recordings to hear how it sounds. Theory, practice, and listening happen separately — and that gap slows understanding.

This platform integrates all three into a single interactive experience: **build visually, hear immediately, understand functionally**.

---

## Features

### 🎹 Visual Progression Editor
Drag and drop chords onto a timeline to build progressions. Chords are displayed with both their name and their Roman numeral degree within the active key, making it easy to think in terms of harmonic function rather than just chord names.

### 🔊 Real-Time Audio Playback
Progressions play back directly in the browser using [Tone.js](https://tonejs.github.io/) and the Web Audio API — no plugins, no installs. The timbre is a warm Rhodes electric piano, chosen for its clarity when voicing jazz and pop harmonies. The active chord is highlighted in the timeline during playback.

### 🎓 Tonal Function Visualization
Every chord in the progression displays its tonal function: **Tonic (T)**, **Subdominant (S)**, or **Dominant (D)**. This connects each harmonic decision to the theory behind it.

### 🤖 Harmonic Recommendation Engine
The engine suggests what chord might come next, based on three combined signals:

| Layer | What it does |
|---|---|
| **Markov** | Probabilistic transition weights between harmonic degrees (two matrices: Pop and Neo-Soul) |
| **Berklee boost** | Rules from functional harmony that add score to theoretically strong moves (ii→V, V→I, backdoor resolutions, modal interchange) |
| **Voice leading penalty** | Penalizes large average semitone jumps between chord tones, favoring smooth voice movement |

**Score formula:** `score = markovWeight + berkleeBoost − voiceLeadingCost`

Each suggestion includes a plain-language explanation of *why* that chord makes sense — turning every recommendation into a micro-lesson.

**Two modes:**
- **Pop** — deterministic selection (always suggests the highest-weight candidate)
- **Neo** — weighted random selection (introduces stylistic variety and surprise)

### 🔐 User Authentication & Persistence
Users can register, log in, and save their progressions. Passwords are hashed with bcrypt; sessions are managed with JWT. The frontend and backend are deployed independently on separate domains, with CORS configured explicitly.

---

## Tech Stack

### Frontend
- **React 18 + TypeScript** — component-based UI with static typing across all musical domain types (`ChordType`, `HarmonicFunction`, `MusicalKey`)
- **Tone.js + Web Audio API** — precise musical timing via AudioContext lookahead scheduling; Transport handles BPM, loop, and playback state
- **Drag & drop timeline** — custom implementation for building and reordering progressions
- **State management** — `useState` + `useContext` (no external state library; complexity didn't warrant it)

### Backend
- **Node.js + Express** — layered architecture: routes → controllers → services → middleware
- **JWT authentication** — stateless sessions; auth and authorization as separate middleware
- **bcrypt** — adaptive password hashing, resistant to brute-force attacks

### Database
- **PostgreSQL (hosted on Neon)** — relational model with referential integrity; `HarmonicFunction` as a native enum type (T/S/D enforced at DB level, not just application level)

### Deployment
- **Frontend:** Netlify (CI/CD from GitHub)
- **Backend:** Render (persistent web service)
- **Database:** Neon (serverless PostgreSQL)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│  ┌──────────────┐    ┌──────────────────────┐   │
│  │  React UI    │    │  Tone.js / Web Audio  │   │
│  │  (Timeline,  │    │  (AudioContext,        │   │
│  │   Chord Bank,│    │   Transport, Rhodes    │   │
│  │   Rec Panel) │    │   synth)               │   │
│  └──────┬───────┘    └──────────────────────┘   │
│         │ REST API (JWT in Authorization header)  │
└─────────┼───────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────┐
│              Node.js + Express                   │
│                                                  │
│  Routes → Controllers → Services                 │
│  ├── AuthMiddleware (JWT verify)                 │
│  ├── AuthorizationMiddleware (role check)        │
│  └── ErrorMiddleware (normalized JSON errors)   │
└─────────┬───────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────┐
│           PostgreSQL (Neon)                      │
│                                                  │
│  User → Progression → Progression_Chord          │
│                          └── Chord_Type          │
│  (HarmonicFunction: T/S/D as DB-level enum)      │
└─────────────────────────────────────────────────┘
```

---

## The Recommendation Engine — Deeper Look

The engine lives entirely in the frontend. It operates on harmonic degrees (I, ii, IV, V, vi, bVII, V/ii…) rather than raw chord names, so it's key-agnostic.

**Three additional mechanisms beyond the core formula:**

- **Tonal function fallback** — if a degree has no row in the Markov matrix, a generic row is constructed based on tonal function (T/S/D), ensuring no degree is ever stranded without candidates.
- **Loop penalty** — the engine tracks the last two suggested degrees. Trivial bounces (I→V→I→V…) are penalized with a 0.4 multiplier to encourage variety.
- **Secondary dominant resolution guarantee** — when the current chord is a secondary dominant (V/ii, V/vi, etc.), its expected resolution always appears first in the suggestion list, regardless of Markov weights.

**Design note on the weights:** The Markov matrices were defined manually from functional theory and stylistic knowledge — not trained on a corpus. This makes them interpretable, controllable, and honest about what they are: *informed heuristics*, not learned statistics.

---

## Limitations & Scope

This is a validated prototype. Known limitations are intentional, not oversights:

- **Major mode only** — no minor, Dorian, Phrygian or other modal matrices in this version
- **First-order Markov** — the engine considers only the current chord, not the full progression history
- **Tritone substitution and harmonic minor chords** are defined in the architecture but disabled — the `roman2` MIDI conversion module doesn't fully support them yet
- **Contextual explanation module** (`getContextualExplanation`) is implemented as an extension point that currently returns an empty string — designed for future versions
- **Formal usability study** was not conducted — a pilot with 4 musicians provided qualitative feedback; a controlled study is listed as future work

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/AnibalGabrielAlmeida/tfg.git

# Install frontend dependencies
cd client
npm install
npm run dev

# Install backend dependencies
cd ../server
npm install

# Set up environment variables
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, PORT

npm run dev
```

**Requirements:** Node.js 18+, PostgreSQL (or a Neon connection string)

---

## What I Learned Building This

A few things worth naming explicitly:

- **Integrating a real-time audio engine with a reactive UI is non-trivial.** The Web Audio API runs on a high-priority thread separate from JavaScript's event loop. Getting Tone.js's Transport to stay in sync with React's render cycle required careful separation of audio state from UI state.
- **Typing a musical domain pays off.** Having `HarmonicFunction`, `ChordType`, and `MusicalKey` as explicit TypeScript types meant the compiler caught domain logic errors — not just type errors — before runtime.
- **Scope decisions are architectural decisions.** Choosing first-order Markov over second-order, or manual weights over a trained corpus, weren't limitations I stumbled into. They were deliberate calls that kept the system explainable.

---

## Future Work

- Export progressions to MIDI / MusicXML
- Minor mode and modal matrices
- Second-order Markov model for richer context awareness
- Full contextual explanation module
- Formal usability study with pre/post measurement

---

## Academic Context

Final thesis project — *Licenciatura en Informática*, Universidad Siglo 21, Argentina (2025).

The thesis document covers the full system design, risk analysis, security architecture, cost estimation, and pilot validation.

---

## Author

**Gabriel Almeida**
[Portfolio](https://portfoliogabr.netlify.app/en) · [GitHub](https://github.com/AnibalGabrielAlmeida) · [LinkedIn](https://linkedin.com/in/gabriel-almeida-5916a1284)

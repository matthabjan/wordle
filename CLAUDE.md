# CLAUDE.md

German Wordle (Vite + React 18 + TypeScript + Tailwind 4). Client-only PWA; game state lives in `localStorage`. Forked from [woertchen](https://github.com/diondiondion/woertchen).

## Commands

```bash
npm install # install deps
npm run dev # / npm start → http://localhost:5173
npm test # Vitest one-shot
npm run test:watch # Vitest watch mode
npm run build # production build → dist/
npm run preview # preview production build
npm run lint # prettier --check src
npm run fix # prettier --write src
```

Docker (see `DOCKER.md` / `Makefile`):

```bash
make up-prod    # local prod via docker-compose.prod.yml → :8080
make up-traefik # Traefik overlay (no host ports; needs WORDLE_HOST + proxy network)
make health     # container health
```

Security notes for public deploy:

- App nginx sends CSP / nosniff / frame-deny (see `docker/etc/nginx/conf.d/default.conf`).
- HSTS is Traefik’s job after TLS termination.
- Fonts are self-hosted under `public/fonts/` (no Google Fonts).
- Prefer `docker-compose.traefik.yml` so port 8080 is never published.

CI (Node 22): `.github/workflows/lint.yml`, `.github/workflows/test.yml` on `main` and PRs.

## Layout

```
src/
  App.tsx                 # shell, modals, composition
  hooks/                  # useGameState, useTheme, useWordOfDay
  components/
    alerts/ grid/ keyboard/ modals/ stats/
  constants/
    settings.ts           # MAX_WORD_LENGTH, MAX_CHALLENGES, timings
    strings.ts            # German UI copy (and VITE_GAME_NAME)
    wordlist.ts           # daily solutions (~882 words)
    validGuesses.ts       # accepted guesses (~2411 words)
  context/AlertContext.tsx
  lib/
    words.ts              # solution-of-day, validation, hard mode
    statuses.ts           # letter status (correct/present/absent)
    stats.ts localStorage.ts share.ts haptics.ts
docker/                   # nginx configs for prod image
```

## Conventions

- **Language**: UI strings are German (`src/constants/strings.ts`). Keep new copy German unless changing locale intentionally.
- **Characters**: A–Z only. No umlauts/ß in word lists or guesses (universal keyboard). Words are lowercase in lists; compare case-insensitively.
- **Formatting**: Prettier — `singleQuote: true`, `semi: false`. Husky + lint-staged run Prettier on staged `src/**/*.{ts,tsx,js,jsx,css,md}`.
- **Components**: Functional React components; Tailwind for styling; Headless UI for modals; Heroicons for icons.
- **Imports**: Prefer relative imports as elsewhere in `src/`.
- **Types**: TypeScript `strict: true`. Do not weaken `tsconfig` without cause.
- **Env**: Game title from `import.meta.env.VITE_GAME_NAME`.

## Game rules (do not break)

- Word length: `MAX_WORD_LENGTH` (5). Max guesses: `MAX_CHALLENGES` (6).
- Daily solution from `getWordOfDay()` epoch in `src/lib/words.ts` — changing the epoch reshuffles the calendar.
- Valid guess = in `WORDS` or `VALID_GUESSES`.
- Hard mode enforced via `findFirstUnusedReveal`.
- Current row supports cursor-based editing (tap a cell to overwrite).
- Persisted game/stats must stay compatible with existing `localStorage` keys unless migrating intentionally.

## Changing word length or lists

1. Update `MAX_WORD_LENGTH` in `src/constants/settings.ts`.
2. Replace `wordlist.ts` and `validGuesses.ts` with same-length A–Z words (no duplicates; every solution must also be a valid guess or listed in `WORDS`).
3. Smoke-test grid, keyboard, share text, and hard mode.

## Hard constraints

- Do **not** eject or reintroduce Create React App.
- Do **not** commit secrets (`.env`, `.env.docker`, credentials). Use `.env.example` / `.env.docker.example` as templates.
- Prefer minimal diffs: match existing patterns; no drive-by refactors or unsolicited docs.
- Before finishing: `npm run lint` and `npm test` when touching game logic or UI.
- Production Docker details live in `DOCKER.md` — read it before changing nginx/compose. Build output is `dist/`.

## Gotchas

- `GAME_TITLE` comes from `import.meta.env.VITE_GAME_NAME` — ensure env is set for builds that need a title.
- Reveal animations use `REVEAL_TIME_MS`; lose/win delays depend on it — don't hardcode timings elsewhere.
- PWA service worker is registered via `vite-plugin-pwa` (`virtual:pwa-register`).

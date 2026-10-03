# CLAUDE.md

German Wordle (Vite + React 18 + TypeScript + Tailwind 4). Client-only PWA; game state lives in `localStorage`. An optional self-hosted `server/` service adds a passphrase-gated daily leaderboard — the core game works identically with or without it. Forked from [woertchen](https://github.com/diondiondion/woertchen).

## Commands

Docker (see `DOCKER.md` / `Makefile`):

```bash
make up-prod # local prod via docker-compose.prod.yml → :8080
make health  # container health
```

For public Traefik/Portainer deploy: run the Docker Hub images (`matthabjan/wordle`, `matthabjan/wordle-leaderboard-api`, same version) in your own stack (no host port 8080). See `DOCKER.md`.

Leaderboard backend, local dev: `cd server && LEADERBOARD_PASSPHRASE=devsecret npm install && npm start` → `:3001`; `vite.config.ts` proxies `/api` there for `npm run dev`.

Security notes for public deploy:

- App nginx sends CSP / nosniff / frame-deny (see `docker/etc/nginx/conf.d/default.conf`).
- HSTS is Traefik’s job after TLS termination.
- Fonts are self-hosted under `public/fonts/` (no Google Fonts).
- Do not publish port 8080 when behind Traefik.

CI (Node 22): `.github/workflows/lint.yml`, `.github/workflows/test.yml` (app + `server/` tests) on `main`, `development` and PRs. Dependabot PRs target `development` (majors ignored). `.github/workflows/docker.yml` publishes `matthabjan/wordle` + `matthabjan/wordle-leaderboard-api` to Docker Hub (`development` → `:dev`, `main` → `:edge`, tag `vX.Y.Z` → semver + `:latest` + GitHub Release).

Versioning: SemVer from root `package.json`; `server/package.json` must carry the same version (the `release:*` scripts sync it, CI checks it); release via `npm run release:{patch,minor,major}` on `main`, then `git push --follow-tags`. Tag must equal `v` + `package.json` version.

## Conventions

- **Language**: UI strings are German (`src/constants/strings.ts`). Keep new copy German unless changing locale intentionally.
- **Characters**: A–Z only. No umlauts/ß in word lists or guesses (universal keyboard). Words are lowercase in lists; compare case-insensitively.
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

## Leaderboard (optional, do not break)

- Lives in `src/lib/leaderboard.ts` + `src/components/stats/Leaderboard.tsx` (folded into `StatsModal`), backed by `server/` (Fastify + SQLite) and proxied same-origin at `/api/*` (see `docker/etc/nginx/conf.d/default.conf`).
- Gate is a single shared passphrase (`LEADERBOARD_PASSPHRASE` env var on the server) — no per-user accounts. Anyone who knows it can join under any name; everyone else just plays without it. The client sends it as `Authorization: Bearer <encodeURIComponent(passphrase)>` (never in the URL); the server still accepts the legacy query/body form unless `ALLOW_LEGACY_AUTH=false`, and answers `429` after too many failed attempts per client (`AUTH_MAX_FAILURES`, `AUTH_WINDOW_SECONDS`, `TRUST_PROXY` — see `DOCKER.md`).
- Identity (`leaderboardName` / `leaderboardPassphrase`) is cached in `localStorage`; distinct keys from the core game state, additive only.
- Reveal is gated server-side: a viewer only receives other players' guess grids once they've submitted their own result for that date (see `GET /api/leaderboard` in `server/index.js`).
- Overall rankings come from `GET /api/leaderboard/overall` and are derived server-side from daily rows: wins score 6 points for one guess down to 1 point for six guesses; losses score 0.
- Must fail silently and never block the core game: submission (`submitLeaderboardResult`) swallows errors, and nginx resolves the `leaderboard-api` upstream at request time (not at startup) so the app still serves the game if that container is absent or down.
- Every `(date, name)` submission is upserted and never deleted, so the overall leaderboard remains derivable without a separate aggregate table.

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
- `server/` has its own `package.json`/`node_modules`, separate from the root — `npm install` at repo root does not install it; `cd server && npm install`.

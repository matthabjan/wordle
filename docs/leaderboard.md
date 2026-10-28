# Leaderboard (optional)

← [README](../README.md) · [Development](development.md) · [Word lists](word-lists.md) · [Deployment](../DOCKER.md)

The Stats modal can show **daily** and **all-time** rankings for everyone who knows a shared passphrase. It's backed by a small self-hosted service in [`server/`](../server) (Fastify + SQLite). The game works the same whether or not the service is deployed.

<p align="center">
  <img src="screenshots/stats-leaderboard.png" alt="Daily leaderboard in the Stats modal" width="300">
</p>

## How it works

- **Joining:** a player opens Stats and enters a display name and the shared passphrase. Both are cached in `localStorage` on that device. There are no accounts: anyone who knows the passphrase can join under any name.
- **Submitting:** the result is posted automatically when a game ends. Each person has one row per day, keyed by `(date, name)` and updated if they submit again.
- **Spoiler protection:** before you've finished the day's word, you only see names and guess counts. The full colour grids unlock once your own result for that day is stored.
- **Overall score:** a win scores 6 points for one guess, down to 1 point for six guesses. A loss scores 0. Ties are broken by number of wins, then lower average guesses, then name.
- **Fails silently:** if the API is missing, stopped or unreachable, submitting does nothing and the section shows *„Bestenliste derzeit nicht verfügbar.“*. The game is never blocked.
- **Data retention:** rows are kept forever, so the all-time ranking can always be recomputed from the daily results.

## Running it

| Setup | How |
|---|---|
| Local dev | `cd server && npm install && LEADERBOARD_PASSPHRASE=devsecret npm start` (port 3001). `npm run dev` proxies `/api` to it. |
| Docker Compose | Set `LEADERBOARD_PASSPHRASE` in `.env.docker`, then `make up-prod`. The `leaderboard-api` service stores its data in the `leaderboard-data` volume. |
| Traefik / Portainer | Run `matthabjan/wordle-leaderboard-api` next to `matthabjan/wordle`, using the same version tag. See [DOCKER.md → Leaderboard API](../DOCKER.md#leaderboard-api-optional). |

The app's nginx proxies `/api/` to the host name `leaderboard-api` and resolves it per request. This lets the app start and serve the game even when the API container doesn't exist.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `LEADERBOARD_PASSPHRASE` | **required** | The shared secret. The server refuses to start without it. |
| `PORT` | `3001` | Listen port |
| `DB_PATH` | `./leaderboard.db` (`/data/leaderboard.db` in Docker) | SQLite file |
| `AUTH_MAX_FAILURES` | `10` | Failed passphrase attempts per client before the API answers `429`. `0` turns the limit off. |
| `AUTH_WINDOW_SECONDS` | `900` | Length of the window for failed attempts |
| `TRUST_PROXY` | unset | Proxies whose `X-Forwarded-For` header is trusted (IPs, CIDRs or keywords such as `uniquelocal`). Set this behind nginx/Traefik so the limit applies per client instead of per proxy. |
| `ALLOW_LEGACY_AUTH` | `true` | Also accept the passphrase in the query string or body, as old clients send it. Set to `false` once all devices are updated. |

## Security model

- The passphrase is a shared secret, not an identity. It keeps strangers out, but anyone who has it can post under any name.
- Clients send it as `Authorization: Bearer <encodeURIComponent(passphrase)>`, which keeps it out of URLs, history and access logs. The server compares it in constant time.
- Repeated failures from one client are rate-limited (`429` with `Retry-After`). The counters are kept in memory and reset on restart.
- The app's nginx sends CSP, `nosniff` and frame-deny headers. HSTS is left to the TLS-terminating proxy.

## API reference

Every endpoint except `/api/health` requires the passphrase. Error responses are JSON: `{ "error": "<code>" }`.

| Status | `error` | Meaning |
|---|---|---|
| 400 | `invalid_payload` | A parameter is missing or invalid |
| 401 | `invalid_passphrase` | Wrong or missing passphrase |
| 429 | `too_many_attempts` | Too many failed attempts; see the `Retry-After` header |

### `GET /api/health`

Returns `{ "ok": true }`. Used by the container health check.

### `POST /api/results`

Creates or replaces the caller's result for a day.

```json
{ "name": "Anna", "date": "2026-02-20", "guesses": ["KRAUT", "STEIN", "SPION"], "won": true }
```

`name` is 1–40 characters, `date` is `YYYY-MM-DD` (the player's local date) and `guesses` holds 1–6 strings. Returns `204`.

### `GET /api/leaderboard?name=<viewer>&date=<YYYY-MM-DD>`

Returns the day's entries: winners first, then by number of guesses. `guesses` is included only if `name` has already submitted for that date.

```json
[
  { "name": "Anna", "won": true, "guessCount": 3, "guesses": ["KRAUT", "STEIN", "SPION"] },
  { "name": "Dana", "won": false, "guessCount": 6 }
]
```

### `GET /api/leaderboard/overall?name=<viewer>`

Returns the all-time ranking. Each row is computed from all of that player's daily results.

```json
[
  { "name": "Anna", "gamesPlayed": 42, "wins": 40, "points": 151, "winRate": 95.2, "averageGuesses": 3.23 }
]
```

### Example

```bash
curl -s -H "Authorization: Bearer devsecret" \
  "http://localhost:3001/api/leaderboard/overall?name=Anna"
```

## Data and backups

The database has a single table, `results(date, name, guesses JSON, won, submitted_at)`, with primary key `(date, name)`. To back up the Docker volume:

```bash
docker run --rm -v leaderboard-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/leaderboard-data-backup.tar.gz -C /data .
```

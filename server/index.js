import { timingSafeEqual } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import Fastify from 'fastify'
import Database from 'better-sqlite3'

const PORT = Number(process.env.PORT) || 3001
// Docker always sets DB_PATH explicitly (Dockerfile + compose); this fallback
// only applies to bare local dev, where /data wouldn't be writable anyway.
const DB_PATH = process.env.DB_PATH || './leaderboard.db'
const PASSPHRASE = process.env.LEADERBOARD_PASSPHRASE

const envInt = (name, fallback) => {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const value = Number(raw)
  return Number.isInteger(value) && value >= 0 ? value : fallback
}

// Reverse proxies whose X-Forwarded-For is believed, so the failed-attempt limiter
// keys on the real client instead of the proxy's address. Comma-separated IPs,
// CIDR ranges or keywords (e.g. `uniquelocal` for Docker-internal proxies).
// Unset = use the socket peer. Hop counts are not supported.
const TRUST_PROXY = process.env.TRUST_PROXY?.trim() || false
// Failed passphrase attempts per client within the window before answering 429.
// 0 disables the limiter.
const AUTH_MAX_FAILURES = envInt('AUTH_MAX_FAILURES', 10)
const AUTH_WINDOW_MS = envInt('AUTH_WINDOW_SECONDS', 900) * 1000
// Older cached clients still send the passphrase in the query string / JSON body.
// Set ALLOW_LEGACY_AUTH=false once every client sends the Authorization header.
const ALLOW_LEGACY_AUTH = process.env.ALLOW_LEGACY_AUTH !== 'false'
const MAX_TRACKED_CLIENTS = 10_000

const redactUrl = (url) =>
  String(url).replace(/([?&]passphrase=)[^&]*/gi, '$1[redacted]')

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const isValidName = (name) =>
  typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 40

const isValidGuesses = (guesses) =>
  Array.isArray(guesses) &&
  guesses.length > 0 &&
  guesses.length <= 6 &&
  guesses.every((g) => typeof g === 'string' && g.length > 0 && g.length <= 10)

export const buildApp = ({
  dbPath = DB_PATH,
  passphrase = PASSPHRASE,
  logger = true,
  trustProxy = TRUST_PROXY,
  maxFailures = AUTH_MAX_FAILURES,
  windowMs = AUTH_WINDOW_MS,
  allowLegacyAuth = ALLOW_LEGACY_AUTH,
} = {}) => {
  if (!passphrase) {
    throw new Error('LEADERBOARD_PASSPHRASE env var is required')
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS results (
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      guesses TEXT NOT NULL,
      won INTEGER NOT NULL,
      submitted_at TEXT NOT NULL,
      PRIMARY KEY (date, name)
    );
    CREATE INDEX IF NOT EXISTS idx_results_name_date ON results (name, date);
  `)

  const upsertResult = db.prepare(`
    INSERT INTO results (date, name, guesses, won, submitted_at)
    VALUES (@date, @name, @guesses, @won, @submittedAt)
    ON CONFLICT(date, name) DO UPDATE SET
      guesses = excluded.guesses,
      won = excluded.won,
      submitted_at = excluded.submitted_at
  `)

  const selectByDate = db.prepare(`
    SELECT name, guesses, won FROM results WHERE date = ?
  `)

  const selectOverall = db.prepare(`
    SELECT
      name,
      COUNT(*) AS gamesPlayed,
      SUM(won) AS wins,
      SUM(
        CASE WHEN won = 1 THEN 7 - json_array_length(guesses) ELSE 0 END
      ) AS points,
      ROUND(100.0 * SUM(won) / COUNT(*), 1) AS winRate,
      ROUND(
        AVG(CASE WHEN won = 1 THEN json_array_length(guesses) END),
        2
      ) AS averageGuesses
    FROM results
    GROUP BY name
    ORDER BY
      points DESC,
      wins DESC,
      CASE WHEN averageGuesses IS NULL THEN 1 ELSE 0 END,
      averageGuesses ASC,
      name COLLATE NOCASE ASC
  `)

  // Constant-time compare so a public passphrase check doesn't leak
  // length/prefix via timing.
  const isValidPassphrase = (candidate) => {
    if (typeof candidate !== 'string') return false
    const a = Buffer.from(candidate)
    const b = Buffer.from(passphrase)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  }

  // Failed attempts per client, in memory only (resets on restart).
  const failures = new Map()

  const blockedForMs = (ip, now) => {
    const entry = failures.get(ip)
    if (!entry) return 0
    if (entry.resetAt <= now) {
      failures.delete(ip)
      return 0
    }
    return entry.count >= maxFailures ? entry.resetAt - now : 0
  }

  const recordFailure = (ip, now) => {
    const entry = failures.get(ip)
    if (entry && entry.resetAt > now) {
      entry.count += 1
      return
    }
    if (failures.size >= MAX_TRACKED_CLIENTS) {
      for (const [key, value] of failures) {
        if (value.resetAt <= now) failures.delete(key)
      }
      while (failures.size >= MAX_TRACKED_CLIENTS) {
        failures.delete(failures.keys().next().value)
      }
    }
    failures.set(ip, { count: 1, resetAt: now + windowMs })
  }

  // Preferred: `Authorization: Bearer <encodeURIComponent(passphrase)>` (kept out of
  // URLs and access logs; encoded because header values must be Latin-1).
  const readPassphrase = (request) => {
    const header = request.headers.authorization
    if (typeof header === 'string') {
      const match = /^Bearer (.+)$/i.exec(header)
      if (!match) return undefined
      try {
        return decodeURIComponent(match[1])
      } catch {
        return undefined
      }
    }
    if (!allowLegacyAuth) return undefined
    return request.method === 'POST'
      ? request.body?.passphrase
      : request.query?.passphrase
  }

  // Sends the error response itself and returns false when the caller isn't allowed.
  const authorize = (request, reply) => {
    const now = Date.now()
    if (maxFailures > 0) {
      const retryAfterMs = blockedForMs(request.ip, now)
      if (retryAfterMs > 0) {
        reply
          .header('Retry-After', Math.ceil(retryAfterMs / 1000))
          .code(429)
          .send({ error: 'too_many_attempts' })
        return false
      }
    }
    if (isValidPassphrase(readPassphrase(request))) return true
    if (maxFailures > 0) recordFailure(request.ip, now)
    reply.code(401).send({ error: 'invalid_passphrase' })
    return false
  }

  const app = Fastify({
    trustProxy,
    // Mirrors Fastify's default request log, minus any passphrase in the query.
    logger: logger
      ? {
          serializers: {
            req: (req) => ({
              method: req.method,
              url: redactUrl(req.url),
              host: req.host,
              remoteAddress: req.ip,
              remotePort: req.socket?.remotePort,
            }),
          },
        }
      : false,
  })

  app.addHook('onClose', async () => {
    db.close()
  })

  app.get('/api/health', async () => ({ ok: true }))

  app.post('/api/results', async (request, reply) => {
    if (!authorize(request, reply)) return reply

    const { name, date, guesses, won } = request.body ?? {}

    if (
      !isValidName(name) ||
      !DATE_RE.test(date ?? '') ||
      !isValidGuesses(guesses) ||
      typeof won !== 'boolean'
    ) {
      return reply.code(400).send({ error: 'invalid_payload' })
    }

    upsertResult.run({
      date,
      name: name.trim(),
      guesses: JSON.stringify(guesses),
      won: won ? 1 : 0,
      submittedAt: new Date().toISOString(),
    })

    return reply.code(204).send()
  })

  app.get('/api/leaderboard', async (request, reply) => {
    if (!authorize(request, reply)) return reply

    const { name, date } = request.query ?? {}
    if (!isValidName(name) || !DATE_RE.test(date ?? '')) {
      return reply.code(400).send({ error: 'invalid_payload' })
    }

    const rows = selectByDate.all(date)
    const viewerFinished = rows.some((row) => row.name === name.trim())

    const entries = rows
      .map((row) => {
        const guesses = JSON.parse(row.guesses)
        const base = {
          name: row.name,
          won: Boolean(row.won),
          guessCount: guesses.length,
        }
        return viewerFinished ? { ...base, guesses } : base
      })
      .sort((a, b) => {
        if (a.won !== b.won) return a.won ? -1 : 1
        return a.guessCount - b.guessCount
      })

    return reply.send(entries)
  })

  app.get('/api/leaderboard/overall', async (request, reply) => {
    if (!authorize(request, reply)) return reply

    const { name } = request.query ?? {}
    if (!isValidName(name)) {
      return reply.code(400).send({ error: 'invalid_payload' })
    }

    return reply.send(selectOverall.all())
  })

  return app
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!PASSPHRASE) {
    console.error(
      'LEADERBOARD_PASSPHRASE env var is required — refusing to start.',
    )
    process.exit(1)
  }

  const app = buildApp()
  app.listen({ port: PORT, host: '0.0.0.0' }).catch((error) => {
    app.log.error(error)
    process.exit(1)
  })
}

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'
import { setLeaderboardIdentity } from '../../lib/leaderboard'
import { Leaderboard } from './Leaderboard'

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorage.clear()
    setLeaderboardIdentity({ name: 'Ada', passphrase: 'secret' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('switches from daily to overall results', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            name: 'Ada',
            points: 10,
            gamesPlayed: 3,
            wins: 2,
            winRate: 66.7,
            averageGuesses: 2,
          },
        ]),
      )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(
      <Leaderboard
        date="2026-07-21"
        solution="APFEL"
        isOpen={true}
        isGameWon={false}
        isGameLost={false}
      />,
    )

    expect(
      await screen.findByText('Noch niemand hat heute gespielt.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Gesamt' }))

    expect(await screen.findByText('10 Pkt.')).toBeInTheDocument()
    expect(
      screen.getByText('3 Spiele · 2 Siege (66,7 %) · Ø Versuche: 2'),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toContain('/api/leaderboard/overall')
  })
})

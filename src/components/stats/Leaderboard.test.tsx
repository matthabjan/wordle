import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import { createLeaderboard } from '../../lib/leaderboard'
import { createInMemoryTransport } from '../../lib/leaderboardInMemory'
import { getDateForSolutionIndex } from '../../lib/words'
import { Leaderboard } from './Leaderboard'

const PASSPHRASE = 'secret'
const TODAY = getDateForSolutionIndex(3)

const setup = (options?: Parameters<typeof createInMemoryTransport>[1]) => {
  const server = createInMemoryTransport(PASSPHRASE, options)
  return { server, leaderboard: createLeaderboard(server.transport) }
}

const renderBoard = (
  leaderboard: ReturnType<typeof setup>['leaderboard'],
  date = TODAY,
) =>
  render(
    <Leaderboard
      date={date}
      solution="APFEL"
      isOpen={true}
      isGameWon={false}
      isGameLost={false}
      leaderboard={leaderboard}
    />,
  )

const join = async (name: string, passphrase: string) => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Dein Name'), name)
  await user.type(screen.getByLabelText('Passwort'), passphrase)
  await user.click(screen.getByRole('button', { name: 'Verbinden' }))
}

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('switches from daily to overall results', async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join({ name: 'Ada', passphrase: PASSPHRASE }, TODAY)
    server.seed('Ada', { date: '2026-01-01', guesses: ['APFEL'], won: true })
    server.seed('Ada', {
      date: '2026-01-02',
      guesses: ['KNOPF', 'XENON', 'APFEL'],
      won: true,
    })
    server.seed('Ada', {
      date: '2026-01-03',
      guesses: ['KNOPF', 'XENON', 'SITTE', 'FOYER', 'WRACK', 'KAKAO'],
      won: false,
    })

    render(
      <Leaderboard
        date={TODAY}
        solution="APFEL"
        isOpen={true}
        isGameWon={false}
        isGameLost={false}
        leaderboard={leaderboard}
      />,
    )

    expect(
      await screen.findByText('Noch niemand hat heute gespielt.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: '2026' }))

    expect(await screen.findByText('10 Pkt.')).toBeInTheDocument()
    expect(
      screen.getByText('3 Spiele · 2 Siege (66,67 %) · Ø Versuche: 2'),
    ).toBeInTheDocument()
  })

  test('shows a finished game when joining afterwards', async () => {
    const { server, leaderboard } = setup()
    server.seed('Ben', { date: TODAY, guesses: ['KNOPF', 'APFEL'], won: true })
    leaderboard.reportResult({
      solutionIndex: 3,
      guesses: ['APFEL'],
      won: true,
      isHardMode: false,
    })

    render(
      <Leaderboard
        date={TODAY}
        solution="APFEL"
        isOpen={true}
        isGameWon={true}
        isGameLost={false}
        leaderboard={leaderboard}
      />,
    )
    await join('Ada', PASSPHRASE)

    expect(await screen.findByText('1/6')).toBeInTheDocument()
    expect(screen.getByText('(Du)')).toBeInTheDocument()
    // Having submitted, the player also sees Ben's grid (two rows).
    expect(screen.getByText('2/6')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /Spielverlauf/ })).toHaveLength(2)
  })

  test('rejects a wrong passphrase and stays on the join form', async () => {
    const { leaderboard } = setup()

    render(
      <Leaderboard
        date={TODAY}
        solution="APFEL"
        isOpen={true}
        isGameWon={false}
        isGameLost={false}
        leaderboard={leaderboard}
      />,
    )
    await join('Ada', 'wrong')

    expect(await screen.findByText('Passwort falsch')).toBeInTheDocument()
    expect(leaderboard.getIdentity()).toBeNull()
  })

  test('past years move to the archive, next to an all-time table', async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join({ name: 'Ada', passphrase: PASSPHRASE }, TODAY)
    server.seed('Ben', { date: '2025-12-30', guesses: ['APFEL'], won: true })
    server.seed('Ada', { date: '2026-01-02', guesses: ['APFEL'], won: true })
    server.seed('Ada', { date: '2026-01-03', guesses: ['APFEL'], won: true })

    renderBoard(leaderboard)
    await userEvent.click(await screen.findByRole('tab', { name: '2026' }))
    expect(await screen.findByText('12 Pkt.')).toBeInTheDocument()
    expect(screen.queryByText('Ben')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'Archiv' }))
    const allTime = await screen.findByRole('button', { name: /Ewige Tabelle/ })
    expect(allTime).toHaveTextContent('Ada')
    expect(allTime).toHaveTextContent('Ben')

    await userEvent.click(screen.getByRole('button', { name: /^2025/ }))
    expect(
      await screen.findByText('1 Spiele · 1 Siege (100 %) · Ø Versuche: 1'),
    ).toBeInTheDocument()
    expect(screen.queryByText('12 Pkt.')).not.toBeInTheDocument()
  })

  test("January introduces the new round with last year's podium", async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join({ name: 'Ada', passphrase: PASSPHRASE }, TODAY)
    server.seed('Ben', { date: '2026-12-30', guesses: ['APFEL'], won: true })
    server.seed('Ada', {
      date: '2026-12-30',
      guesses: ['KNOPF', 'APFEL'],
      won: true,
    })

    renderBoard(leaderboard, '2027-01-05')
    await userEvent.click(await screen.findByRole('tab', { name: '2027' }))

    expect(
      await screen.findByText('2026: Ben gewinnt vor Ada'),
    ).toBeInTheDocument()
    expect(screen.getByText('Neue Runde seit 1. Januar')).toBeInTheDocument()
  })

  test.each(['none', 'unsupported'] as const)(
    'keeps a single overall table when the server has no rounds (%s)',
    async (rounds) => {
      const { server, leaderboard } = setup({ rounds })
      await leaderboard.join({ name: 'Ada', passphrase: PASSPHRASE }, TODAY)
      server.seed('Ada', { date: '2025-06-01', guesses: ['APFEL'], won: true })

      renderBoard(leaderboard)
      await userEvent.click(await screen.findByRole('tab', { name: 'Gesamt' }))

      expect(await screen.findByText('6 Pkt.')).toBeInTheDocument()
      expect(
        screen.queryByRole('tab', { name: 'Archiv' }),
      ).not.toBeInTheDocument()
    },
  )

  test('leaving asks for confirmation first', async () => {
    const { leaderboard } = setup()
    await leaderboard.join({ name: 'Ada', passphrase: PASSPHRASE }, TODAY)

    renderBoard(leaderboard)
    await userEvent.click(
      await screen.findByRole('button', { name: 'Abmelden' }),
    )
    expect(leaderboard.getIdentity()).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))
    expect(leaderboard.getIdentity()).toBeNull()
    expect(screen.getByLabelText('Dein Name')).toBeInTheDocument()
  })

  test('says so when the leaderboard is unreachable', async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join({ name: 'Ada', passphrase: PASSPHRASE }, TODAY)
    server.setOnline(false)

    render(
      <Leaderboard
        date={TODAY}
        solution="APFEL"
        isOpen={true}
        isGameWon={false}
        isGameLost={false}
        leaderboard={leaderboard}
      />,
    )

    expect(
      await screen.findByText(/Bestenliste derzeit nicht verfügbar/),
    ).toBeInTheDocument()
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import { GAME_EDITION_TEXT, GAME_TITLE } from './constants/strings'
import { AlertProvider } from './context/AlertContext'
import { getWordOfDay } from './lib/words'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

test('renders App component', async () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>,
  )

  expect(await screen.findByText(GAME_TITLE)).toBeInTheDocument()
  expect(screen.getByText(/^Nr\. \d+ · \d{1,2}\. \S+$/)).toBeInTheDocument()
  expect(GAME_EDITION_TEXT).toMatch(/^German Edition \d+\.\d+$/)
})

test('submits a finished game to the leaderboard when it is loaded', async () => {
  const { solution } = getWordOfDay()
  localStorage.setItem(
    'gameState',
    JSON.stringify({ guesses: [solution], solution }),
  )
  localStorage.setItem('leaderboardName', 'Ada')
  localStorage.setItem('leaderboardPassphrase', 'secret')
  const fetchMock = vi
    .fn()
    .mockImplementation(async () => new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)

  render(
    <AlertProvider>
      <App />
    </AlertProvider>,
  )

  await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  const [url, init] = fetchMock.mock.calls[0]
  expect(String(url)).toContain('/api/results')
  expect(JSON.parse(init.body)).toMatchObject({
    name: 'Ada',
    guesses: [solution],
    won: true,
  })
})

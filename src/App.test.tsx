import { render, screen } from '@testing-library/react'
import App from './App'
import { GAME_SUBTITLE, GAME_TITLE } from './constants/strings'
import { AlertProvider } from './context/AlertContext'

test('renders App component', async () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>,
  )

  expect(await screen.findByText(GAME_TITLE)).toBeInTheDocument()
  expect(screen.getByText(GAME_SUBTITLE)).toBeInTheDocument()
  expect(GAME_SUBTITLE).toMatch(/^German Edition \d+\.\d+$/)
})

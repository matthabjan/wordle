import { render, screen } from '@testing-library/react'
import App from './App'
import { GAME_TITLE } from './constants/strings'
import { AlertProvider } from './context/AlertContext'

test('renders App component', async () => {
  render(
    <AlertProvider>
      <App />
    </AlertProvider>,
  )

  expect(await screen.findByText(GAME_TITLE)).toBeInTheDocument()
})

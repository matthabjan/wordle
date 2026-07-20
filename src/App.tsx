import {
  ChartBarIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState } from 'react'
import { AlertContainer } from './components/alerts/AlertContainer'
import { Grid } from './components/grid/Grid'
import { Keyboard } from './components/keyboard/Keyboard'
import { InfoModal } from './components/modals/InfoModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { StatsModal } from './components/modals/StatsModal'
import {
  GAME_COPIED_MESSAGE,
  GAME_TITLE,
  SHARE_FAILED_MESSAGE,
  UPDATE_AVAILABLE_MESSAGE,
} from './constants/strings'
import { useAlert } from './context/AlertContext'
import { useGameState } from './hooks/useGameState'
import { useTheme } from './hooks/useTheme'
import { useWordOfDay } from './hooks/useWordOfDay'
import { loadGameStateFromLocalStorage } from './lib/localStorage'

const headerIconClass =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nature-stone-700 transition hover:bg-nature-stone-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:text-nature-stone-200 dark:hover:bg-nature-stone-800 dark:focus-visible:ring-offset-nature-stone-900'

function App() {
  const { solution, solutionIndex, tomorrow } = useWordOfDay()
  const { showError: showErrorAlert, showSuccess: showSuccessAlert } =
    useAlert()
  const {
    isDarkMode,
    isHighContrastMode,
    handleDarkMode,
    handleHighContrastMode,
  } = useTheme()

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  const onOpenStats = useCallback(() => setIsStatsModalOpen(true), [])

  const {
    currentGuess,
    cursorIndex,
    guesses,
    isGameWon,
    isGameLost,
    isRevealing,
    currentRowClass,
    stats,
    isHardMode,
    handleHardMode,
    onChar,
    onDelete,
    onEnter,
    setCursor,
    moveCursor,
  } = useGameState({ solution, solutionIndex, onOpenStats })

  useEffect(() => {
    if (!loadGameStateFromLocalStorage()) {
      setIsInfoModalOpen(true)
    }
  }, [])

  useEffect(() => {
    const onUpdate = () => setUpdateAvailable(true)
    window.addEventListener('pwa-update-available', onUpdate)
    return () => window.removeEventListener('pwa-update-available', onUpdate)
  }, [])

  const handleShareSuccess = () => showSuccessAlert(GAME_COPIED_MESSAGE)
  const handleShareFailure = () => showErrorAlert(SHARE_FAILED_MESSAGE)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-nature-stone-50 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-300 dark:bg-nature-stone-900">
      <div className="game-column flex min-h-0 flex-1 flex-col">
        <header className="mt-3 mb-4 flex w-full items-center gap-1">
          <h1 className="min-w-0 grow truncate font-display text-[clamp(1.5rem,6vw,2.25rem)] font-bold tracking-tight text-nature-stone-900 dark:text-nature-stone-50">
            {GAME_TITLE}
          </h1>
          <button
            type="button"
            className={headerIconClass}
            aria-label="Hilfe"
            onClick={() => setIsInfoModalOpen(true)}
          >
            <InformationCircleIcon className="h-7 w-7" />
          </button>
          <button
            type="button"
            className={headerIconClass}
            aria-label="Statistik"
            onClick={() => setIsStatsModalOpen(true)}
          >
            <ChartBarIcon className="h-7 w-7" />
          </button>
          <button
            type="button"
            className={headerIconClass}
            aria-label="Einstellungen"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <Cog6ToothIcon className="h-7 w-7" />
          </button>
        </header>

        {updateAvailable && (
          <button
            type="button"
            className="mb-2 w-full rounded-full bg-[var(--accent-color)] px-4 py-2 text-sm leading-snug font-medium text-balance text-white shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-nature-stone-900"
            onClick={() =>
              window.dispatchEvent(new CustomEvent('pwa-apply-update'))
            }
          >
            {UPDATE_AVAILABLE_MESSAGE}
          </button>
        )}

        <div className="flex flex-1 flex-col items-center justify-center py-2">
          <Grid
            guesses={guesses}
            currentGuess={currentGuess}
            cursorIndex={cursorIndex}
            onSelectCell={setCursor}
            isRevealing={isRevealing}
            currentRowClassName={currentRowClass}
            isGameWon={isGameWon}
            isGameLost={isGameLost}
            solution={solution}
          />
        </div>

        <Keyboard
          onChar={onChar}
          onDelete={onDelete}
          onEnter={onEnter}
          onArrowLeft={() => moveCursor(-1)}
          onArrowRight={() => moveCursor(1)}
          guesses={guesses}
          isRevealing={isRevealing}
          solution={solution}
        />
      </div>

      <InfoModal
        isOpen={isInfoModalOpen}
        handleClose={() => setIsInfoModalOpen(false)}
      />
      <StatsModal
        isOpen={isStatsModalOpen}
        handleClose={() => setIsStatsModalOpen(false)}
        guesses={guesses}
        gameStats={stats}
        isGameLost={isGameLost}
        isGameWon={isGameWon}
        handleShare={handleShareSuccess}
        handleShareFailure={handleShareFailure}
        isHardMode={isHardMode}
        tomorrow={tomorrow}
        solution={solution}
        solutionIndex={solutionIndex}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        handleClose={() => setIsSettingsModalOpen(false)}
        isHardMode={isHardMode}
        handleHardMode={handleHardMode}
        isDarkMode={isDarkMode}
        handleDarkMode={handleDarkMode}
        isHighContrastMode={isHighContrastMode}
        handleHighContrastMode={handleHighContrastMode}
      />

      <AlertContainer />
    </div>
  )
}

export default App

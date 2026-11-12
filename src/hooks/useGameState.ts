import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ALERT_TIME_MS,
  GAME_LOST_INFO_DELAY,
  MAX_CHALLENGES,
  MAX_WORD_LENGTH,
  REVEAL_TIME_MS,
} from '../constants/settings'
import {
  CORRECT_WORD_MESSAGE,
  HARD_MODE_ALERT_MESSAGE,
  NOT_ENOUGH_LETTERS_MESSAGE,
  WIN_MESSAGES,
  WORD_NOT_FOUND_MESSAGE,
} from '../constants/strings'
import { useAlert } from '../context/AlertContext'
import {
  deleteLetter,
  getGameResult,
  moveCursor as moveGameCursor,
  setCursor as setGameCursor,
  setHardMode,
  startGame,
  submitGuess,
  SubmitOutcome,
  typeLetter,
} from '../lib/game'
import { vibrate } from '../lib/haptics'
import {
  getStoredGameMode,
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  setStoredGameMode,
} from '../lib/localStorage'
import { addStatsForCompletedGame, loadStats } from '../lib/stats'

// How long the tiles of a submitted guess take to flip.
const REVEAL_DURATION_MS = REVEAL_TIME_MS * MAX_WORD_LENGTH

const rejectionMessage = (
  outcome: Extract<SubmitOutcome, { kind: 'rejected' }>,
) => {
  if (outcome.reason === 'hard_mode') return outcome.message
  return outcome.reason === 'not_enough_letters'
    ? NOT_ENOUGH_LETTERS_MESSAGE
    : WORD_NOT_FOUND_MESSAGE
}

type Options = {
  solution: string
  solutionIndex: number
  onOpenStats: () => void
}

export const useGameState = ({
  solution,
  solutionIndex,
  onOpenStats,
}: Options) => {
  const { showError: showErrorAlert, showSuccess: showSuccessAlert } =
    useAlert()

  const [game, setGame] = useState(() =>
    startGame({ solution, solutionIndex, isHardMode: getStoredGameMode() }),
  )
  const [currentRowClass, setCurrentRowClass] = useState('')
  const [isRevealing, setIsRevealing] = useState(false)
  const [stats, setStats] = useState(() => loadStats())
  const [hasRestored, setHasRestored] = useState(false)

  const isGameWon = game.status === 'won'
  const isGameLost = game.status === 'lost'
  const result = useMemo(() => getGameResult(game), [game])

  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  // Restore / reset game when the daily solution changes
  useEffect(() => {
    clearTimers()
    setCurrentRowClass('')
    setIsRevealing(false)

    const loaded = loadGameStateFromLocalStorage()
    const restored = startGame({
      solution,
      solutionIndex,
      isHardMode: getStoredGameMode(),
      guesses: loaded?.solution === solution ? loaded.guesses : [],
    })
    setGame(restored)

    if (restored.status === 'lost') {
      showErrorAlert(CORRECT_WORD_MESSAGE(solution), { persist: true })
    }

    setHasRestored(true)
  }, [solution, solutionIndex, clearTimers, showErrorAlert])

  useEffect(() => {
    if (!hasRestored) return
    saveGameStateToLocalStorage({
      guesses: game.guesses,
      solution: game.solution,
    })
  }, [game.guesses, game.solution, hasRestored])

  useEffect(() => {
    if (isGameWon) {
      const winMessage =
        WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]
      showSuccessAlert(winMessage, {
        delayMs: REVEAL_DURATION_MS,
        onClose: () => onOpenStats(),
      })
      vibrate([20, 40, 20])
    }

    if (isGameLost) {
      schedule(() => onOpenStats(), GAME_LOST_INFO_DELAY)
    }
  }, [isGameWon, isGameLost, showSuccessAlert, onOpenStats, schedule])

  const jiggle = useCallback(() => {
    vibrate(30)
    setCurrentRowClass('jiggle')
    schedule(() => setCurrentRowClass(''), ALERT_TIME_MS)
  }, [schedule])

  const handleHardMode = useCallback(
    (isHard: boolean) => {
      if (!setHardMode(game, isHard).allowed) {
        showErrorAlert(HARD_MODE_ALERT_MESSAGE)
        return
      }
      setGame((prev) => setHardMode(prev, isHard).game)
      setStoredGameMode(isHard)
    },
    [game, showErrorAlert],
  )

  // Input is not forwarded to the game while the last guess is being revealed.
  const setCursor = useCallback(
    (index: number) => {
      if (isRevealing) return
      setGame((prev) => setGameCursor(prev, index))
    },
    [isRevealing],
  )

  const onChar = useCallback(
    (value: string) => {
      if (isRevealing) return
      setGame((prev) => typeLetter(prev, value))
    },
    [isRevealing],
  )

  const onDelete = useCallback(() => {
    if (isRevealing) return
    setGame((prev) => deleteLetter(prev))
  }, [isRevealing])

  const moveCursor = useCallback(
    (delta: number) => {
      if (isRevealing) return
      setGame((prev) => moveGameCursor(prev, delta))
    },
    [isRevealing],
  )

  const onEnter = useCallback(() => {
    if (isRevealing) return

    const { game: nextGame, outcome } = submitGuess(game)

    if (outcome.kind === 'ignored') return

    if (outcome.kind === 'rejected') {
      showErrorAlert(rejectionMessage(outcome))
      jiggle()
      return
    }

    setIsRevealing(true)
    schedule(() => setIsRevealing(false), REVEAL_DURATION_MS)
    setGame(nextGame)

    if (outcome.kind === 'won') {
      // Stats count wins by the zero-based row of the winning guess.
      setStats(
        addStatsForCompletedGame(
          stats,
          nextGame.guesses.length - 1,
          solutionIndex,
        ),
      )
    }

    if (outcome.kind === 'lost') {
      setStats(addStatsForCompletedGame(stats, MAX_CHALLENGES, solutionIndex))
      showErrorAlert(CORRECT_WORD_MESSAGE(solution), {
        persist: true,
        delayMs: REVEAL_DURATION_MS + 1,
      })
    }
  }, [
    game,
    isRevealing,
    jiggle,
    schedule,
    showErrorAlert,
    solution,
    solutionIndex,
    stats,
  ])

  return {
    currentGuess: game.currentRow,
    cursorIndex: game.cursor,
    guesses: game.guesses,
    isGameWon,
    isGameLost,
    result,
    isRevealing,
    currentRowClass,
    stats,
    isHardMode: game.isHardMode,
    handleHardMode,
    onChar,
    onDelete,
    onEnter,
    setCursor,
    moveCursor,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
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
import { vibrate } from '../lib/haptics'
import {
  getStoredGameMode,
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  setStoredGameMode,
} from '../lib/localStorage'
import { addStatsForCompletedGame, loadStats } from '../lib/stats'
import {
  findFirstUnusedReveal,
  isWinningWord,
  isWordInWordList,
} from '../lib/words'

const emptyRow = (): (string | null)[] =>
  Array.from({ length: MAX_WORD_LENGTH }, () => null)

type RowState = {
  letters: (string | null)[]
  cursor: number
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

  const [row, setRow] = useState<RowState>({ letters: emptyRow(), cursor: 0 })
  const [isGameWon, setIsGameWon] = useState(false)
  const [isGameLost, setIsGameLost] = useState(false)
  const [currentRowClass, setCurrentRowClass] = useState('')
  const [isRevealing, setIsRevealing] = useState(false)
  const [guesses, setGuesses] = useState<string[]>([])
  const [stats, setStats] = useState(() => loadStats())
  const [isHardMode, setIsHardMode] = useState(() => getStoredGameMode())
  const [hasRestored, setHasRestored] = useState(false)

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
    setRow({ letters: emptyRow(), cursor: 0 })
    setCurrentRowClass('')
    setIsRevealing(false)

    const loaded = loadGameStateFromLocalStorage()
    if (loaded?.solution !== solution) {
      setGuesses([])
      setIsGameWon(false)
      setIsGameLost(false)
      setHasRestored(true)
      return
    }

    const gameWasWon = loaded.guesses.includes(solution)
    setGuesses(loaded.guesses)
    setIsGameWon(gameWasWon)
    const lost = loaded.guesses.length === MAX_CHALLENGES && !gameWasWon
    setIsGameLost(lost)

    if (lost) {
      showErrorAlert(CORRECT_WORD_MESSAGE(solution), { persist: true })
    }

    setHasRestored(true)
  }, [solution, clearTimers, showErrorAlert])

  useEffect(() => {
    if (!hasRestored) return
    saveGameStateToLocalStorage({ guesses, solution })
  }, [guesses, solution, hasRestored])

  useEffect(() => {
    if (isGameWon) {
      const winMessage =
        WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]
      const delayMs = REVEAL_TIME_MS * MAX_WORD_LENGTH

      showSuccessAlert(winMessage, {
        delayMs,
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
      if (guesses.length === 0 || getStoredGameMode()) {
        setIsHardMode(isHard)
        setStoredGameMode(isHard)
      } else {
        showErrorAlert(HARD_MODE_ALERT_MESSAGE)
      }
    },
    [guesses.length, showErrorAlert],
  )

  const setCursor = useCallback(
    (index: number) => {
      if (isGameWon || isGameLost || isRevealing) return
      if (index < 0 || index >= MAX_WORD_LENGTH) return
      setRow((prev) => ({ ...prev, cursor: index }))
    },
    [isGameWon, isGameLost, isRevealing],
  )

  const onChar = useCallback(
    (value: string) => {
      if (
        isRevealing ||
        isGameWon ||
        isGameLost ||
        guesses.length >= MAX_CHALLENGES
      ) {
        return
      }

      setRow((prev) => {
        const letters = [...prev.letters]
        letters[prev.cursor] = value

        let cursor = prev.cursor
        let foundEmpty = false
        for (let i = prev.cursor + 1; i < MAX_WORD_LENGTH; i++) {
          if (letters[i] === null) {
            cursor = i
            foundEmpty = true
            break
          }
        }
        if (!foundEmpty) {
          cursor = Math.min(prev.cursor + 1, MAX_WORD_LENGTH - 1)
        }

        return { letters, cursor }
      })
    },
    [guesses.length, isGameLost, isGameWon, isRevealing],
  )

  const onDelete = useCallback(() => {
    if (isRevealing || isGameWon || isGameLost) return

    setRow((prev) => {
      const letters = [...prev.letters]
      if (letters[prev.cursor] !== null) {
        letters[prev.cursor] = null
        return { letters, cursor: prev.cursor }
      }
      if (prev.cursor > 0) {
        const cursor = prev.cursor - 1
        letters[cursor] = null
        return { letters, cursor }
      }
      return prev
    })
  }, [isGameLost, isGameWon, isRevealing])

  const onEnter = useCallback(() => {
    if (isGameWon || isGameLost || isRevealing) return

    const filled = row.letters.every((letter) => letter !== null)
    if (!filled) {
      showErrorAlert(NOT_ENOUGH_LETTERS_MESSAGE)
      jiggle()
      return
    }

    const currentGuess = row.letters.join('')

    if (!isWordInWordList(currentGuess)) {
      showErrorAlert(WORD_NOT_FOUND_MESSAGE)
      jiggle()
      return
    }

    if (isHardMode) {
      const firstMissingReveal = findFirstUnusedReveal(
        currentGuess,
        guesses,
        solution,
      )
      if (firstMissingReveal) {
        showErrorAlert(firstMissingReveal)
        jiggle()
        return
      }
    }

    setIsRevealing(true)
    schedule(() => setIsRevealing(false), REVEAL_TIME_MS * MAX_WORD_LENGTH)

    const winningWord = isWinningWord(currentGuess, solution)
    const nextGuesses = [...guesses, currentGuess]

    setGuesses(nextGuesses)
    setRow({ letters: emptyRow(), cursor: 0 })

    if (winningWord) {
      setStats(addStatsForCompletedGame(stats, guesses.length, solutionIndex))
      setIsGameWon(true)
      return
    }

    if (guesses.length === MAX_CHALLENGES - 1) {
      setStats(
        addStatsForCompletedGame(stats, guesses.length + 1, solutionIndex),
      )
      setIsGameLost(true)
      showErrorAlert(CORRECT_WORD_MESSAGE(solution), {
        persist: true,
        delayMs: REVEAL_TIME_MS * MAX_WORD_LENGTH + 1,
      })
    }
  }, [
    guesses,
    isGameLost,
    isGameWon,
    isHardMode,
    isRevealing,
    jiggle,
    row.letters,
    schedule,
    showErrorAlert,
    solution,
    solutionIndex,
    stats,
  ])

  const moveCursor = useCallback(
    (delta: number) => {
      if (isRevealing || isGameWon || isGameLost) return
      setRow((prev) => ({
        ...prev,
        cursor: Math.max(0, Math.min(MAX_WORD_LENGTH - 1, prev.cursor + delta)),
      }))
    },
    [isGameLost, isGameWon, isRevealing],
  )

  return {
    currentGuess: row.letters,
    cursorIndex: row.cursor,
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
  }
}

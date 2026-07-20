import { motion, useReducedMotion } from 'framer-motion'
import { MAX_CHALLENGES } from '../../constants/settings'
import { CompletedRow } from './CompletedRow'
import { CurrentRow } from './CurrentRow'
import { EmptyRow } from './EmptyRow'

type Props = {
  guesses: string[]
  currentGuess: (string | null)[]
  cursorIndex: number
  onSelectCell: (index: number) => void
  isRevealing?: boolean
  currentRowClassName: string
  isGameWon?: boolean
  solution: string
}

export const Grid = ({
  guesses,
  currentGuess,
  cursorIndex,
  onSelectCell,
  isRevealing,
  currentRowClassName,
  isGameWon = false,
  solution,
}: Props) => {
  const empties =
    guesses.length < MAX_CHALLENGES - 1
      ? Array.from(Array(MAX_CHALLENGES - 1 - guesses.length))
      : []
  const reduceMotion = useReducedMotion()

  return (
    <motion.div className="pb-4" role="grid" aria-label="Wordle-Raster">
      {guesses.map((guess, i) => (
        <motion.div
          key={i}
          animate={
            isGameWon && !reduceMotion
              ? {
                  scale: [1, 1.05, 1],
                  y: [0, -4, 0],
                }
              : { scale: 1, y: 0 }
          }
          transition={{
            duration: 0.6,
            delay: isGameWon ? i * 0.1 : 0,
          }}
        >
          <CompletedRow
            guess={guess}
            solution={solution}
            rowIndex={i}
            isRevealing={isRevealing && guesses.length - 1 === i}
          />
        </motion.div>
      ))}
      {guesses.length < MAX_CHALLENGES && (
        <CurrentRow
          guess={currentGuess}
          cursorIndex={cursorIndex}
          onSelectCell={onSelectCell}
          className={currentRowClassName}
        />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} />
      ))}
    </motion.div>
  )
}

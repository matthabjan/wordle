import { MAX_CHALLENGES } from '../../constants/settings'
import { CompletedRow } from './CompletedRow'
import { CurrentRow } from './CurrentRow'
import { EmptyRow } from './EmptyRow'
import { motion } from 'framer-motion'

type Props = {
  guesses: string[]
  currentGuess: string
  isRevealing?: boolean
  currentRowClassName: string
  isGameWon?: boolean
}

export const Grid = ({
  guesses,
  currentGuess,
  isRevealing,
  currentRowClassName,
  isGameWon = false,
}: Props) => {
  const empties =
    guesses.length < MAX_CHALLENGES - 1
      ? Array.from(Array(MAX_CHALLENGES - 1 - guesses.length))
      : []

  return (
    <motion.div className="pb-6">
      {guesses.map((guess, i) => (
        <motion.div
          key={i}
          animate={
            isGameWon
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
            isRevealing={isRevealing && guesses.length - 1 === i}
          />
        </motion.div>
      ))}
      {guesses.length < MAX_CHALLENGES && (
        <CurrentRow guess={currentGuess} className={currentRowClassName} />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} />
      ))}
    </motion.div>
  )
}

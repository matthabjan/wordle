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

  // Cascade animation for winning
  const gridVariants = {
    normal: {},
    winning: {
      transition: {
        staggerChildren: 0.1,
      }
    }
  }

  const rowWinVariants = {
    normal: { scale: 1, y: 0 },
    winning: { 
      scale: [1, 1.05, 1],
      y: [0, -4, 0],
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  }

  return (
    <motion.div 
      className="pb-6"
      variants={gridVariants}
      initial="normal"
      animate={isGameWon ? "winning" : "normal"}
    >
      {guesses.map((guess, i) => (
        <motion.div key={i} variants={rowWinVariants}>
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

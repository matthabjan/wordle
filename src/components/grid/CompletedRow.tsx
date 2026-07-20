import { motion, useReducedMotion } from 'framer-motion'
import { getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'

type Props = {
  guess: string
  solution: string
  isRevealing?: boolean
  rowIndex: number
  celebrate?: boolean
}

export const CompletedRow = ({
  guess,
  solution,
  isRevealing,
  rowIndex,
  celebrate = false,
}: Props) => {
  const statuses = getGuessStatuses(guess, solution)
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="mb-1 flex justify-center"
      role="row"
      aria-label={`Versuch ${rowIndex + 1}: ${guess}`}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={
        celebrate && !reduceMotion
          ? { opacity: 1, scale: [1, 1.05, 1], y: [0, -4, 0] }
          : { opacity: 1, scale: 1, y: 0 }
      }
      transition={{
        duration: celebrate && !reduceMotion ? 0.6 : 0.3,
        delay: celebrate && !reduceMotion ? rowIndex * 0.1 : 0,
      }}
    >
      {guess.split('').map((letter, i) => (
        <Cell
          key={i}
          value={letter}
          status={statuses[i]}
          position={i}
          isRevealing={isRevealing}
          isCompleted
        />
      ))}
    </motion.div>
  )
}

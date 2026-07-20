import { motion, useReducedMotion } from 'framer-motion'
import { getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'

type Props = {
  guess: string
  solution: string
  isRevealing?: boolean
  rowIndex: number
}

export const CompletedRow = ({
  guess,
  solution,
  isRevealing,
  rowIndex,
}: Props) => {
  const statuses = getGuessStatuses(guess, solution)
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="mb-1 flex justify-center"
      role="group"
      aria-label={`Versuch ${rowIndex + 1}: ${guess}`}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
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

import { getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'
import { motion } from 'framer-motion'

type Props = {
  guess: string
  isRevealing?: boolean
}

export const CompletedRow = ({ guess, isRevealing }: Props) => {
  const statuses = getGuessStatuses(guess)

  // Staggered animation container for the row
  const rowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  }

  const cellContainerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  }

  return (
    <motion.div 
      className="flex justify-center mb-1"
      variants={rowVariants}
      initial="hidden"
      animate="visible"
    >
      {guess.split('').map((letter, i) => (
        <motion.div key={i} variants={cellContainerVariants}>
          <Cell
            value={letter}
            status={statuses[i]}
            position={i}
            isRevealing={isRevealing}
            isCompleted
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

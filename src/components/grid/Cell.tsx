import { CharStatus } from '../../lib/statuses'
import classnames from 'classnames'
import { REVEAL_TIME_MS } from '../../constants/settings'
import { getStoredIsHighContrastMode } from '../../lib/localStorage'
import { motion } from 'framer-motion'

type Props = {
  value?: string
  status?: CharStatus
  isRevealing?: boolean
  isCompleted?: boolean
  position?: number
}

export const Cell = ({
  value,
  status,
  isRevealing,
  isCompleted,
  position = 0,
}: Props) => {
  const isFilled = value && !isCompleted
  const shouldReveal = isRevealing && isCompleted
  const animationDelay = `${position * REVEAL_TIME_MS}ms`
  const isHighContrast = getStoredIsHighContrastMode()

  const classes = classnames(
    'w-14 h-14 border-solid border-2 flex items-center justify-center mx-0.5 text-4xl font-bold rounded-lg dark:text-white transition-all duration-200',
    {
      'bg-nature-stone-50 dark:bg-nature-stone-800 border-nature-stone-300 dark:border-nature-stone-600 cell-tactile':
        !status,
      'border-nature-stone-500 dark:border-nature-stone-400': value && !status,
      'absent shadowed bg-nature-stone-500 dark:bg-nature-stone-700 text-white border-nature-stone-500 dark:border-nature-stone-700':
        status === 'absent',
      'correct shadowed bg-orange-500 text-white border-orange-500':
        status === 'correct' && isHighContrast,
      'present shadowed bg-cyan-500 text-white border-cyan-500':
        status === 'present' && isHighContrast,
      'correct shadowed bg-nature-emerald-600 dark:bg-nature-emerald-700 text-white border-nature-emerald-600 dark:border-nature-emerald-700':
        status === 'correct' && !isHighContrast,
      'present shadowed bg-nature-amber-500 dark:bg-nature-amber-600 text-white border-nature-amber-500 dark:border-nature-amber-600':
        status === 'present' && !isHighContrast,
      'cell-fill-animation': isFilled,
      'cell-reveal': shouldReveal,
    },
  )

  // Framer Motion variants for tactile feedback
  const cellVariants = {
    initial: { scale: 1 },
    filled: { 
      scale: [1, 1.1, 1],
      transition: { duration: 0.15, ease: 'easeOut' }
    },
    empty: { scale: 1 }
  }

  return (
    <motion.div 
      className={classes} 
      style={{ animationDelay }}
      variants={cellVariants}
      initial="initial"
      animate={isFilled ? "filled" : "empty"}
    >
      <div className="letter-container font-display" style={{ animationDelay }}>
        {value}
      </div>
    </motion.div>
  )
}

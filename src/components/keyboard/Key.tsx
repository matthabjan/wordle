import { ReactNode } from 'react'
import classnames from 'classnames'
import { CharStatus } from '../../lib/statuses'
import { MAX_WORD_LENGTH, REVEAL_TIME_MS } from '../../constants/settings'
import { getStoredIsHighContrastMode } from '../../lib/localStorage'
import { motion } from 'framer-motion'

type Props = {
  children?: ReactNode
  value: string
  width?: number
  status?: CharStatus
  onClick: (value: string) => void
  isRevealing?: boolean
}

export const Key = ({
  children,
  status,
  width = 40,
  value,
  onClick,
  isRevealing,
}: Props) => {
  const keyDelayMs = REVEAL_TIME_MS * MAX_WORD_LENGTH
  const isHighContrast = getStoredIsHighContrastMode()

  const classes = classnames(
    'flex items-center justify-center rounded-lg mx-0.5 text-xs font-semibold cursor-pointer select-none dark:text-white shadow-soft transition-all duration-300',
    {
      'bg-nature-stone-200 dark:bg-nature-stone-600 hover:bg-nature-stone-300 dark:hover:bg-nature-stone-500 active:scale-95':
        !status,
      'bg-nature-stone-500 dark:bg-nature-stone-800 text-white': status === 'absent',
      'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white':
        status === 'correct' && isHighContrast,
      'bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white':
        status === 'present' && isHighContrast,
      'bg-nature-emerald-600 dark:bg-nature-emerald-700 hover:bg-nature-emerald-700 dark:hover:bg-nature-emerald-600 text-white':
        status === 'correct' && !isHighContrast,
      'bg-nature-amber-500 dark:bg-nature-amber-600 hover:bg-nature-amber-600 dark:hover:bg-nature-amber-500 text-white':
        status === 'present' && !isHighContrast,
    },
  )

  const styles = {
    transitionDelay: isRevealing ? `${keyDelayMs}ms` : 'unset',
    width: `${width}px`,
    height: '58px',
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick(value)
    event.currentTarget.blur()
  }

  // Framer Motion variants for tactile feedback
  const keyVariants = {
    initial: { scale: 1 },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1, ease: 'easeOut' }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: { duration: 0.15, ease: 'easeOut' }
    }
  }

  return (
    <motion.button 
      style={styles} 
      className={classes} 
      onClick={handleClick}
      variants={keyVariants}
      initial="initial"
      whileTap="tap"
      whileHover="hover"
    >
      <span className="font-display">{children || value}</span>
    </motion.button>
  )
}

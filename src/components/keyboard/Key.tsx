import { ReactNode } from 'react'
import classnames from 'classnames'
import { motion, useReducedMotion } from 'framer-motion'
import { MAX_WORD_LENGTH, REVEAL_TIME_MS } from '../../constants/settings'
import {
  STATUS_ABSENT,
  STATUS_CORRECT,
  STATUS_PRESENT,
} from '../../constants/strings'
import { getStoredIsHighContrastMode } from '../../lib/localStorage'
import { CharStatus } from '../../lib/statuses'

type Props = {
  children?: ReactNode
  value: string
  wide?: boolean
  status?: CharStatus
  onClick: (value: string) => void
  isRevealing?: boolean
  ariaLabel?: string
}

export const Key = ({
  children,
  status,
  wide = false,
  value,
  onClick,
  isRevealing,
  ariaLabel,
}: Props) => {
  const keyDelayMs = REVEAL_TIME_MS * MAX_WORD_LENGTH
  const isHighContrast = getStoredIsHighContrastMode()
  const reduceMotion = useReducedMotion()

  const statusHint =
    status === 'correct'
      ? STATUS_CORRECT
      : status === 'present'
        ? STATUS_PRESENT
        : status === 'absent'
          ? STATUS_ABSENT
          : undefined

  const classes = classnames(
    'flex items-center justify-center rounded-xl mx-0.5 text-xs font-semibold cursor-pointer select-none dark:text-white shadow-soft transition-all duration-300 touch-manipulation min-h-[48px]',
    {
      'bg-nature-stone-200 dark:bg-nature-stone-600 hover:bg-nature-stone-300 dark:hover:bg-nature-stone-500 active:scale-95':
        !status,
      'bg-nature-stone-500 dark:bg-nature-stone-800 text-white':
        status === 'absent',
      'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white':
        status === 'correct' && isHighContrast,
      'bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white':
        status === 'present' && isHighContrast,
      'bg-nature-emerald-600 dark:bg-nature-emerald-700 hover:bg-nature-emerald-700 dark:hover:bg-nature-emerald-600 text-white':
        status === 'correct' && !isHighContrast,
      'bg-nature-amber-500 dark:bg-nature-amber-600 hover:bg-nature-amber-600 dark:hover:bg-nature-amber-500 text-white':
        status === 'present' && !isHighContrast,
      'flex-[1.5]': wide,
      'flex-1': !wide,
    },
  )

  const styles = {
    transitionDelay: isRevealing ? `${keyDelayMs}ms` : 'unset',
    height: 'var(--key-height)',
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick(value)
    event.currentTarget.blur()
  }

  return (
    <motion.button
      type="button"
      style={styles}
      className={classes}
      onClick={handleClick}
      aria-label={ariaLabel || (statusHint ? `${value}, ${statusHint}` : value)}
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      <span className="font-display">{children || value}</span>
    </motion.button>
  )
}

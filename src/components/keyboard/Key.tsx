import { ReactNode } from 'react'
import classnames from 'classnames'
import { motion, useReducedMotion } from 'framer-motion'
import { MAX_WORD_LENGTH, REVEAL_TIME_MS } from '../../constants/settings'
import {
  STATUS_ABSENT,
  STATUS_CORRECT,
  STATUS_PRESENT,
} from '../../constants/strings'
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
    'flex items-center justify-center rounded-xl mx-0.5 font-semibold cursor-pointer select-none shadow-soft transition-all duration-300 touch-manipulation min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-nature-stone-900',
    {
      'bg-nature-stone-200 dark:bg-nature-stone-600 dark:text-white hover:bg-nature-stone-300 dark:hover:bg-nature-stone-500 active:scale-95':
        !status,
      'key-status-absent': status === 'absent',
      'key-status-correct': status === 'correct',
      'key-status-present': status === 'present',
      'flex-[1.5] px-0.5 text-[0.65rem] leading-tight sm:text-xs': wide,
      'flex-1 text-xs': !wide,
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

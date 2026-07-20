import classnames from 'classnames'
import { motion, useReducedMotion } from 'framer-motion'
import { REVEAL_TIME_MS } from '../../constants/settings'
import {
  STATUS_ABSENT,
  STATUS_CORRECT,
  STATUS_PRESENT,
} from '../../constants/strings'
import { getStoredIsHighContrastMode } from '../../lib/localStorage'
import { CharStatus } from '../../lib/statuses'

type Props = {
  value?: string | null
  status?: CharStatus
  isRevealing?: boolean
  isCompleted?: boolean
  position?: number
  isCursor?: boolean
  onClick?: () => void
  interactive?: boolean
  ariaLabel?: string
}

export const Cell = ({
  value,
  status,
  isRevealing,
  isCompleted,
  position = 0,
  isCursor = false,
  onClick,
  interactive = false,
  ariaLabel,
}: Props) => {
  const isFilled = Boolean(value) && !isCompleted
  const shouldReveal = isRevealing && isCompleted
  const animationDelay = `${position * REVEAL_TIME_MS}ms`
  const isHighContrast = getStoredIsHighContrastMode()
  const reduceMotion = useReducedMotion()

  const classes = classnames(
    'border-solid border-2 flex items-center justify-center mx-0.5 text-[clamp(1.5rem,7vw,2.25rem)] font-bold rounded-xl dark:text-white transition-all duration-200 touch-manipulation',
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
      'cell-fill-animation': isFilled && !reduceMotion,
      'cell-reveal': shouldReveal && !reduceMotion,
      'ring-2 ring-nature-emerald-500 cursor-pulse': isCursor && !status,
    },
  )

  const statusLabel =
    status === 'correct'
      ? STATUS_CORRECT
      : status === 'present'
        ? STATUS_PRESENT
        : status === 'absent'
          ? STATUS_ABSENT
          : null

  const content = (
    <>
      <div className="letter-container font-display" style={{ animationDelay }}>
        {value}
      </div>
      {value && statusLabel && (
        <span className="sr-only">
          {value} — {statusLabel}
        </span>
      )}
    </>
  )

  const style = {
    animationDelay,
    width: 'var(--tile-size)',
    height: 'var(--tile-size)',
  }

  if (interactive) {
    return (
      <motion.button
        type="button"
        className={classes}
        style={style}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={isCursor}
        animate={
          isFilled && !reduceMotion ? { scale: [1, 1.1, 1] } : { scale: 1 }
        }
        transition={{ duration: 0.15 }}
      >
        {content}
      </motion.button>
    )
  }

  return (
    <motion.div
      className={classes}
      style={style}
      animate={
        isFilled && !reduceMotion ? { scale: [1, 1.1, 1] } : { scale: 1 }
      }
      transition={{ duration: 0.15 }}
      aria-label={ariaLabel}
    >
      {content}
    </motion.div>
  )
}

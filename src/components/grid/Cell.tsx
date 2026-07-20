import classnames from 'classnames'
import { useReducedMotion } from 'framer-motion'
import { REVEAL_TIME_MS } from '../../constants/settings'
import {
  STATUS_ABSENT,
  STATUS_CORRECT,
  STATUS_PRESENT,
} from '../../constants/strings'
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
  /** Smaller static tiles for help examples */
  compact?: boolean
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
  compact = false,
}: Props) => {
  const isFilled = Boolean(value) && !isCompleted
  const shouldReveal = isRevealing && isCompleted
  const animationDelay = `${position * REVEAL_TIME_MS}ms`
  const reduceMotion = useReducedMotion()

  const classes = classnames(
    'border-solid border-2 flex items-center justify-center mx-0.5 font-bold rounded-xl dark:text-white transition-all duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-nature-stone-900',
    compact ? 'text-base h-9 w-9' : 'text-[clamp(1.5rem,7vw,2.25rem)]',
    {
      'bg-nature-stone-50 dark:bg-nature-stone-800 border-nature-stone-300 dark:border-nature-stone-600 cell-tactile':
        !status,
      'border-nature-stone-500 dark:border-nature-stone-400': value && !status,
      'absent shadowed cell-status-absent': status === 'absent',
      'correct shadowed cell-status-correct': status === 'correct',
      'present shadowed cell-status-present': status === 'present',
      'cell-fill-animation': isFilled && !reduceMotion && !compact,
      'cell-reveal': shouldReveal && !reduceMotion,
      'ring-2 cell-cursor cursor-pulse': isCursor && !status,
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

  const style = compact
    ? { animationDelay }
    : {
        animationDelay,
        width: 'var(--tile-size)',
        height: 'var(--tile-size)',
      }

  if (interactive) {
    return (
      <button
        type="button"
        role="gridcell"
        className={classes}
        style={style}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={isCursor}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      role={compact ? undefined : 'gridcell'}
      className={classes}
      style={style}
      aria-label={ariaLabel}
    >
      {content}
    </div>
  )
}

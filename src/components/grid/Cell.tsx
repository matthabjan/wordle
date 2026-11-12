import classnames from 'classnames'
import { REVEAL_TIME_MS } from '../../constants/settings'
import {
  STATUS_ABSENT,
  STATUS_CORRECT,
  STATUS_PRESENT,
} from '../../constants/strings'
import { CharStatus } from '../../lib/statuses'

const WIN_BOUNCE_STAGGER_MS = 90

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
  /** Bounce once, staggered by position: the winning row */
  celebrate?: boolean
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
  celebrate = false,
  compact = false,
}: Props) => {
  const isFilled = Boolean(value) && !isCompleted
  const shouldReveal = isRevealing && isCompleted
  const animationDelay = `${position * (celebrate ? WIN_BOUNCE_STAGGER_MS : REVEAL_TIME_MS)}ms`

  const classes = classnames(
    'border-solid border-2 flex items-center justify-center mx-0.5 font-bold rounded-xl dark:text-white transition-all duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-nature-stone-900',
    { 'text-base h-9 w-9': compact },
    {
      'bg-nature-stone-50 dark:bg-nature-stone-800 border-nature-stone-300 dark:border-nature-stone-600 cell-tactile':
        !status,
      'border-nature-stone-500 dark:border-nature-stone-400': value && !status,
      'absent shadowed cell-status-absent': status === 'absent',
      'correct shadowed cell-status-correct': status === 'correct',
      'present shadowed cell-status-present': status === 'present',
      // Reduced motion switches these animations off in index.css
      'cell-fill-animation': isFilled && !compact,
      'cell-reveal': shouldReveal,
      'cell-bounce': celebrate && !shouldReveal,
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
        fontSize: 'calc(var(--tile-size) * 0.56)',
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

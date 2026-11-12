import { ReactNode } from 'react'
import classnames from 'classnames'
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
  /** Primary action key (Enter) */
  accent?: boolean
  status?: CharStatus
  onClick: (value: string) => void
  isRevealing?: boolean
  ariaLabel?: string
}

export const Key = ({
  children,
  status,
  wide = false,
  accent = false,
  value,
  onClick,
  isRevealing,
  ariaLabel,
}: Props) => {
  const keyDelayMs = REVEAL_TIME_MS * MAX_WORD_LENGTH

  const statusHint =
    status === 'correct'
      ? STATUS_CORRECT
      : status === 'present'
        ? STATUS_PRESENT
        : status === 'absent'
          ? STATUS_ABSENT
          : undefined

  const classes = classnames(
    'flex items-center justify-center rounded-xl mx-0.5 font-semibold cursor-pointer select-none shadow-soft transition-all duration-150 active:scale-95 touch-manipulation text-[clamp(1rem,4.8vw,1.25rem)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-nature-stone-900',
    {
      'bg-nature-stone-200 dark:bg-nature-stone-500 dark:text-white hover:bg-nature-stone-300 dark:hover:bg-nature-stone-400':
        !status && !accent,
      'bg-[var(--accent-color)] text-white hover:brightness-110': accent,
      'key-status-absent': status === 'absent',
      'key-status-correct': status === 'correct',
      'key-status-present': status === 'present',
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
    <button
      type="button"
      style={styles}
      className={classes}
      onClick={handleClick}
      aria-label={ariaLabel || (statusHint ? `${value}, ${statusHint}` : value)}
    >
      <span className="font-display">{children || value}</span>
    </button>
  )
}

import { BackspaceIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { DELETE_TEXT, ENTER_TEXT } from '../../constants/strings'
import { vibrate } from '../../lib/haptics'
import { getStatuses } from '../../lib/statuses'
import { Key } from './Key'

type Props = {
  onChar: (value: string) => void
  onDelete: () => void
  onEnter: () => void
  onArrowLeft: () => void
  onArrowRight: () => void
  guesses: string[]
  isRevealing?: boolean
  solution: string
}

// Heroicons has no return-key glyph
const EnterIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 5v7a3 3 0 0 1-3 3H5m0 0 4-4m-4 4 4 4" />
  </svg>
)

export const Keyboard = ({
  onChar,
  onDelete,
  onEnter,
  onArrowLeft,
  onArrowRight,
  guesses,
  isRevealing,
  solution,
}: Props) => {
  const charStatuses = getStatuses(guesses, solution)

  const onClick = (value: string) => {
    if (isRevealing) return
    vibrate(8)
    if (value === 'ENTER') {
      onEnter()
    } else if (value === 'DELETE') {
      onDelete()
    } else {
      onChar(value)
    }
  }

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (isRevealing) return

      if (e.code === 'Enter') {
        onEnter()
      } else if (e.code === 'Backspace') {
        onDelete()
      } else if (e.code === 'ArrowLeft') {
        onArrowLeft()
      } else if (e.code === 'ArrowRight') {
        onArrowRight()
      } else {
        const key = e.key.toUpperCase()
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
          onChar(key)
        }
      }
    }
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [onEnter, onDelete, onChar, onArrowLeft, onArrowRight, isRevealing])

  return (
    <div className="-mx-2 shrink-0 pb-2" role="group" aria-label="Tastatur">
      <div className="mb-1.5 flex w-full">
        {['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
          />
        ))}
      </div>
      <div className="mb-1.5 flex w-full px-[3%]">
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
          />
        ))}
      </div>
      <div className="flex w-full">
        <Key wide accent value="ENTER" onClick={onClick} ariaLabel={ENTER_TEXT}>
          <EnterIcon />
        </Key>
        {['Y', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
          />
        ))}
        <Key wide value="DELETE" onClick={onClick} ariaLabel={DELETE_TEXT}>
          <BackspaceIcon className="h-6 w-6" aria-hidden="true" />
        </Key>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { DELETE_TEXT, ENTER_TEXT } from '../../constants/strings'
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
    <div className="w-full pb-2" role="group" aria-label="Tastatur">
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
        <Key wide value="ENTER" onClick={onClick} ariaLabel={ENTER_TEXT}>
          {ENTER_TEXT}
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
          {DELETE_TEXT}
        </Key>
      </div>
    </div>
  )
}

import { getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'

type Props = {
  guess: string
  solution: string
  isRevealing?: boolean
  rowIndex: number
  celebrate?: boolean
}

export const CompletedRow = ({
  guess,
  solution,
  isRevealing,
  rowIndex,
  celebrate = false,
}: Props) => {
  const statuses = getGuessStatuses(guess, solution)

  return (
    <div
      className="mb-1 flex justify-center"
      role="row"
      aria-label={`Versuch ${rowIndex + 1}: ${guess}`}
    >
      {guess.split('').map((letter, i) => (
        <Cell
          key={i}
          value={letter}
          status={statuses[i]}
          position={i}
          isRevealing={isRevealing}
          isCompleted
          celebrate={celebrate}
        />
      ))}
    </div>
  )
}

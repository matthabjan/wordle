import { MAX_CHALLENGES } from '../../constants/settings'
import { CompletedRow } from './CompletedRow'
import { CurrentRow } from './CurrentRow'
import { EmptyRow } from './EmptyRow'

type Props = {
  guesses: string[]
  currentGuess: (string | null)[]
  cursorIndex: number
  onSelectCell: (index: number) => void
  isRevealing?: boolean
  currentRowClassName: string
  isGameWon?: boolean
  isGameLost?: boolean
  solution: string
}

export const Grid = ({
  guesses,
  currentGuess,
  cursorIndex,
  onSelectCell,
  isRevealing,
  currentRowClassName,
  isGameWon = false,
  isGameLost = false,
  solution,
}: Props) => {
  const remaining = MAX_CHALLENGES - guesses.length
  const showCurrentRow = remaining > 0 && !isGameWon && !isGameLost
  const empties = Array.from({
    length: showCurrentRow ? remaining - 1 : Math.max(remaining, 0),
  })

  return (
    <div className="pb-4" role="grid" aria-label="Wordle-Raster">
      {guesses.map((guess, i) => (
        <CompletedRow
          key={i}
          guess={guess}
          solution={solution}
          rowIndex={i}
          isRevealing={isRevealing && guesses.length - 1 === i}
          celebrate={isGameWon}
        />
      ))}
      {showCurrentRow && (
        <CurrentRow
          guess={currentGuess}
          cursorIndex={cursorIndex}
          onSelectCell={onSelectCell}
          className={currentRowClassName}
        />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} />
      ))}
    </div>
  )
}

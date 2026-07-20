import { MAX_WORD_LENGTH } from '../../constants/settings'
import { EDIT_LETTER_LABEL } from '../../constants/strings'
import { Cell } from './Cell'

type Props = {
  guess: (string | null)[]
  cursorIndex: number
  onSelectCell: (index: number) => void
  className: string
}

export const CurrentRow = ({
  guess,
  cursorIndex,
  onSelectCell,
  className,
}: Props) => {
  const classes = `flex justify-center mb-1 ${className}`

  return (
    <div className={classes} role="group" aria-label="Aktuelle Zeile">
      {Array.from({ length: MAX_WORD_LENGTH }).map((_, i) => (
        <Cell
          key={i}
          value={guess[i] ?? undefined}
          isCursor={cursorIndex === i}
          interactive
          onClick={() => onSelectCell(i)}
          ariaLabel={EDIT_LETTER_LABEL(i + 1)}
        />
      ))}
    </div>
  )
}

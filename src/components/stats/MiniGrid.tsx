import classnames from 'classnames'
import { GUESS_GRID_LABEL } from '../../constants/strings'
import { getGuessStatuses } from '../../lib/statuses'

type Props = {
  guesses: string[]
  solution: string
  size?: 'sm' | 'lg'
}

// A finished game as coloured squares without letters, in the same colours as
// the board (including high-contrast mode).
export const MiniGrid = ({ guesses, solution, size = 'sm' }: Props) => (
  <div
    role="img"
    aria-label={GUESS_GRID_LABEL(guesses.length)}
    className={classnames(
      'inline-flex flex-col',
      size === 'lg' ? 'gap-1' : 'gap-0.5',
    )}
  >
    {guesses.map((guess, row) => (
      <div key={row} className={size === 'lg' ? 'flex gap-1' : 'flex gap-0.5'}>
        {getGuessStatuses(guess, solution).map((status, column) => (
          <span
            key={column}
            className={classnames(
              `cell-status-${status}`,
              size === 'lg'
                ? 'h-7 w-7 rounded-md'
                : 'h-3.5 w-3.5 rounded-[3px]',
            )}
          />
        ))}
      </div>
    ))}
  </div>
)

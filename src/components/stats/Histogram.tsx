import { GameStats } from '../../lib/localStorage'
import { Progress } from './Progress'

type Props = {
  gameStats: GameStats
}

export const Histogram = ({ gameStats }: Props) => {
  const winDistribution = gameStats.winDistribution
  const maxValue = Math.max(...winDistribution, 1)

  return (
    <div className="mt-2 text-sm dark:text-nature-stone-50">
      <ul className="sr-only">
        {winDistribution.map((value, i) => (
          <li key={i}>
            {i + 1} Versuch{i === 0 ? '' : 'e'}: {value}
          </li>
        ))}
      </ul>
      {winDistribution.map((value, i) => (
        <Progress
          key={i}
          index={i}
          size={90 * (value / maxValue)}
          label={String(value)}
        />
      ))}
    </div>
  )
}

type Props = {
  index: number
  size: number
  label: string
}

export const Progress = ({ index, size, label }: Props) => {
  return (
    <div className="my-1 flex items-center" aria-hidden="true">
      <div className="w-4 shrink-0 text-center text-sm font-medium tabular-nums">
        {index + 1}
      </div>
      <div className="ml-2 min-w-0 flex-1">
        <div
          style={{ width: `${Math.max(5 + size, 12)}%` }}
          className="rounded-full bg-[var(--accent-color)] px-1.5 py-0.5 text-center text-xs font-medium text-white"
        >
          {label}
        </div>
      </div>
    </div>
  )
}

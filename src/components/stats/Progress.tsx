type Props = {
  index: number
  size: number
  label: string
}

export const Progress = ({ index, size, label }: Props) => {
  return (
    <div className="m-1 flex justify-left" aria-hidden="true">
      <div className="w-2 items-center justify-center">{index + 1}</div>
      <div className="ml-2 w-full rounded-full">
        <div
          style={{ width: `${5 + size}%` }}
          className="rounded-l-full bg-nature-emerald-600 p-0.5 text-center text-xs font-medium text-nature-emerald-50"
        >
          {label}
        </div>
      </div>
    </div>
  )
}

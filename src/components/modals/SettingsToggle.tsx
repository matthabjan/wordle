import classnames from 'classnames'

type Props = {
  settingName: string
  flag: boolean
  handleFlag: (value: boolean) => void
  description?: string
}

export const SettingsToggle = ({
  settingName,
  flag,
  handleFlag,
  description,
}: Props) => {
  const toggleHolder = classnames(
    'flex h-8 w-14 shrink-0 items-center rounded-full p-1 duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-nature-stone-800',
    {
      'justify-end bg-[var(--accent-color)]': flag,
      'justify-start bg-nature-stone-300 dark:bg-nature-stone-600': !flag,
    },
  )

  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1 text-left">
        <h2 className="font-medium text-nature-stone-700 dark:text-nature-stone-200">
          {settingName}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-nature-stone-500 dark:text-nature-stone-400">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={flag}
        aria-label={settingName}
        className={toggleHolder}
        onClick={() => handleFlag(!flag)}
      >
        <span className="h-6 w-6 rounded-full bg-white shadow-soft duration-300 ease-in-out" />
      </button>
    </div>
  )
}

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
    'w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out',
    {
      'bg-nature-emerald-500': flag,
      'bg-nature-stone-300 dark:bg-nature-stone-600': !flag,
    },
  )
  const toggleButton = classnames(
    'bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out',
    {
      'translate-x-6': flag,
    },
  )

  return (
    <div className="mt-3 flex items-center justify-between gap-8">
      <div className="text-left">
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
        <span className={toggleButton} />
      </button>
    </div>
  )
}

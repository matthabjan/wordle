import classnames from 'classnames'

type Props<T extends string> = {
  tabs: readonly { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  /** Accessible name of the tab list */
  label: string
  /** Prefix for the `<prefix>-<id>-tab` / `-panel` ids */
  idPrefix: string
  /** `underline` for a sheet's top-level tabs, `segmented` inside content */
  variant?: 'segmented' | 'underline'
}

export const Tabs = <T extends string>({
  tabs,
  active,
  onChange,
  label,
  idPrefix,
  variant = 'segmented',
}: Props<T>) => {
  const segmented = variant === 'segmented'

  return (
    <div
      role="tablist"
      aria-label={label}
      className={classnames('flex', {
        'rounded-xl bg-nature-stone-100 p-1 dark:bg-nature-stone-700/60':
          segmented,
        'gap-1': !segmented,
      })}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-${tab.id}-tab`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-${tab.id}-panel`}
            className={classnames(
              'min-h-11 min-w-0 truncate text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)]',
              segmented
                ? {
                    'flex-1 rounded-lg px-2': true,
                    'bg-white text-nature-stone-900 shadow-sm dark:bg-nature-stone-800 dark:text-nature-stone-50':
                      selected,
                    'text-nature-stone-600 dark:text-nature-stone-300':
                      !selected,
                  }
                : {
                    'rounded-lg border-b-2 px-2.5': true,
                    'border-[var(--accent-color)] text-nature-stone-900 dark:text-nature-stone-50':
                      selected,
                    'border-transparent text-nature-stone-500 dark:text-nature-stone-400':
                      !selected,
                  },
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

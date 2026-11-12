import classnames from 'classnames'
import { GAME_EDITION_TEXT } from '../../constants/strings'
import { ThemeSetting } from '../../lib/localStorage'
import { BaseModal } from './BaseModal'
import { SettingsToggle } from './SettingsToggle'

type Props = {
  isOpen: boolean
  handleClose: () => void
  isHardMode: boolean
  handleHardMode: (value: boolean) => void
  themeSetting: ThemeSetting
  handleThemeSetting: (value: ThemeSetting) => void
  isHighContrastMode: boolean
  handleHighContrastMode: (value: boolean) => void
}

const THEME_OPTIONS: [ThemeSetting, string][] = [
  ['system', 'System'],
  ['light', 'Hell'],
  ['dark', 'Dunkel'],
]

export const SettingsModal = ({
  isOpen,
  handleClose,
  isHardMode,
  handleHardMode,
  themeSetting,
  handleThemeSetting,
  isHighContrastMode,
  handleHighContrastMode,
}: Props) => {
  return (
    <BaseModal title="Einstellungen" isOpen={isOpen} handleClose={handleClose}>
      <div className="space-y-1">
        <SettingsToggle
          settingName="Schwerer Modus"
          flag={isHardMode}
          handleFlag={handleHardMode}
          description="Jeder Versuch muss die Hinweise der vorigen Runden berücksichtigen."
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <h2
            id="theme-setting-label"
            className="text-left font-medium text-nature-stone-700 dark:text-nature-stone-200"
          >
            Design
          </h2>
          <div
            role="radiogroup"
            aria-labelledby="theme-setting-label"
            className="flex shrink-0 rounded-xl bg-nature-stone-200 p-1 dark:bg-nature-stone-700"
          >
            {THEME_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={themeSetting === value}
                className={classnames(
                  'min-h-9 rounded-lg px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)]',
                  themeSetting === value
                    ? 'bg-white text-nature-stone-900 shadow-sm dark:bg-nature-stone-900 dark:text-nature-stone-50'
                    : 'text-nature-stone-600 dark:text-nature-stone-300',
                )}
                onClick={() => handleThemeSetting(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <SettingsToggle
          settingName="Hoher Kontrast"
          flag={isHighContrastMode}
          handleFlag={handleHighContrastMode}
          description="Farben für bessere Erkennbarkeit."
        />
      </div>
      <p className="mt-6 text-xs text-nature-stone-500 dark:text-nature-stone-400">
        {GAME_EDITION_TEXT}
      </p>
    </BaseModal>
  )
}

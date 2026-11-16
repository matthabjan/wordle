import classnames from 'classnames'
import { GAME_EDITION_TEXT } from '../../constants/strings'
import { PaletteSetting, ThemeSetting } from '../../lib/localStorage'
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
  paletteSetting: PaletteSetting
  handlePaletteSetting: (value: PaletteSetting) => void
}

const THEME_OPTIONS: [ThemeSetting, string][] = [
  ['system', 'System'],
  ['light', 'Hell'],
  ['dark', 'Dunkel'],
]

const PALETTE_OPTIONS: [PaletteSetting, string][] = [
  ['default', 'Standard'],
  ['lemon', 'Zitrone'],
  ['sunflower', 'Sonnenblume'],
]

type RadioGroupProps<T extends string> = {
  id: string
  label: string
  options: [T, string][]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  description?: string
}

const SettingsRadioGroup = <T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  disabled = false,
  description,
}: RadioGroupProps<T>) => (
  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
    <div className="text-left">
      <h2
        id={id}
        className="font-medium text-nature-stone-700 dark:text-nature-stone-200"
      >
        {label}
      </h2>
      {description && (
        <p className="text-xs text-nature-stone-500 dark:text-nature-stone-400">
          {description}
        </p>
      )}
    </div>
    <div
      role="radiogroup"
      aria-labelledby={id}
      aria-disabled={disabled || undefined}
      className={classnames(
        'flex shrink-0 rounded-xl bg-nature-stone-200 p-1 dark:bg-nature-stone-700',
        disabled && 'opacity-50',
      )}
    >
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          type="button"
          role="radio"
          aria-checked={value === optionValue}
          disabled={disabled}
          className={classnames(
            'min-h-9 rounded-lg px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] disabled:cursor-not-allowed',
            value === optionValue
              ? 'bg-white text-nature-stone-900 shadow-sm dark:bg-nature-stone-900 dark:text-nature-stone-50'
              : 'text-nature-stone-600 dark:text-nature-stone-300',
          )}
          onClick={() => onChange(optionValue)}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  </div>
)

export const SettingsModal = ({
  isOpen,
  handleClose,
  isHardMode,
  handleHardMode,
  themeSetting,
  handleThemeSetting,
  isHighContrastMode,
  handleHighContrastMode,
  paletteSetting,
  handlePaletteSetting,
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
        <SettingsRadioGroup
          id="theme-setting-label"
          label="Design"
          options={THEME_OPTIONS}
          value={themeSetting}
          onChange={handleThemeSetting}
        />
        <SettingsRadioGroup
          id="palette-setting-label"
          label="Farben"
          options={PALETTE_OPTIONS}
          value={paletteSetting}
          onChange={handlePaletteSetting}
          disabled={isHighContrastMode}
          description={
            isHighContrastMode ? 'Hoher Kontrast hat eigene Farben.' : undefined
          }
        />
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

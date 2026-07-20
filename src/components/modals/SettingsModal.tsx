import { BaseModal } from './BaseModal'
import { SettingsToggle } from './SettingsToggle'

type Props = {
  isOpen: boolean
  handleClose: () => void
  isHardMode: boolean
  handleHardMode: (value: boolean) => void
  isDarkMode: boolean
  handleDarkMode: (value: boolean) => void
  isHighContrastMode: boolean
  handleHighContrastMode: (value: boolean) => void
}

export const SettingsModal = ({
  isOpen,
  handleClose,
  isHardMode,
  handleHardMode,
  isDarkMode,
  handleDarkMode,
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
        <SettingsToggle
          settingName="Nachtmodus"
          flag={isDarkMode}
          handleFlag={handleDarkMode}
        />
        <SettingsToggle
          settingName="Hoher Kontrast"
          flag={isHighContrastMode}
          handleFlag={handleHighContrastMode}
          description="Farben für bessere Erkennbarkeit."
        />
      </div>
    </BaseModal>
  )
}

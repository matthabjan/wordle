import { BaseModal } from './BaseModal'
import { SettingsToggle } from './SettingsToggle'

type Props = {
  isOpen: boolean
  handleClose: () => void
  isHardMode: boolean
  handleHardMode: Function
  isDarkMode: boolean
  handleDarkMode: Function
  isHighContrastMode: boolean
  handleHighContrastMode: Function
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
      <div className="grid-cols-2 gap-4">
        <SettingsToggle
          settingName="Schwerer Modus"
          flag={isHardMode}
          handleFlag={handleHardMode}
        />
        <p className="text-sm text-left">
          Im schweren Modus muss jeder Versuch die Hinweise der vorigen Runden
          berücksichtigen.
        </p>
        <SettingsToggle
          settingName="Nachtmodus"
          flag={isDarkMode}
          handleFlag={handleDarkMode}
        />
        <SettingsToggle
          settingName="Hoher Kontrast"
          flag={isHighContrastMode}
          handleFlag={handleHighContrastMode}
        />
      </div>
    </BaseModal>
  )
}

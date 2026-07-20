import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ALERT_TIME_MS } from '../constants/settings'

type AlertStatus = 'success' | 'error' | undefined

type ShowOptions = {
  persist?: boolean
  delayMs?: number
  durationMs?: number
  onClose?: () => void
}

type AlertContextValue = {
  status: AlertStatus
  message: string | null
  isVisible: boolean
  showSuccess: (message: string, options?: ShowOptions) => void
  showError: (message: string, options?: ShowOptions) => void
}

export const AlertContext = createContext<AlertContextValue | null>(null)
AlertContext.displayName = 'AlertContext'

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider')
  }
  return context
}

type Props = {
  children?: ReactNode
}

export const AlertProvider = ({ children }: Props) => {
  const [status, setStatus] = useState<AlertStatus>('success')
  const [message, setMessage] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const show = useCallback(
    (showStatus: AlertStatus, newMessage: string, options?: ShowOptions) => {
      const {
        delayMs = 0,
        persist,
        onClose,
        durationMs = ALERT_TIME_MS,
      } = options || {}

      clearTimers()

      const showId = window.setTimeout(() => {
        setStatus(showStatus)
        setMessage(newMessage)
        setIsVisible(true)

        if (!persist) {
          const hideId = window.setTimeout(() => {
            setIsVisible(false)
            if (onClose) {
              onClose()
            }
          }, durationMs)
          timersRef.current.push(hideId)
        }
      }, delayMs)

      timersRef.current.push(showId)
    },
    [clearTimers],
  )

  const showError = useCallback(
    (newMessage: string, options?: ShowOptions) => {
      show('error', newMessage, options)
    },
    [show],
  )

  const showSuccess = useCallback(
    (newMessage: string, options?: ShowOptions) => {
      show('success', newMessage, options)
    },
    [show],
  )

  return (
    <AlertContext.Provider
      value={{
        status,
        message,
        isVisible,
        showError,
        showSuccess,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}

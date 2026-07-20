import { useEffect, useState } from 'react'
import { getWordOfDay, WordOfDay } from '../lib/words'

export const useWordOfDay = (): WordOfDay => {
  const [day, setDay] = useState<WordOfDay>(() => getWordOfDay())

  useEffect(() => {
    const msUntilTomorrow = Math.max(day.tomorrow - Date.now(), 0)

    const timeoutId = window.setTimeout(() => {
      setDay(getWordOfDay())
    }, msUntilTomorrow + 50)

    return () => window.clearTimeout(timeoutId)
  }, [day.tomorrow])

  return day
}

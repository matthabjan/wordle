import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const PARTICLE_COUNT = 14
const EMOJIS = ['🎉', '✨', '🎊', '⭐']

type Particle = {
  id: number
  x: number
  rotate: number
  emoji: string
  delay: number
}

const createParticles = (): Particle[] =>
  Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 240,
    rotate: (Math.random() - 0.5) * 180,
    emoji: EMOJIS[i % EMOJIS.length],
    delay: Math.random() * 0.15,
  }))

type Props = {
  trigger: boolean
}

export const WinCelebration = ({ trigger }: Props) => {
  const reduceMotion = useReducedMotion()
  const [particles, setParticles] = useState<Particle[]>([])
  const wasTriggeredRef = useRef(trigger)

  useEffect(() => {
    const justWon = trigger && !wasTriggeredRef.current
    wasTriggeredRef.current = trigger

    if (!justWon || reduceMotion) return

    setParticles(createParticles())
    const timeoutId = window.setTimeout(() => setParticles([]), 1400)
    return () => window.clearTimeout(timeoutId)
  }, [trigger, reduceMotion])

  if (reduceMotion || particles.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute text-2xl"
            initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: particle.x,
              y: -160 - Math.random() * 80,
              rotate: particle.rotate,
              scale: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.1,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          >
            {particle.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

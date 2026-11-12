import { Fragment } from 'react'
import { Transition } from '@headlessui/react'
import classNames from 'classnames'

type Props = {
  isOpen: boolean
  message: string
  variant?: 'success' | 'error' | 'info'
}

// Shown over the header for a moment: the one place with a plain background
// that is not needed while a message is read. Sits over open sheets too.
export const Alert = ({ isOpen, message, variant = 'error' }: Props) => {
  const classes = classNames(
    'flex min-h-[3.25rem] w-full max-w-[calc(var(--container-game)-2rem)] items-center justify-center rounded-2xl px-4 py-2 text-center text-base leading-snug font-semibold text-balance break-words shadow-toast',
    {
      'bg-[var(--danger-bg-color)] text-white': variant === 'error',
      'bg-[var(--accent-color)] text-white': variant === 'success',
      'bg-nature-stone-900 text-white dark:bg-nature-stone-50 dark:text-nature-stone-900':
        variant === 'info',
    },
  )

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-20 flex justify-center px-4">
      <Transition
        show={isOpen}
        as={Fragment}
        enter="ease-out duration-200 transition"
        enterFrom="opacity-0 -translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className={classes}
          role={variant === 'error' ? 'alert' : 'status'}
          aria-live={variant === 'error' ? 'assertive' : 'polite'}
        >
          {message}
        </div>
      </Transition>
    </div>
  )
}

import { Fragment } from 'react'
import { Transition } from '@headlessui/react'
import classNames from 'classnames'

type Props = {
  isOpen: boolean
  message: string
  variant?: 'success' | 'error'
}

export const Alert = ({ isOpen, message, variant = 'error' }: Props) => {
  const classes = classNames(
    'fixed z-20 top-[max(1.25rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[var(--container-game)] rounded-2xl shadow-soft-lg pointer-events-auto overflow-hidden text-white',
    {
      'bg-[var(--danger-bg-color)]': variant === 'error',
      'bg-[var(--accent-color)]': variant === 'success',
    },
  )

  return (
    <Transition
      show={isOpen}
      as={Fragment}
      enter="ease-out duration-300 transition"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={classes} role="alert" aria-live="assertive">
        <div className="px-4 py-3">
          <p className="text-center text-sm leading-snug font-medium text-balance break-words">
            {message}
          </p>
        </div>
      </div>
    </Transition>
  )
}

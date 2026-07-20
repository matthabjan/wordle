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
    'fixed z-20 top-[max(1.25rem,env(safe-area-inset-top))] left-1/2 transform -translate-x-1/2 max-w-sm w-[calc(100%-2rem)] shadow-soft-lg rounded-2xl pointer-events-auto overflow-hidden',
    {
      'bg-rose-500 text-white': variant === 'error',
      'bg-nature-emerald-600 text-white': variant === 'success',
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
        <div className="p-4">
          <p className="text-center text-sm font-medium">{message}</p>
        </div>
      </div>
    </Transition>
  )
}

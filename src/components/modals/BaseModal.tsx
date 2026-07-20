import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

type Props = {
  title: string
  children: React.ReactNode
  isOpen: boolean
  handleClose: () => void
}

export const BaseModal = ({ title, children, isOpen, handleClose }: Props) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={handleClose}
      >
        <div className="flex min-h-[100dvh] items-end justify-center px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center sm:items-center sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-nature-stone-900/50 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <span
            className="hidden sm:inline-block sm:h-[100dvh] sm:align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
          >
            <div className="relative inline-block w-full max-w-[var(--container-game)] transform overflow-hidden rounded-t-3xl border border-nature-stone-200 bg-nature-stone-50 px-5 pt-3 pb-6 text-left align-bottom shadow-soft-lg transition-all sm:my-8 sm:rounded-3xl sm:align-middle sm:p-6 dark:border-nature-stone-700 dark:bg-nature-stone-800">
              <div
                className="mx-auto mb-3 h-1 w-10 rounded-full bg-nature-stone-300 sm:hidden dark:bg-nature-stone-600"
                aria-hidden="true"
              />
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-nature-stone-600 transition hover:bg-nature-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:text-nature-stone-200 dark:hover:bg-nature-stone-700 dark:focus-visible:ring-offset-nature-stone-800"
                  aria-label="Schließen"
                  onClick={() => handleClose()}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="text-center">
                <Dialog.Title
                  as="h3"
                  className="font-display text-lg leading-6 font-semibold text-nature-stone-900 dark:text-nature-stone-50"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-3 text-sm text-nature-stone-700 dark:text-nature-stone-300">
                  {children}
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

import { Fragment, ReactNode, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

type Props = {
  title: string
  /** Shown in place of the visible title, e.g. tabs. The title stays as the dialog's accessible name. */
  header?: ReactNode
  children: ReactNode
  isOpen: boolean
  handleClose: () => void
}

// Bottom sheet: header and close button stay put, only the content scrolls.
export const BaseModal = ({
  title,
  header,
  children,
  isOpen,
  handleClose,
}: Props) => {
  // Focus the sheet itself on open, so no control shows a focus ring unasked.
  const panelRef = useRef<HTMLDivElement>(null)

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10"
        onClose={handleClose}
        initialFocus={panelRef}
      >
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

        <div className="pointer-events-none fixed inset-0 flex items-end justify-center px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
          >
            <div
              ref={panelRef}
              tabIndex={-1}
              className="pointer-events-auto relative flex max-h-full w-full max-w-[var(--container-game)] transform flex-col overflow-hidden rounded-3xl border border-nature-stone-200 bg-nature-stone-50 shadow-soft-lg transition-all focus:outline-none dark:border-nature-stone-700 dark:bg-nature-stone-800"
            >
              <div className="flex shrink-0 items-center gap-2 py-2 pr-2 pl-5">
                <div className="min-w-0 flex-1">
                  <Dialog.Title
                    as="h2"
                    className={
                      header
                        ? 'sr-only'
                        : 'truncate font-display text-lg leading-6 font-semibold text-nature-stone-900 dark:text-nature-stone-50'
                    }
                  >
                    {title}
                  </Dialog.Title>
                  {header}
                </div>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nature-stone-600 transition hover:bg-nature-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] dark:text-nature-stone-200 dark:hover:bg-nature-stone-700"
                  aria-label="Schließen"
                  onClick={() => handleClose()}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1 pb-6 text-center text-sm text-nature-stone-700 dark:text-nature-stone-300">
                {children}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

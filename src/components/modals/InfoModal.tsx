import { ReactNode } from 'react'
import { Cell } from '../grid/Cell'
import { BaseModal } from './BaseModal'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

const ExampleRow = ({ children }: { children: ReactNode }) => (
  <div className="mt-4 mb-1 flex justify-center" aria-hidden="true">
    {children}
  </div>
)

export const InfoModal = ({ isOpen, handleClose }: Props) => {
  return (
    <BaseModal
      title="So funktioniert es:"
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <p className="text-left">
        Errate das Wordle des Tages in 6 Versuchen. Nach jedem Versuch wird mit
        Farben angezeigt, wie nah dein Wort der Lösung war. Tippe auf einen
        Buchstaben in der aktuellen Zeile, um ihn direkt zu ändern.
      </p>

      <ExampleRow>
        <Cell compact value="A" />
        <Cell compact value="L" />
        <Cell compact value="L" />
        <Cell compact value="E" status="correct" isCompleted />
        <Cell compact value="S" />
      </ExampleRow>
      <p>Das E kommt im Wort an der richtigen Stelle vor.</p>

      <ExampleRow>
        <Cell compact value="L" status="present" isCompleted />
        <Cell compact value="A" />
        <Cell compact value="U" />
        <Cell compact value="C" />
        <Cell compact value="H" />
      </ExampleRow>
      <p>Das L kommt im Wort vor, jedoch an anderer Stelle.</p>

      <ExampleRow>
        <Cell compact value="O" />
        <Cell compact value="T" />
        <Cell compact value="T" />
        <Cell compact value="O" />
        <Cell compact value="S" status="absent" isCompleted />
      </ExampleRow>
      <p>Das S kommt nicht im Wort vor.</p>

      <p className="mt-4 text-left">
        Jeden Tag um Mitternacht wird ein neues Wordle freigeschaltet.
      </p>
    </BaseModal>
  )
}

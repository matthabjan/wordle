import { Cell } from '../grid/Cell'
import { BaseModal } from './BaseModal'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

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

      <div className="mt-4 mb-1 flex justify-center">
        <Cell value="A" />
        <Cell value="L" />
        <Cell value="L" />
        <Cell value="E" status="correct" isCompleted />
        <Cell value="S" />
      </div>
      <p>Das E kommt im Wort an der richtigen Stelle vor.</p>

      <div className="mt-4 mb-1 flex justify-center">
        <Cell value="L" status="present" isCompleted />
        <Cell value="A" />
        <Cell value="U" />
        <Cell value="C" />
        <Cell value="H" />
      </div>
      <p>Das L kommt im Wort vor, jedoch an anderer Stelle.</p>

      <div className="mt-4 mb-1 flex justify-center">
        <Cell value="O" />
        <Cell value="T" />
        <Cell value="T" />
        <Cell value="O" />
        <Cell value="S" status="absent" isCompleted />
      </div>
      <p>Das S kommt nicht im Wort vor.</p>

      <p className="mt-4 text-left">
        Jeden Tag um Mitternacht wird ein neues Wordle freigeschaltet.
      </p>
    </BaseModal>
  )
}

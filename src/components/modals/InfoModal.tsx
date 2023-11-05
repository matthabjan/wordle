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
      <p>
        Errate das Wordle des Tages in 6 Versuchen. Nach jedem Versuch wird
        mit Farben angezeigt, wie nah dein Wort der Lösung war:
      </p>

      <div className="flex justify-center mb-1 mt-4">
        <Cell value="A" />
        <Cell value="L" />
        <Cell value="L" />
        <Cell value="E" status="correct" />
        <Cell value="S" />
      </div>
      <p>Das E kommt im Wort an der richtigen Stelle vor.</p>

      <div className="flex justify-center mb-1 mt-4">
        <Cell value="L" status="present" />
        <Cell value="A" />
        <Cell value="U" />
        <Cell value="C" />
        <Cell value="H" />
      </div>
      <p>Das L kommt im Wort vor, jedoch an anderer Stelle.</p>

      <div className="flex justify-center mb-1 mt-4">
        <Cell value="O" />
        <Cell value="T" />
        <Cell value="T" />
        <Cell value="O" />
        <Cell value="S" status="absent" />
      </div>
      <p>Das S kommt nicht im Wort vor.</p>

      <p className="mt-4">
        Jeden Tag um Mitternacht wird ein neues Wordle freigeschaltet.
      </p>
      
    </BaseModal>
  )
}

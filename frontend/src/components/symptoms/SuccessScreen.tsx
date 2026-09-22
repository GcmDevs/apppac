import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

type SuccessScreenProps = {
  symptomName: string
  successMessage: string
  onManageAgain: () => void
}

export function SuccessScreen({
  symptomName,
  successMessage,
  onManageAgain,
}: SuccessScreenProps) {
  return (
    <section className="mood-feedback-card symptom-success-card">
      <p className="eyebrow">Registro completado</p>
      <span className="symptom-success-icon" aria-hidden="true">
        <CheckCircle2 size={30} />
      </span>
      <h2>Gracias por registrar tu síntoma</h2>
      <p className="mood-feedback-text">
        Tu información ha sido guardada correctamente.
      </p>
      <div className="summary-check-list">
        <div>
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{symptomName}</span>
        </div>
      </div>
      <p className="mood-support-copy">{successMessage}</p>
      <div className="feedback-actions">
        <button
          type="button"
          className="secondary-button mood-action-button"
          onClick={onManageAgain}
        >
          Registrar otro síntoma
        </button>
        <Link to="/inicio" className="primary-button mood-action-button">
          Volver al inicio
        </Link>
      </div>
    </section>
  )
}

import { Activity, Gauge, LoaderCircle } from 'lucide-react'

type SummaryCardProps = {
  symptomName: string
  severityLabel: string
  isSubmitting: boolean
  error: string | null
  onBack: () => void
  onConfirm: () => void
}

export function SummaryCard({
  symptomName,
  severityLabel,
  isSubmitting,
  error,
  onBack,
  onConfirm,
}: SummaryCardProps) {
  return (
    <section className="symptom-step-card" aria-busy={isSubmitting}>
      <button
        type="button"
        className="text-link step-back-link"
        disabled={isSubmitting}
        onClick={onBack}
      >
        Volver
      </button>
      <div className="section-heading">
        <p className="symptom-step-label">Paso 3 · Confirmación</p>
        <h2>Vas a registrar</h2>
        <p>Revisa este resumen antes de continuar con {symptomName}.</p>
      </div>

      <div className="summary-check-list">
        <div>
          <Activity size={18} aria-hidden="true" />
          <span>
            <small>Síntoma</small>
            {symptomName}
          </span>
        </div>
        <div>
          <Gauge size={18} aria-hidden="true" />
          <span>
            <small>Intensidad</small>
            {severityLabel}
          </span>
        </div>
      </div>

      {error ? (
        <p className="inline-message symptom-submit-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="feedback-actions">
        <button
          type="button"
          className="primary-button mood-action-button"
          disabled={isSubmitting}
          onClick={onConfirm}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="button-spinner" size={18} aria-hidden="true" />
              Guardando...
            </>
          ) : (
            'Registrar'
          )}
        </button>
        <button
          type="button"
          className="secondary-button mood-action-button"
          disabled={isSubmitting}
          onClick={onBack}
        >
          Ajustar respuestas
        </button>
      </div>
    </section>
  )
}

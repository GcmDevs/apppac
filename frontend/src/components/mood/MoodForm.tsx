import { FileLock2, Heart } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import homePortraitWoman from '@/assets/home-portrait-female.png'
import homePortraitMan from '@/assets/home-portrait-male.png'
import { influenceOptions } from '@/data/influence-options'
import { moodMessages } from '@/data/mood-messages'
import { moodOptions } from '@/data/mood-options'
import { getAuthSession, getCurrentPatient } from '@/lib/auth'
import {
  fetchTodayMoodRecord,
  registerMoodRecord,
} from '@/lib/mood-records'
import type { InfluenceValue, MoodRecord, MoodValue } from '@/types/mood'
import { ExistingMoodRecord } from './ExistingMoodRecord'
import { InfluenceOptionCard } from './InfluenceOptionCard'
import { MoodOptionCard } from './MoodOptionCard'
import { MoodSuccess } from './MoodSuccess'
import { MoodSummary } from './MoodSummary'
import { UnsavedChangesModal } from './UnsavedChangesModal'

type FormErrors = {
  mood?: string
  influence?: string
  otherInfluence?: string
  comment?: string
  submit?: string
}

const COMMENT_LIMIT = 500

export function MoodForm() {
  const patient = getCurrentPatient()
  const session = getAuthSession()
  const [mood, setMood] = useState<MoodValue | null>(null)
  const [influence, setInfluence] = useState<InfluenceValue | null>(null)
  const [otherInfluence, setOtherInfluence] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [savedRecord, setSavedRecord] = useState<MoodRecord | null>(null)
  const [existingRecord, setExistingRecord] = useState<MoodRecord | null>(null)
  const [isLoadingExistingRecord, setIsLoadingExistingRecord] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const illustration =
    session?.user.avatarVariant === 'male' ? homePortraitMan : homePortraitWoman

  useEffect(() => {
    let isMounted = true

    fetchTodayMoodRecord(patient.id)
      .then((record) => {
        if (isMounted) {
          setExistingRecord(record)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrors((current) => ({
            ...current,
            submit:
              error instanceof Error
                ? error.message
                : 'No pudimos consultar tu registro de hoy.',
          }))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingExistingRecord(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [patient.id])

  useEffect(() => {
    if (!showCancelModal) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCancelModal(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [showCancelModal])

  const isDirty = useMemo(
    () =>
      Boolean(mood) ||
      Boolean(influence) ||
      Boolean(otherInfluence.trim()) ||
      Boolean(comment.trim()),
    [comment, influence, mood, otherInfluence],
  )
  const currentStep = !mood ? 1 : !influence ? 2 : 3

  const handleCancel = () => {
    if (!isDirty) {
      resetForm()
      return
    }

    setShowCancelModal(true)
  }

  const handleConfirmCancel = () => {
    resetForm()
    setShowCancelModal(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}

    if (!mood) {
      nextErrors.mood = 'Selecciona un estado de ánimo para continuar.'
    }

    if (mood && !influence) {
      nextErrors.influence = 'Selecciona qué influye más en cómo te sientes hoy.'
    }

    if (influence === 'Otro' && !otherInfluence.trim()) {
      nextErrors.otherInfluence =
        'Cuéntanos qué está influyendo en cómo te sientes.'
    }

    if (comment.length > COMMENT_LIMIT) {
      nextErrors.comment = 'El comentario no puede superar los 500 caracteres.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !mood || !influence) {
      return
    }

    setIsSubmitting(true)

    try {
      const record = await registerMoodRecord({
        patientId: patient.id,
        mood,
        influence,
        otherInfluence,
        comment,
      })

      setSavedRecord(record)
      resetFormState()
    } catch (error) {
      setErrors((current) => ({
        ...current,
        submit:
          error instanceof Error
            ? error.message
            : 'No pudimos guardar el registro. Inténtalo nuevamente.',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (existingRecord) {
    return <ExistingMoodRecord record={existingRecord} />
  }

  if (isLoadingExistingRecord) {
    return (
      <section className="mood-feedback-card">
        <p className="eyebrow">Consultando</p>
        <h2>Estamos revisando tu registro de hoy</h2>
        <p className="mood-feedback-text">
          Un momento mientras cargamos tu información.
        </p>
      </section>
    )
  }

  if (savedRecord) {
    return (
      <MoodSuccess
        mood={savedRecord.mood}
        influence={
          savedRecord.influence === 'Otro' && savedRecord.otherInfluence
            ? `Otro: ${savedRecord.otherInfluence}`
            : savedRecord.influence
        }
        createdAt={savedRecord.createdAt}
        message={moodMessages[savedRecord.mood]}
      />
    )
  }

  return (
    <>
      <form className="mood-form" onSubmit={handleSubmit} noValidate>
        <div className="mood-form-progress" aria-label={`Paso ${currentStep} de 3`}>
          <div className="mood-form-progress-copy">
            <span>Registro de bienestar</span>
            <strong>Paso {currentStep} de 3</strong>
          </div>
          <div className="mood-form-progress-track" aria-hidden="true">
            <span className="is-complete" />
            <span className={currentStep >= 2 ? 'is-complete' : ''} />
            <span className={currentStep === 3 ? 'is-complete' : ''} />
          </div>
        </div>

        <section className="mood-section mood-stage-card mood-stage-card-intro">
          <div className="mood-stage-hero">
            <div className="section-heading mood-stage-heading">
              <p className="mood-step-label">Paso 1 · Estado de ánimo</p>
              <h3>¿Cómo te sientes hoy?</h3>
              <p>
                Cuéntanos cómo te has sentido para poder acompañarte mejor.
              </p>
            </div>
            <div className="mood-stage-illustration" aria-hidden="true">
              <img src={illustration} alt="" className="mood-stage-portrait" />
            </div>
          </div>

          <div className="mood-stage-intro">
            <span className="mood-stage-intro-icon" aria-hidden="true">
              <Heart size={18} />
            </span>
            <div>
              <strong>Selecciona tu estado de ánimo</strong>
              <p>Elige la opción que mejor represente cómo te sientes en este momento.</p>
            </div>
          </div>

          <div className="mood-options-grid" role="group" aria-label="Estados de animo disponibles">
            {moodOptions.map((option) => (
              <MoodOptionCard
                key={option.value}
                face={option.face}
                label={option.value}
                helper={option.helper}
                selected={mood === option.value}
                onSelect={() => {
                  setMood((current) => (current === option.value ? null : option.value))
                  setErrors((current) => ({ ...current, mood: undefined }))
                }}
              />
            ))}
          </div>
          {errors.mood ? <p className="field-error" role="alert">{errors.mood}</p> : null}

          <section className="mood-support-banner" aria-label="Apoyo emocional">
            <span className="mood-support-icon" aria-hidden="true">
              <Heart size={18} />
            </span>
            <div>
              <strong>No estás solo(a)</strong>
              <p>Cada emoción es válida. Estamos aquí para apoyarte.</p>
            </div>
          </section>
        </section>

        {mood ? (
          <section className="mood-section mood-stage-card mood-stage-card-detail mood-section-visible">
            <div className="section-heading mood-stage-heading">
              <p className="mood-step-label">Paso 2 · Lo que te acompaña</p>
              <h3>¿Qué influye más en cómo te sientes?</h3>
              <p>Selecciona una sola opción por ahora.</p>
            </div>
            <div className="influence-options-grid" role="group" aria-label="Factores que influyen en el estado de ánimo">
              {influenceOptions.map((option) => (
                <InfluenceOptionCard
                  key={option}
                  label={option}
                  selected={influence === option}
                  onSelect={() => {
                    setInfluence((current) => (current === option ? null : option))
                    if (influence === option) {
                      setOtherInfluence('')
                    }
                    setErrors((current) => ({
                      ...current,
                      influence: undefined,
                      otherInfluence: undefined,
                    }))
                  }}
                />
              ))}
            </div>
            {errors.influence ? (
              <p className="field-error" role="alert">{errors.influence}</p>
            ) : null}

            {influence === 'Otro' ? (
              <div className="field-group mood-field-group">
                <label htmlFor="otherInfluence">
                  Cuéntanos qué está influyendo en cómo te sientes
                </label>
                <div className="input-frame mood-text-input">
                  <input
                    id="otherInfluence"
                    name="otherInfluence"
                    type="text"
                    value={otherInfluence}
                    onChange={(event) => setOtherInfluence(event.target.value)}
                    aria-invalid={Boolean(errors.otherInfluence)}
                  />
                </div>
                {errors.otherInfluence ? (
                  <p className="field-error" role="alert">{errors.otherInfluence}</p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="mood-next-step-preview" aria-label="Siguiente paso">
            <span aria-hidden="true">2</span>
            <div>
              <strong>Lo que influye en ti</strong>
              <p>Se habilitará cuando elijas cómo te sientes.</p>
            </div>
          </section>
        )}

        {mood && influence ? (
          <>
            <section className="mood-section mood-stage-card mood-stage-card-note">
              <div className="section-heading mood-stage-heading">
                <p className="mood-step-label">Paso 3 · Si quieres, cuéntanos más</p>
                <h3>¿Hay algo más que quieras compartir?</h3>
                <p>Este campo es opcional.</p>
              </div>
              <div className="field-group mood-field-group">
                <label htmlFor="moodComment">Comentario adicional</label>
                <textarea
                  id="moodComment"
                  name="moodComment"
                  className="mood-textarea"
                  maxLength={COMMENT_LIMIT}
                  value={comment}
                  onChange={(event) => {
                    setComment(event.target.value)
                    setErrors((current) => ({ ...current, comment: undefined }))
                  }}
                  aria-describedby="mood-comment-help"
                />
                <div className="textarea-meta" id="mood-comment-help">
                  <span>Este campo es opcional</span>
                  <span>{comment.length}/{COMMENT_LIMIT}</span>
                </div>
                {errors.comment ? (
                  <p className="field-error" role="alert">{errors.comment}</p>
                ) : null}
              </div>
            </section>

            <section className="mood-privacy-card">
              <span className="mood-privacy-icon" aria-hidden="true">
                <FileLock2 size={18} />
              </span>
              <div>
                <strong>Tu información es confidencial</strong>
                <p>Todo lo que compartes es privado y está protegido.</p>
              </div>
            </section>
          </>
        ) : null}

        {mood && influence ? (
          <MoodSummary
            mood={mood}
            influence={influence}
            otherInfluence={otherInfluence}
            comment={comment}
          />
        ) : null}

        <div className="form-actions">
          {errors.submit ? (
            <p className="field-error">{errors.submit}</p>
          ) : null}
          <button
            type="submit"
            className="primary-button mood-action-button"
            disabled={isSubmitting || !mood || !influence}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar mi registro'}
          </button>
          <button
            type="button"
            className="secondary-button mood-action-button"
            onClick={handleCancel}
          >
            Cancelar
          </button>
        </div>
      </form>

      <UnsavedChangesModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </>
  )

  function resetForm() {
    resetFormState()
    setErrors({})
  }

  function resetFormState() {
    setMood(null)
    setInfluence(null)
    setOtherInfluence('')
    setComment('')
  }
}

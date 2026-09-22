import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BodyMap } from '@/components/symptoms/BodyMap'
import { QuickAccessCard } from '@/components/symptoms/QuickAccessCard'
import { SeveritySelector } from '@/components/symptoms/SeveritySelector'
import { SummaryCard } from '@/components/symptoms/SummaryCard'
import { SymptomBottomSheet } from '@/components/symptoms/SymptomBottomSheet'
import { SymptomSearch } from '@/components/symptoms/SymptomSearch'
import { SuccessScreen } from '@/components/symptoms/SuccessScreen'
import { BODY_REGION_CODES } from '@/data/bodyRegions'
import { quickAccesses } from '@/data/quickAccesses'
import { getCurrentPatient, getAuthSession } from '@/lib/auth'
import { fetchSymptomCatalog } from '@/lib/symptom-catalog'
import {
  registerSymptomRecord,
  saveSymptomRecord,
} from '@/lib/symptom-records'
import type {
  BodyRegionId,
  QuickAccessCode,
  SymptomDefinition,
  SymptomRecord,
} from '@/types/symptoms'

type FlowStep = 'select-region' | 'search' | 'severity' | 'summary' | 'success'

export function SymptomsPage() {
  const navigate = useNavigate()
  const patient = getCurrentPatient()
  const session = getAuthSession()
  const [symptoms, setSymptoms] = useState<SymptomDefinition[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [sheetRegionId, setSheetRegionId] = useState<BodyRegionId | null>(null)
  const [sheetQuickAccessCode, setSheetQuickAccessCode] = useState<QuickAccessCode | null>(null)
  const [activeRegionId, setActiveRegionId] = useState<BodyRegionId | null>(null)
  const [activeQuickAccessCode, setActiveQuickAccessCode] = useState<QuickAccessCode | null>(null)
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomDefinition | null>(null)
  const [selectedSeverityId, setSelectedSeverityId] = useState<number | null>(null)
  const [flowStep, setFlowStep] = useState<FlowStep>('select-region')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedRecord, setSavedRecord] = useState<SymptomRecord | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchSymptomCatalog(controller.signal)
      .then(catalogSymptoms => {
        if (!controller.signal.aborted) {
          setSymptoms(catalogSymptoms)
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setCatalogError(getCatalogErrorMessage(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsCatalogLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  const regionSymptoms = useMemo(() => {
    if (!sheetRegionId) {
      return [] as SymptomDefinition[]
    }

    const regionCode = BODY_REGION_CODES[sheetRegionId]
    return symptoms.filter(symptom => symptom.regionCode === regionCode)
  }, [sheetRegionId, symptoms])

  const searchableSymptoms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return symptoms
    }

    return symptoms.filter(symptom => {
      const haystack = `${symptom.name} ${symptom.regionName}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [searchQuery, symptoms])

  const quickAccessSymptoms = useMemo(() => {
    if (!sheetQuickAccessCode) {
      return [] as SymptomDefinition[]
    }

    return symptoms.filter(symptom =>
      symptom.quickAccessCodes.includes(sheetQuickAccessCode),
    )
  }, [sheetQuickAccessCode, symptoms])

  const activeSeverityOptions = selectedSymptom?.intensities ?? []
  const selectedSeverity = activeSeverityOptions.find(
    option => option.id === selectedSeverityId,
  )
  const canMoveToSummary = selectedSymptom !== null && selectedSeverity !== undefined
  const catalogIsEmpty = !isCatalogLoading && !catalogError && symptoms.length === 0
  const catalogIsAvailable = !isCatalogLoading && !catalogError && symptoms.length > 0
  const usesFocusCanvas = flowStep !== 'search'
  const overlayStep =
    flowStep === 'severity' || flowStep === 'summary' || flowStep === 'success'
  const visibleRegionSelection = sheetRegionId ?? null

  return (
    <main
      className={
        usesFocusCanvas
          ? 'page-shell symptom-page symptom-page-select'
          : 'page-shell symptom-page'
      }
    >
      {usesFocusCanvas ? (
        <section className="symptom-step-card symptom-step-grid symptom-step-card-compact">
          <div className="symptom-focus-topbar">
            <button
              type="button"
              className="symptom-back-button"
              onClick={() => navigate('/inicio')}
              aria-label="Volver al inicio"
            >
              <ArrowLeft size={18} />
              <span>Volver</span>
            </button>
          </div>

          <div className="symptom-selection-header">
            <div className="symptom-flow-progress" aria-label="Paso 1 de 3: ubicar la molestia">
              <div>
                <span>Registro de síntomas</span>
                <strong>Paso 1 de 3</strong>
              </div>
              <span className="symptom-flow-progress-track" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="section-heading symptom-selection-heading">
              <p className="symptom-step-label">Ubica la molestia</p>
              <h2>¿Dónde sientes la molestia?</h2>
              <p>Elige una zona del cuerpo o usa un acceso rápido para encontrar el síntoma.</p>
            </div>
          </div>

          {isCatalogLoading ? (
            <CatalogStatus
              title="Cargando síntomas"
              description="Estamos consultando las opciones disponibles."
              loading
            />
          ) : null}

          {catalogError ? (
            <CatalogStatus
              title="No pudimos cargar los síntomas"
              description={catalogError}
              onRetry={() => void retryCatalog()}
            />
          ) : null}

          {catalogIsEmpty ? (
            <CatalogStatus
              title="No hay síntomas configurados"
              description="Intenta nuevamente o comunícate con el equipo de atención."
              onRetry={() => void retryCatalog()}
            />
          ) : null}

          <section className="symptom-select-panel">
            <BodyMap
              avatarVariant={session?.user.avatarVariant ?? 'female'}
              selectedRegionId={visibleRegionSelection}
              disabled={!catalogIsAvailable}
              onSelectRegion={(regionId) => {
                setActiveRegionId(regionId)
                setActiveQuickAccessCode(null)
                setSheetQuickAccessCode(null)
                setSheetRegionId(regionId)
              }}
            />
          </section>

          <section className="symptom-group-card symptom-group-card-flat">
            <div className="symptom-quick-access-heading">
              <div>
                <p className="symptom-step-label">Accesos rápidos</p>
                <h3>Empieza por lo que sientes</h3>
              </div>
              <span>También puedes elegir una categoría.</span>
            </div>
            <div className="quick-access-grid" aria-label="Accesos rápidos de síntomas">
              {quickAccesses.map(item => (
                <QuickAccessCard
                  key={item.code}
                  item={item}
                  disabled={!catalogIsAvailable}
                  onSelect={() => {
                    setActiveRegionId(null)
                    setActiveQuickAccessCode(item.code)
                    setSheetRegionId(null)
                    setSheetQuickAccessCode(item.code)
                  }}
                />
              ))}
            </div>
          </section>

          <section className="symptom-search-row">
            <button
              type="button"
              className="search-launch-card"
              disabled={!catalogIsAvailable}
              onClick={() => {
                setActiveRegionId(null)
                setActiveQuickAccessCode(null)
                setSheetRegionId(null)
                setSheetQuickAccessCode(null)
                setFlowStep('search')
              }}
            >
              <span className="search-launch-icon" aria-hidden="true">
                <Search size={18} />
              </span>
              <div>
                <strong>Buscar otro síntoma</strong>
                <span>Escribe una palabra para encontrarlo.</span>
              </div>
            </button>
          </section>
        </section>
      ) : null}

      {flowStep === 'search' ? (
        <SymptomSearch
          query={searchQuery}
          results={searchableSymptoms}
          onChangeQuery={setSearchQuery}
          onBack={() => setFlowStep('select-region')}
          onSelectSymptom={chooseSymptom}
        />
      ) : null}

      <SymptomBottomSheet
        open={sheetRegionId !== null || sheetQuickAccessCode !== null}
        title="Elige el síntoma que estás experimentando"
        symptoms={sheetRegionId ? regionSymptoms : quickAccessSymptoms}
        onClose={() => {
          setSheetRegionId(null)
          setSheetQuickAccessCode(null)
        }}
        onSelectSymptom={(symptom) => {
          setSheetRegionId(null)
          setSheetQuickAccessCode(null)
          chooseSymptom(symptom)
        }}
      />

      {overlayStep ? (
        <div className="bottom-sheet-layer symptom-flow-layer" role="presentation">
          <div
            className="bottom-sheet-backdrop symptom-flow-backdrop"
            onClick={() => {
              if (flowStep === 'severity') {
                reopenSymptomPicker()
              }
            }}
          />
          <section
            className="bottom-sheet symptom-flow-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Registro de síntomas"
          >
            <div className="sheet-drag-handle" aria-hidden="true">
              <span />
            </div>

            {flowStep === 'severity' && selectedSymptom ? (
              <SeveritySelector
                symptomName={selectedSymptom.name}
                options={activeSeverityOptions}
                selectedId={selectedSeverityId}
                onBack={() => {
                  setSelectedSeverityId(null)
                  setRegisterError(null)
                  reopenSymptomPicker()
                }}
                onSelect={(optionId) => {
                  setSelectedSeverityId(optionId)
                  setRegisterError(null)
                  setFlowStep('summary')
                }}
              />
            ) : null}

            {flowStep === 'summary' && selectedSymptom && selectedSeverity && canMoveToSummary ? (
              <SummaryCard
                symptomName={selectedSymptom.name}
                severityLabel={selectedSeverity.summaryLabel}
                isSubmitting={isRegistering}
                error={registerError}
                onBack={() => {
                  setRegisterError(null)
                  setFlowStep('severity')
                }}
                onConfirm={() => void confirmSymptomRecord()}
              />
            ) : null}

            {flowStep === 'success' && selectedSymptom && savedRecord ? (
              <SuccessScreen
                symptomName={`${selectedSymptom.name}: ${savedRecord.severityLabel}`}
                successMessage="Gracias por registrar tu sintoma. Ya quedo guardado."
                onManageAgain={() => {
                  setSelectedSymptom(null)
                  setSelectedSeverityId(null)
                  setSavedRecord(null)
                  setRegisterError(null)
                  setActiveRegionId(null)
                  setActiveQuickAccessCode(null)
                  setSheetRegionId(null)
                  setSheetQuickAccessCode(null)
                  setFlowStep('select-region')
                }}
              />
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  )

  function chooseSymptom(symptom: SymptomDefinition) {
    setSheetRegionId(null)
    setSheetQuickAccessCode(null)
    setSelectedSymptom(symptom)
    setSelectedSeverityId(null)
    setSavedRecord(null)
    setRegisterError(null)
    setFlowStep('severity')
  }

  async function retryCatalog() {
    setIsCatalogLoading(true)
    setCatalogError(null)

    try {
      setSymptoms(await fetchSymptomCatalog())
    } catch (error) {
      setCatalogError(getCatalogErrorMessage(error))
    } finally {
      setIsCatalogLoading(false)
    }
  }

  function reopenSymptomPicker() {
    setFlowStep('select-region')
    setSelectedSymptom(null)
    setSelectedSeverityId(null)
    setSavedRecord(null)
    setRegisterError(null)
    setSheetRegionId(activeRegionId)
    setSheetQuickAccessCode(activeQuickAccessCode)
  }

  async function confirmSymptomRecord() {
    if (!selectedSymptom || !selectedSeverity || isRegistering) {
      return
    }

    setIsRegistering(true)
    setRegisterError(null)

    try {
      const savedBackendRecord = await registerSymptomRecord({
        regionCorporalCode: selectedSymptom.regionCode,
        sintomaId: selectedSymptom.id,
        intensidadId: selectedSeverity.id,
      })
      const record: SymptomRecord = {
        id: String(savedBackendRecord.id),
        patientId: patient.id,
        symptomId: selectedSymptom.id,
        symptomName: selectedSymptom.name,
        regionId: selectedSymptom.regionId,
        regionCode: selectedSymptom.regionCode,
        severityId: selectedSeverity.id,
        severityLabel: selectedSeverity.summaryLabel,
        severityLevel: selectedSeverity.severityLevel,
        answers: {},
        createdAt: savedBackendRecord.createdAt,
      }

      try {
        saveSymptomRecord(record)
      } catch {
        // The backend record is authoritative; a local cache failure must not report a false save error.
      }
      setSavedRecord(record)
      setFlowStep('success')
    } catch (error) {
      setRegisterError(getRegisterErrorMessage(error))
    } finally {
      setIsRegistering(false)
    }
  }
}

function getCatalogErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No pudimos cargar el catálogo de síntomas.'
}

function getRegisterErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No pudimos guardar el síntoma. Inténtalo nuevamente.'
}

type CatalogStatusProps = {
  title: string
  description: string
  loading?: boolean
  onRetry?: () => void
}

function CatalogStatus({ title, description, loading = false, onRetry }: CatalogStatusProps) {
  return (
    <div
      className="symptom-catalog-status"
      role={loading ? 'status' : 'alert'}
      aria-live={loading ? 'polite' : 'assertive'}
    >
      <span className={loading ? 'symptom-catalog-status-icon is-loading' : 'symptom-catalog-status-icon'}>
        {loading ? <LoaderCircle size={20} /> : <RefreshCw size={20} />}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {onRetry ? (
        <button type="button" className="secondary-button" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

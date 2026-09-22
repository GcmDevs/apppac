import { Search } from 'lucide-react'
import type { SymptomDefinition } from '@/types/symptoms'

type SymptomSearchProps = {
  query: string
  results: SymptomDefinition[]
  onChangeQuery: (value: string) => void
  onBack: () => void
  onSelectSymptom: (symptom: SymptomDefinition) => void
}

export function SymptomSearch({
  query,
  results,
  onChangeQuery,
  onBack,
  onSelectSymptom,
}: SymptomSearchProps) {
  return (
    <section className="symptom-step-card">
      <button type="button" className="text-link step-back-link" onClick={onBack}>
        Volver
      </button>
      <div className="section-heading">
        <p className="symptom-step-label">Busca un síntoma</p>
        <h2>¿Qué estás experimentando?</h2>
        <p>Escribe una palabra sencilla y te mostraremos opciones relacionadas.</p>
      </div>

      <label className="search-field" htmlFor="symptomSearch">
        <Search size={18} aria-hidden="true" />
        <input
          id="symptomSearch"
          type="search"
          placeholder="Buscar síntomas"
          value={query}
          onChange={(event) => onChangeQuery(event.target.value)}
        />
      </label>

      <div className="search-results-list">
        {results.map((symptom) => (
          <button
            key={symptom.id}
            type="button"
            className="search-result-card"
            onClick={() => onSelectSymptom(symptom)}
          >
            <strong>{symptom.name}</strong>
            <span>Relacionado con {symptom.regionName}</span>
          </button>
        ))}
        {results.length === 0 ? (
          <div className="empty-search-state">
            <strong>No encontramos coincidencias todavía.</strong>
            <p>Prueba con una palabra corta como tos, dolor o náusea.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

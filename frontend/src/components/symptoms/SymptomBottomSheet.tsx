import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity } from 'lucide-react'
import type { SymptomDefinition } from '@/types/symptoms'

type SymptomBottomSheetProps = {
  open: boolean
  title: string
  symptoms: SymptomDefinition[]
  onClose: () => void
  onSelectSymptom: (symptom: SymptomDefinition) => void
}

export function SymptomBottomSheet({
  open,
  title,
  symptoms,
  onClose,
  onSelectSymptom,
}: SymptomBottomSheetProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startYRef = useRef<number | null>(null)
  const transitionStyle = useMemo(
    () => ({
      transform: open
        ? `translateY(${dragOffset}px)`
        : 'translateY(100%)',
      transition: dragging ? 'none' : 'transform 0.22s ease',
    }),
    [dragOffset, dragging, open],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="bottom-sheet-layer" role="presentation">
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <section
        className="bottom-sheet"
        style={transitionStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="symptom-sheet-title"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('.sheet-drag-handle')) {
            startYRef.current = event.clientY
            setDragging(true)
          }
        }}
        onPointerMove={(event) => {
          if (startYRef.current === null) {
            return
          }

          const nextOffset = Math.max(0, event.clientY - startYRef.current)
          setDragOffset(nextOffset)
        }}
        onPointerUp={() => {
          if (dragOffset > 120) {
            setDragOffset(0)
            onClose()
            startYRef.current = null
            setDragging(false)
            return
          }
          startYRef.current = null
          setDragging(false)
          setDragOffset(0)
        }}
        onPointerCancel={() => {
          startYRef.current = null
          setDragging(false)
          setDragOffset(0)
        }}
      >
        <div className="sheet-drag-handle" aria-hidden="true">
          <span />
        </div>
        <div className="bottom-sheet-header">
          <p className="eyebrow">Selección guiada</p>
          <h2 id="symptom-sheet-title">{title}</h2>
          <p>Elige una opción para continuar con la intensidad.</p>
        </div>
        <div className="sheet-symptom-grid">
          {symptoms.map((symptom) => (
            <button
              key={symptom.id}
              type="button"
              className="sheet-symptom-card"
              onClick={() => onSelectSymptom(symptom)}
            >
              <span className="sheet-symptom-icon" aria-hidden="true">
                <Activity size={20} />
              </span>
              <strong>{symptom.name}</strong>
            </button>
          ))}
          {symptoms.length === 0 ? (
            <div className="empty-search-state" role="status">
              <strong>No hay síntomas configurados para esta selección.</strong>
              <p>Selecciona otra opción o intenta más tarde.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

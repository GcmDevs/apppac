import {
  ArrowRight,
  CalendarDays,
  HeartPulse,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentPatient } from '@/lib/auth';
import { fetchMoodHistory } from '@/lib/mood-records';
import type { MoodRecord } from '@/types/mood';

export function HistoryPage() {
  const patient = useMemo(() => getCurrentPatient(), []);
  const [records, setRecords] = useState<MoodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMoodHistory(patient.id)
      .then(history => {
        if (isMounted) {
          setRecords(history);
        }
      })
      .catch(fetchError => {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'No pudimos consultar tu historial.'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [patient.id]);

  return (
    <main className="page-shell history-page">
      <section className="module-hero history-hero">
        <div className="history-hero-icon">
          <HeartPulse size={26} aria-hidden="true" />
        </div>
        <div className="module-hero-copy">
          <p className="eyebrow">Seguimiento emocional</p>
          <h2>Tu historial de ánimo</h2>
          <p>Consulta los estados de ánimo que has reportado durante tu proceso.</p>
        </div>
        <Link to="/estado-animo" className="history-hero-action">
          <Sparkles size={17} aria-hidden="true" />
          Registrar hoy
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      {isLoading ? (
        <section className="mood-feedback-card history-status-card">
          <p className="eyebrow">Consultando</p>
          <h2>Cargando tu historial</h2>
          <p className="mood-feedback-text">Estamos revisando tus registros guardados.</p>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section className="mood-feedback-card history-status-card">
          <p className="eyebrow">No disponible</p>
          <h2>No pudimos cargar tu historial</h2>
          <p className="mood-feedback-text">{error}</p>
        </section>
      ) : null}

      {!isLoading && !error && records.length === 0 ? (
        <section className="mood-feedback-card history-status-card">
          <p className="eyebrow">Sin registros</p>
          <h2>Aún no tienes reportes guardados</h2>
          <p className="mood-feedback-text">
            Cuando registres cómo te sientes, tus reportes aparecerán aquí.
          </p>
          <Link to="/estado-animo" className="primary-button mood-action-button">
            Registrar estado de ánimo
          </Link>
        </section>
      ) : null}

      {!isLoading && !error && records.length > 0 ? (
        <section className="history-results">
          <header className="history-results-heading">
            <div>
              <p className="eyebrow">Tus registros</p>
              <h3>Estados de ánimo reportados</h3>
            </div>
            <span className="history-record-count">
              {records.length} {records.length === 1 ? 'registro' : 'registros'}
            </span>
          </header>
          <div className="history-list" aria-label="Historial de estados de ánimo">
          {records.map(record => (
            <article className="history-record" key={record.id}>
              <span className="history-timeline-dot" aria-hidden="true" />
              <div className="history-record-topline">
                <div className="history-record-date">
                  <CalendarDays size={18} aria-hidden="true" />
                  <time dateTime={record.createdAt}>{formatDate(record.createdAt)}</time>
                </div>
                <span className="history-record-badge">Ánimo</span>
              </div>

              <div className="history-record-main">
                <strong>{record.mood}</strong>
                <span>{resolveInfluence(record)}</span>
              </div>

              {record.comment ? (
                <p className="history-record-comment">
                  <MessageSquareText size={16} aria-hidden="true" />
                  <span>{record.comment}</span>
                </p>
              ) : null}
            </article>
          ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function resolveInfluence(record: MoodRecord) {
  if (record.influence === 'Otro' && record.otherInfluence) {
    return `Otro: ${record.otherInfluence}`;
  }

  return record.influence;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

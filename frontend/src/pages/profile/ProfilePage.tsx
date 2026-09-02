import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CalendarDays,
  CircleAlert,
  IdCard,
  MapPinned,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { fetchPatientProfile, type PatientProfile } from '@/lib/patient-profile';
import { ContentSkeleton } from '@/components/feedback/ContentSkeleton';

const NOT_AVAILABLE = 'No disponible';

export function ProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchPatientProfile(controller.signal)
      .then(setProfile)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'No pudimos cargar el perfil.');
      });

    return () => controller.abort();
  }, []);

  if (error) {
    return <ProfileMessage title="No pudimos cargar tu perfil" message={error} />;
  }

  if (!profile) {
    return (
      <main className="page-shell profile-page-redesign" aria-busy="true">
        <section className="profile-hero profile-hero-redesign">
          <ContentSkeleton lines={3} className="profile-skeleton" />
        </section>
        <div className="profile-grid profile-grid-redesign">
          <ContentSkeleton lines={4} className="profile-skeleton" />
          <ContentSkeleton lines={3} className="profile-skeleton" />
          <ContentSkeleton lines={3} className="profile-skeleton" />
        </div>
      </main>
    );
  }

  const personalData = [
    ['Tipo de documento', profile.tipoDocumento ?? NOT_AVAILABLE, IdCard],
    ['Numero de documento', profile.identificacion, IdCard],
    ['Nombre completo', profile.nombrePaciente, UserRound],
    ['Edad', `${profile.edad} ${profile.unidadEdad.toLowerCase()}`, CalendarDays],
  ] as const;
  const residenceData = [
    ['Municipio', profile.municipioResidencia ?? NOT_AVAILABLE, MapPinned],
    ['Departamento', profile.departamentoResidencia ?? NOT_AVAILABLE, MapPinned],
  ] as const;
  const careData = [
    ['Ingreso', profile.ingreso ? String(profile.ingreso) : NOT_AVAILABLE, IdCard],
    ['Fecha de ingreso', formatDate(profile.fechaIngreso), CalendarDays],
    ['Sede', profile.sede ?? NOT_AVAILABLE, Building2],
  ] as const;

  return (
    <main className="page-shell profile-page-redesign">
      <section className="profile-hero profile-hero-redesign">
        <div className="profile-hero-main profile-hero-main-redesign">
          <div className="profile-avatar profile-avatar-redesign">{getInitials(profile.nombrePaciente)}</div>
          <div className="profile-hero-copy-redesign">
            <p className="eyebrow">Perfil del paciente</p>
            <h2>{profile.nombrePaciente}</h2>
            <div className="profile-meta profile-meta-pills">
              <span>Paciente</span>
              <span>{profile.sede ?? 'Sede no registrada'}</span>
            </div>
          </div>
        </div>

        <div className="profile-hero-highlights">
          <ProfileHighlight icon={CalendarDays} label="Fecha de nacimiento" value={formatDate(profile.fechaNacimiento)} />
          <ProfileHighlight icon={UserRound} label="Sexo" value={profile.sexo === 'M' ? 'Masculino' : profile.sexo === 'F' ? 'Femenino' : NOT_AVAILABLE} />
          <ProfileHighlight icon={CalendarDays} label="Edad" value={`${profile.edad} ${profile.unidadEdad.toLowerCase()}`} />
        </div>
      </section>

      <div className="profile-grid profile-grid-redesign">
        <ProfileSection icon={UserRound} title="Datos personales" items={personalData} />
        <ProfileSection icon={MapPinned} title="Lugar de residencia" items={residenceData} />
        <ProfileSection icon={Building2} title="Datos de atención" items={careData} />

        <section className="profile-note profile-note-redesign">
          <div className="profile-note-illustration" aria-hidden="true">
            <div className="card-icon emergency-icon"><CircleAlert size={20} /></div>
          </div>
          <div>
            <h3>Información importante</h3>
            <p>Para actualizar tus datos personales o de contacto, comunícate directamente con tu institución.</p>
            <div className="profile-note-callout">
              <strong>¿Necesitas ayuda?</strong>
              <span>Comunícate con tu institución para recibir asistencia.</span>
            </div>
          </div>
        </section>
      </div>

      <section className="profile-security-banner">
        <div className="card-icon"><ShieldCheck size={18} aria-hidden="true" /></div>
        <div>
          <strong>Tu información está protegida</strong>
          <p>En Eklipse Paciente cuidamos la privacidad y seguridad de tus datos.</p>
        </div>
      </section>
    </main>
  );
}

function ProfileMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="page-shell profile-page-redesign">
      <section className="profile-note profile-note-redesign">
        <div><h2>{title}</h2><p>{message}</p></div>
      </section>
    </main>
  );
}

function ProfileHighlight({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="profile-highlight-item">
      <Icon size={16} />
      <div><strong>{label}</strong><span>{value}</span></div>
    </div>
  );
}

type ProfileSectionProps = {
  icon: LucideIcon;
  title: string;
  items: readonly (readonly [string, string, LucideIcon])[];
};

function ProfileSection({ icon: Icon, title, items }: ProfileSectionProps) {
  return (
    <section className="profile-section profile-section-redesign">
      <header className="profile-section-header">
        <div className="card-icon"><Icon size={18} aria-hidden="true" /></div>
        <div><h3>{title}</h3><p>Consulta tu información registrada actualmente.</p></div>
      </header>
      <dl className="profile-data-list">
        {items.map(([label, value, ItemIcon]) => (
          <div key={label} className="profile-data-row">
            <dt><span className="profile-data-icon" aria-hidden="true"><ItemIcon size={14} /></span>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'EP';
}

function formatDate(value: string | null) {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(date);
}

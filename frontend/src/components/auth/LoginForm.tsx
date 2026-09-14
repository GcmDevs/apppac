import { useId, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser, getDefaultRouteForRole, saveAuthSession } from '@/lib/auth';

type FormErrors = {
  document?: string;
  password?: string;
};

const initialErrors: FormErrors = {};

export function LoginForm() {
  const navigate = useNavigate();
  const [document, setDocument] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const documentId = useId();
  const passwordId = useId();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!document.trim()) {
      nextErrors.document = 'El numero de documento es obligatorio.';
    }

    if (!password.trim()) {
      nextErrors.password = 'La contrasena es obligatoria.';
    }

    setErrors(nextErrors);
    setAuthError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await authenticateUser({
        document: document.trim(),
        password,
        authAsUser: false,
        keepSignedIn,
      });

      saveAuthSession(session);
      navigate(
        session.passwordIsReset ? '/actualizar-contrasena' : getDefaultRouteForRole(session.user.role),
        { replace: true }
      );
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Los datos ingresados no coinciden. Verifica tu acceso.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className='login-card'>
      <div className='login-card-header'>
        <div className='brand-lockup'>
          <div className='brand-mark brand-mark-small' aria-hidden='true'>
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className='eyebrow'>Eklipse Paciente</p>
            <span className='brand-subtitle'>Acompanamiento y seguimiento en salud</span>
          </div>
        </div>
        <div>
          <h2>Bienvenido</h2>
          <p>Ingresa para continuar con tu acompanamiento.</p>
        </div>
      </div>

      <form className='login-form' onSubmit={handleSubmit} noValidate>
        <div className='field-group'>
          <label htmlFor={documentId}>Numero de documento</label>
          <div className='input-frame'>
            <input
              id={documentId}
              name='document'
              type='text'
              autoComplete='username'
              inputMode='numeric'
              value={document}
              onChange={event => setDocument(event.target.value)}
              aria-invalid={Boolean(errors.document)}
              aria-describedby={errors.document ? `${documentId}-error` : undefined}
              placeholder='Ingresa tu documento'
            />
          </div>
          {errors.document ? (
            <p className='field-error' id={`${documentId}-error`}>
              {errors.document}
            </p>
          ) : null}
        </div>

        <div className='field-group'>
          <label htmlFor={passwordId}>Contrasena</label>
          <div className='input-frame'>
            <LockKeyhole size={18} aria-hidden='true' />
            <input
              id={passwordId}
              name='password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='current-password'
              value={password}
              onChange={event => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? `${passwordId}-error` : undefined}
              placeholder='Ingresa tu contrasena'
            />
            <button
              type='button'
              className='icon-button'
              aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              onClick={() => setShowPassword(current => !current)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password ? (
            <p className='field-error' id={`${passwordId}-error`}>
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className='login-form-row'>
          <label className='checkbox-row'>
            <input
              type='checkbox'
              checked={keepSignedIn}
              onChange={event => setKeepSignedIn(event.target.checked)}
            />
            <span>Mantener mi sesion iniciada</span>
          </label>
          <a href='/' onClick={event => event.preventDefault()} className='text-link'>
            Olvidaste tu contrasena?
          </a>
        </div>

        {authError ? (
          <div className='inline-message' role='alert'>
            {authError}
          </div>
        ) : null}

        <button type='submit' className='primary-button' disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className='support-copy'>
          <p className='security-note'>Tu informacion es privada y esta protegida.</p>
          <p className='brand-subtitle'>Admin demo: 111111111 / 111111111</p>
          <p className='warning-note'>Esta aplicacion no reemplaza un servicio de urgencias.</p>
        </div>
      </form>
    </div>
  );
}

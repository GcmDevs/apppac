import { Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession, updatePassword } from '@/lib/auth';

export function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password.length > 20) {
      setError('La contraseña no puede superar los 20 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(password);
      clearAuthSession();
      navigate('/login', { replace: true, state: { passwordUpdated: true } });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'No fue posible actualizar la contraseña.'
      );
      setSaving(false);
    }
  };

  return (
    <main className='password-reset-layout'>
      <section className='password-reset-card' aria-labelledby='password-reset-title'>
        <div className='password-reset-icon'>
          <ShieldCheck size={30} />
        </div>
        <p className='eyebrow'>Seguridad de tu cuenta</p>
        <h1 id='password-reset-title'>Crea una nueva contraseña</h1>
        <p className='password-reset-intro'>
          Esta es la primera vez que ingresas. Define una contraseña personal antes de continuar.
        </p>
        <form onSubmit={submit} className='password-reset-form' noValidate>
          <PasswordField
            label='Nueva contraseña'
            value={password}
            visible={showPassword}
            onChange={setPassword}
            onToggle={() => setShowPassword(value => !value)}
            autoFocus
          />
          <PasswordField
            label='Confirmar contraseña'
            value={confirmation}
            visible={showConfirmation}
            onChange={setConfirmation}
            onToggle={() => setShowConfirmation(value => !value)}
          />
          <ul className='password-requirements'>
            <li className={password.length >= 8 ? 'valid' : ''}>
              <Check size={15} />
              Mínimo 8 caracteres
            </li>
            <li className={password === confirmation && confirmation.length > 0 ? 'valid' : ''}>
              <Check size={15} />
              Ambas contraseñas coinciden
            </li>
          </ul>
          {error ? (
            <div className='inline-message' role='alert'>
              {error}
            </div>
          ) : null}
          <button className='primary-button' type='submit' disabled={saving}>
            {saving ? 'Actualizando…' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </section>
    </main>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggle,
  autoFocus = false,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange(value: string): void;
  onToggle(): void;
  autoFocus?: boolean;
}) {
  return (
    <label className='field-group'>
      <span>{label}</span>
      <span className='input-frame'>
        <LockKeyhole size={18} />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={event => onChange(event.target.value)}
          minLength={8}
          maxLength={128}
          autoComplete='new-password'
          placeholder='Escribe tu nueva contraseña'
          autoFocus={autoFocus}
          required
        />
        <button
          type='button'
          className='icon-button'
          onClick={onToggle}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

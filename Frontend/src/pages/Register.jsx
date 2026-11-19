import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getFormErrors, normalizeValues } from '../utils/forms.js';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    display_name: '',
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError('');

    try {
      const normalized = normalizeValues({
        username: form.username,
        display_name: form.display_name,
        email: form.email,
      });

      await register({
        ...normalized,
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (error) {
      const { message, fieldErrors: errors } = getFormErrors(error);
      setFieldErrors(errors);
      setGeneralError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Crear cuenta</h1>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {generalError && (
            <p className="form-error" role="alert">
              {generalError}
            </p>
          )}

          <div className="form-group">
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.username)}
              disabled={submitting}
            />
            {fieldErrors.username && <small className="field-error">{fieldErrors.username}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="display_name">Nombre para mostrar (opcional)</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              value={form.display_name}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.display_name)}
              disabled={submitting}
            />
            {fieldErrors.display_name && <small className="field-error">{fieldErrors.display_name}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.email)}
              disabled={submitting}
            />
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
              disabled={submitting}
            />
            {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </section>
    </main>
  );
}
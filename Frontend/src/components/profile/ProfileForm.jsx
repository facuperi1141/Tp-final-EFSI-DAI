import { useState } from 'react';
import { updateProfile } from '../../services/users.service.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getChangedFields, isHttpUrl, normalizeValues } from '../../utils/forms.js';

// Edita nombre, bio y avatar. Manda solo los campos que cambiaron (PATCH /users/me).
export default function ProfileForm({ user, onSaved }) {
  const [values, setValues] = useState({
    display_name: user.display_name ?? '',
    bio: user.bio ?? '',
    avatar_url: user.avatar_url ?? '',
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
    setStatus('idle');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const clean = normalizeValues(values);
    if (clean.avatar_url && !isHttpUrl(clean.avatar_url)) {
      return setError('El avatar tiene que ser una URL que empiece con http o https.');
    }

    // Comparando contra el usuario guardado, un campo que se vació va como null y se borra
    const changes = getChangedFields(user, clean);
    if (Object.keys(changes).length === 0) return setStatus('saved');

    setError('');
    setStatus('saving');
    try {
      onSaved(await updateProfile(changes));
      setStatus('saved');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar tu perfil.'));
      setStatus('idle');
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      <label>
        Nombre para mostrar
        <input name="display_name" value={values.display_name} maxLength={60} placeholder={user.username} onChange={handleChange} />
      </label>
      <label>
        URL de avatar
        <input name="avatar_url" type="url" value={values.avatar_url} placeholder="https://…" onChange={handleChange} />
      </label>
      <label>
        Bio
        <textarea name="bio" value={values.bio} maxLength={500} placeholder="Contá qué música te mueve" onChange={handleChange} />
        <small className="char-count">{values.bio.length}/500</small>
      </label>
      {error && <div className="error">{error}</div>}
      <div className="form-footer">
        <button className="btn" disabled={status === 'saving'}>
          {status === 'saving' ? 'Guardando…' : 'Guardar perfil'}
        </button>
        {status === 'saved' && <small className="success">Cambios guardados ✓</small>}
      </div>
    </form>
  );
}

import { useState } from 'react';
import { getErrorCode, getErrorMessage } from '../../utils/errors.js';
import { isHttpUrl, normalizeValues } from '../../utils/forms.js';

const EMPTY = { name: '', description: '', cover_url: '' };

// Mensaje para los errores de crear/editar. El 409 es el nombre repetido.
export function getCollectionErrorMessage(error) {
  if (getErrorCode(error) === 'COLLECTION_NAME_TAKEN') return 'Ya tenés una playlist con ese nombre.';
  return getErrorMessage(error, 'No se pudo guardar la playlist.');
}

// Formulario para crear o editar una playlist.
// onSubmit recibe los valores ya limpios (vacíos = null). Si falla, tiene que
// tirar un Error con el mensaje a mostrar.
export default function CollectionForm({ initialValues = EMPTY, submitLabel, onSubmit }) {
  const [values, setValues] = useState({
    name: initialValues.name ?? '',
    description: initialValues.description ?? '',
    cover_url: initialValues.cover_url ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  function validate(clean) {
    if (!clean.name) return 'La playlist necesita un nombre.';
    if (clean.cover_url && !isHttpUrl(clean.cover_url)) return 'La portada tiene que ser una URL que empiece con http o https.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const clean = normalizeValues(values);
    const validationError = validate(clean);
    if (validationError) return setError(validationError);

    setError('');
    setSaving(true);
    try {
      await onSubmit(clean);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        Nombre
        <input name="name" value={values.name} maxLength={100} onChange={handleChange} autoFocus />
      </label>
      <label>
        Descripción <small className="muted">(opcional)</small>
        <textarea name="description" value={values.description} maxLength={500} onChange={handleChange} />
      </label>
      <label>
        URL de portada <small className="muted">(opcional)</small>
        <input name="cover_url" type="url" value={values.cover_url} placeholder="https://…" onChange={handleChange} />
      </label>
      {error && <div className="error">{error}</div>}
      <button className="btn" disabled={saving}>
        {saving ? 'Guardando…' : submitLabel}
      </button>
    </form>
  );
}

import { useState } from 'react';
import { replacePreferences } from '../../services/users.service.js';
import { GENRE_OPTIONS, LANGUAGE_OPTIONS } from '../../utils/constants.js';
import { getErrorMessage } from '../../utils/errors.js';

const MAX_GENRES = 20;

// Edita las preferencias. El PUT reemplaza todo, así que siempre se mandan los 4 campos.
export default function PreferencesForm({ preferences, onSaved }) {
  const [values, setValues] = useState({
    favorite_genres: preferences.favorite_genres ?? [],
    language: preferences.language ?? 'es',
    is_public: preferences.is_public ?? false,
    // El input numérico trabaja con texto: '' significa "sin objetivo"
    yearly_goal: preferences.yearly_goal?.toString() ?? '',
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved

  // Se suman los géneros que el usuario ya tenía aunque no estén en la lista fija
  const genreOptions = [...new Set([...GENRE_OPTIONS, ...(preferences.favorite_genres ?? [])])];

  function change(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setStatus('idle');
  }

  function toggleGenre(genre) {
    const { favorite_genres: genres } = values;
    change('favorite_genres', genres.includes(genre) ? genres.filter((g) => g !== genre) : [...genres, genre]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const goal = values.yearly_goal.trim() === '' ? null : Number(values.yearly_goal);
    if (goal !== null && (!Number.isInteger(goal) || goal < 1 || goal > 100000)) {
      return setError('El objetivo anual tiene que ser un número entero entre 1 y 100000.');
    }
    if (values.favorite_genres.length > MAX_GENRES) return setError(`Podés elegir hasta ${MAX_GENRES} géneros.`);

    setError('');
    setStatus('saving');
    try {
      onSaved(await replacePreferences({ ...values, yearly_goal: goal }));
      setStatus('saved');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron guardar tus preferencias.'));
      setStatus('idle');
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      <span className="field-label">Géneros favoritos</span>
      <div className="genre-chips">
        {genreOptions.map((genre) => {
          const selected = values.favorite_genres.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              className={selected ? 'selected' : ''}
              aria-pressed={selected}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </button>
          );
        })}
      </div>

      <div className="form-row">
        <label>
          Idioma
          <select value={values.language} onChange={(event) => change('language', event.target.value)}>
            {LANGUAGE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Objetivo anual de temas
          <input
            type="number"
            min="1"
            max="100000"
            step="1"
            placeholder="Sin objetivo"
            value={values.yearly_goal}
            onChange={(event) => change('yearly_goal', event.target.value)}
          />
        </label>
      </div>

      <label className="check">
        <input
          type="checkbox"
          checked={values.is_public}
          onChange={(event) => change('is_public', event.target.checked)}
        />
        Perfil público (tus reseñas se muestran a otros usuarios)
      </label>

      {error && <div className="error">{error}</div>}
      <div className="form-footer">
        <button className="btn" disabled={status === 'saving'}>
          {status === 'saving' ? 'Guardando…' : 'Guardar preferencias'}
        </button>
        {status === 'saved' && <small className="success">Preferencias guardadas ✓</small>}
      </div>
    </form>
  );
}

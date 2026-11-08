import { Heart, Search } from 'lucide-react';
import { SORT_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from '../../utils/constants.js';

// Componente controlado: recibe los filtros y avisa cada cambio con onChange({ campo: valor })
export default function LibraryFilters({ filters, onChange }) {
  return (
    <div className="library-filters">
      <label className="library-search">
        <Search />
        <input
          type="search"
          placeholder="Buscar por título, artista o álbum"
          value={filters.q}
          maxLength={100}
          onChange={(event) => onChange({ q: event.target.value })}
        />
      </label>

      <div className="pills">
        <button type="button" className={filters.status === '' ? 'on' : ''} onClick={() => onChange({ status: '' })}>
          Todos
        </button>
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={filters.status === value ? 'on' : ''}
            onClick={() => onChange({ status: value })}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className={`pill-favorite ${filters.favorite ? 'on' : ''}`}
          onClick={() => onChange({ favorite: !filters.favorite })}
          aria-pressed={filters.favorite}
        >
          <Heart size={13} fill={filters.favorite ? 'currentColor' : 'none'} /> Favoritos
        </button>
      </div>

      <div className="library-selects">
        <select value={filters.type} onChange={(event) => onChange({ type: event.target.value })} aria-label="Tipo">
          <option value="">Todos los tipos</option>
          {TYPE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={filters.sort} onChange={(event) => onChange({ sort: event.target.value })} aria-label="Ordenar">
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

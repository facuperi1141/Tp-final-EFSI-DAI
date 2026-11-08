import { Library, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LibraryFilters from '../components/library/LibraryFilters.jsx';
import LibraryItemRow from '../components/library/LibraryItemRow.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import ErrorMessage from '../components/UI/ErrorMessage.jsx';
import Loader from '../components/UI/Loader.jsx';
import PageHeader from '../components/UI/PageHeader.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { getLibrary, removeLibraryItem, updateLibraryItem } from '../services/library.service.js';
import { getErrorMessage } from '../utils/errors.js';
import { pluralize } from '../utils/format.js';
import '../styles/library.css';

const PAGE_SIZE = 50;
const INITIAL_FILTERS = { q: '', status: '', favorite: false, type: '', sort: 'recent' };

export default function LibraryPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // El texto se espera a que el usuario deje de tipear; el resto de los filtros se aplica al toque
  const query = useDebounce(filters.q);
  const { status, favorite, type, sort } = filters;
  const hasFilters = query.trim() !== '' || status !== '' || favorite || type !== '';

  // Cada vez que cambia un filtro se vuelve a pedir la primera página
  useEffect(() => {
    // Si cambian los filtros antes de que llegue la respuesta anterior, esa respuesta se descarta
    let ignore = false;
    setLoading(true);
    setError('');

    getLibrary({ q: query.trim(), status, favorite, type, sort, limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (ignore) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err, 'No pudimos cargar tu biblioteca.'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query, status, favorite, type, sort, reloadKey]);

  function changeFilters(changes) {
    setFilters((current) => ({ ...current, ...changes }));
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await getLibrary({ q: query.trim(), status, favorite, type, sort, limit: PAGE_SIZE, offset: items.length });
      setItems((current) => [...current, ...data.items]);
      setTotal(data.total);
    } catch (err) {
      setActionError(getErrorMessage(err, 'No pudimos cargar más contenidos.'));
    } finally {
      setLoadingMore(false);
    }
  }

  // Después del PATCH se reemplaza solo ese item con lo que devolvió el back
  async function handleUpdate(id, changes) {
    setActionError('');
    try {
      const updated = await updateLibraryItem(id, changes);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setActionError(getErrorMessage(err, 'No se pudo guardar el cambio.'));
    }
  }

  async function handleRemove(item) {
    if (!window.confirm(`¿Quitar "${item.content.title}" de tu biblioteca?`)) return;
    setActionError('');
    try {
      await removeLibraryItem(item.id);
      setItems((current) => current.filter(({ id }) => id !== item.id));
      setTotal((current) => current - 1);
    } catch (err) {
      setActionError(getErrorMessage(err, 'No se pudo quitar el contenido.'));
    }
  }

  function renderContent() {
    if (loading) return <Loader text="Cargando tu biblioteca…" />;
    if (error) return <ErrorMessage message={error} onRetry={() => setReloadKey((key) => key + 1)} />;

    if (items.length === 0 && hasFilters) {
      return (
        <EmptyState icon={SearchX} title="No hay resultados" text="Probá con otros filtros o con otra búsqueda.">
          <button type="button" className="outline" onClick={() => setFilters(INITIAL_FILTERS)}>
            Limpiar filtros
          </button>
        </EmptyState>
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState icon={Library} title="Tu biblioteca está vacía" text="Buscá canciones, álbumes o artistas y guardalos acá.">
          <Link className="btn" to="/explorar">
            Explorar música
          </Link>
        </EmptyState>
      );
    }

    return (
      <>
        <div className="library-list">
          {items.map((item) => (
            <LibraryItemRow key={item.id} item={item} onUpdate={handleUpdate} onRemove={handleRemove} />
          ))}
        </div>
        {items.length < total && (
          <div className="load-more">
            <button type="button" className="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Cargando…' : `Cargar más (${total - items.length} restantes)`}
            </button>
          </div>
        )}
      </>
    );
  }

  let subtitle = pluralize(total, 'contenido guardado', 'contenidos guardados');
  if (hasFilters) subtitle = `${pluralize(total, 'resultado')} con estos filtros`;
  if (loading) subtitle = 'Cargando…';

  return (
    <div className="page">
      <PageHeader tag="TODO LO QUE TE GUSTA" title="Tu biblioteca" subtitle={subtitle} />
      <LibraryFilters filters={filters} onChange={changeFilters} />
      <ErrorMessage message={actionError} />
      {renderContent()}
    </div>
  );
}

import { ArrowLeft, ListMusic, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CollectionCover from '../components/collections/CollectionCover.jsx';
import CollectionForm, { getCollectionErrorMessage } from '../components/collections/CollectionForm.jsx';
import Cover from '../components/UI/Cover.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import ErrorMessage from '../components/UI/ErrorMessage.jsx';
import Loader from '../components/UI/Loader.jsx';
import Modal from '../components/UI/Modal.jsx';
import { deleteCollection, getCollection, removeCollectionItem, updateCollection } from '../services/collections.service.js';
import { getErrorMessage } from '../utils/errors.js';
import { getChangedFields } from '../utils/forms.js';
import { formatDuration, formatTotalDuration, pluralize } from '../utils/format.js';
import '../styles/collections.css';

export default function CollectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState('');
  const [editing, setEditing] = useState(false);

  async function loadCollection() {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      setCollection(await getCollection(id));
    } catch (err) {
      // 404 si no existe o si es de otro usuario: el back no distingue, y está bien
      if (err.response?.status === 404) setNotFound(true);
      else setError(getErrorMessage(err, 'No pudimos cargar la playlist.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCollection();
  }, [id]);

  // El PATCH lleva solo lo que cambió. La respuesta no trae los items, por eso se mezcla.
  async function handleEdit(values) {
    const changes = getChangedFields(collection, values);
    if (Object.keys(changes).length === 0) return setEditing(false);

    try {
      const updated = await updateCollection(collection.id, changes);
      setCollection((current) => ({ ...current, ...updated }));
      setEditing(false);
    } catch (err) {
      throw new Error(getCollectionErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Borrar la playlist "${collection.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteCollection(collection.id);
      navigate('/colecciones');
    } catch (err) {
      setActionError(getErrorMessage(err, 'No se pudo borrar la playlist.'));
    }
  }

  // Se quita por content.id (nuestro id), no por el external_id de Deezer
  async function handleRemoveItem(content) {
    setActionError('');
    try {
      await removeCollectionItem(collection.id, content.id);
      setCollection((current) => ({
        ...current,
        items: current.items.filter((item) => item.content.id !== content.id),
      }));
    } catch (err) {
      setActionError(getErrorMessage(err, 'No se pudo quitar el tema.'));
    }
  }

  const backLink = (
    <Link className="back" to="/colecciones">
      <ArrowLeft /> Tus playlists
    </Link>
  );

  if (loading) return <Loader text="Cargando playlist…" />;

  if (notFound || error) {
    return (
      <div className="page">
        {backLink}
        {notFound ? (
          <EmptyState icon={ListMusic} title="Playlist no encontrada" text="Puede que la hayas borrado." />
        ) : (
          <ErrorMessage message={error} onRetry={loadCollection} />
        )}
      </div>
    );
  }

  const { items } = collection;
  const covers = items.map(({ content }) => content.cover_url).filter(Boolean);
  const totalDuration = items.reduce((sum, { content }) => sum + (content.duration_ms ?? 0), 0);

  return (
    <div className="page">
      {backLink}

      <div className="playlist-hero">
        <CollectionCover coverUrl={collection.cover_url} covers={covers} className="playlist-hero-cover" />
        <div>
          <small className="eyebrow">PLAYLIST</small>
          <h1>{collection.name}</h1>
          {collection.description && <p className="playlist-description">{collection.description}</p>}
          <small className="muted">
            {pluralize(items.length, 'tema')}
            {totalDuration > 0 && ` · ${formatTotalDuration(totalDuration)}`}
          </small>
          <div className="actions">
            <button type="button" className="outline" onClick={() => setEditing(true)}>
              <Pencil size={15} /> Editar
            </button>
            <button type="button" className="outline danger" onClick={handleDelete}>
              <Trash2 size={15} /> Borrar
            </button>
          </div>
        </div>
      </div>

      <ErrorMessage message={actionError} />

      {items.length === 0 ? (
        <EmptyState icon={ListMusic} title="Esta playlist está vacía" text="Agregá temas desde el detalle de cada canción.">
          <Link className="btn" to="/explorar">
            Explorar música
          </Link>
        </EmptyState>
      ) : (
        <div className="playlist-tracks">
          {items.map(({ content }, index) => (
            <div className="playlist-track" key={content.id}>
              <span className="playlist-track-number">{index + 1}</span>
              <Link className="playlist-track-info" to={`/detalle/${content.type}/${content.external_id}`}>
                <Cover src={content.cover_url} alt={content.title} />
                <span>
                  <b>{content.title}</b>
                  <small>{content.artist_name}</small>
                </span>
              </Link>
              <small className="playlist-track-album">{content.album_name}</small>
              <small className="playlist-track-duration">{formatDuration(content.duration_ms)}</small>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Quitar ${content.title} de la playlist`}
                onClick={() => handleRemoveItem(content)}
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title="Editar playlist" onClose={() => setEditing(false)}>
          <CollectionForm initialValues={collection} submitLabel="Guardar cambios" onSubmit={handleEdit} />
        </Modal>
      )}
    </div>
  );
}

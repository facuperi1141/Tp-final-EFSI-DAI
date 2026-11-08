import { ListMusic, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CollectionCard from '../components/collections/CollectionCard.jsx';
import CollectionForm, { getCollectionErrorMessage } from '../components/collections/CollectionForm.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import ErrorMessage from '../components/UI/ErrorMessage.jsx';
import Loader from '../components/UI/Loader.jsx';
import Modal from '../components/UI/Modal.jsx';
import PageHeader from '../components/UI/PageHeader.jsx';
import { createCollection, getCollections } from '../services/collections.service.js';
import { getErrorMessage } from '../utils/errors.js';
import '../styles/collections.css';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function loadCollections() {
    setLoading(true);
    setError('');
    try {
      setCollections(await getCollections());
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cargar tus playlists.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCollections();
  }, []);

  // Al crearla se va directo a su detalle
  async function handleCreate(values) {
    try {
      const created = await createCollection(values);
      navigate(`/colecciones/${created.id}`);
    } catch (err) {
      throw new Error(getCollectionErrorMessage(err));
    }
  }

  function renderContent() {
    if (loading) return <Loader text="Cargando tus playlists…" />;
    if (error) return <ErrorMessage message={error} onRetry={loadCollections} />;
    if (collections.length === 0) {
      return (
        <EmptyState icon={ListMusic} title="Todavía no tenés playlists" text="Creá una y agregale temas desde el detalle de cada canción.">
          <button type="button" className="btn" onClick={() => setCreating(true)}>
            <Plus /> Crear mi primera playlist
          </button>
        </EmptyState>
      );
    }

    return (
      <div className="collection-grid">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        tag="ORDENÁ TU MÚSICA"
        title="Tus playlists"
        subtitle="Playlists para cada momento."
        action={
          <button type="button" className="btn" onClick={() => setCreating(true)}>
            <Plus /> Nueva playlist
          </button>
        }
      />
      {renderContent()}
      {creating && (
        <Modal title="Nueva playlist" onClose={() => setCreating(false)}>
          <CollectionForm submitLabel="Crear playlist" onSubmit={handleCreate} />
        </Modal>
      )}
    </div>
  );
}

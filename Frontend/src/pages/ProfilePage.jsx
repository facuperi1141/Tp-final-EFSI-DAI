import { CalendarDays, Globe, Heart, Lock, LogOut, MessageSquare, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ActivityList from '../components/profile/ActivityList.jsx';
import PreferencesForm from '../components/profile/PreferencesForm.jsx';
import ProfileForm from '../components/profile/ProfileForm.jsx';
import ReviewList from '../components/profile/ReviewList.jsx';
import Avatar from '../components/UI/Avatar.jsx';
import Cover from '../components/UI/Cover.jsx';
import ErrorMessage from '../components/UI/ErrorMessage.jsx';
import Loader from '../components/UI/Loader.jsx';
import PageHeader from '../components/UI/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getActivity } from '../services/activity.service.js';
import { getFavorites } from '../services/library.service.js';
import { getMyReviews } from '../services/reviews.service.js';
import { getMe } from '../services/users.service.js';
import { LANGUAGE_OPTIONS } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDate, pluralize } from '../utils/format.js';
import '../styles/profile.css';

export default function ProfilePage() {
  const { updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(null); // { user, preferences }
  const [favorites, setFavorites] = useState({ items: [], total: 0 });
  const [activities, setActivities] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Todo lo que muestra el perfil se pide en paralelo
  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const [me, favoritesData, activityData, reviewsData] = await Promise.all([
        getMe(),
        getFavorites({ limit: 6 }),
        getActivity(10),
        getMyReviews(),
      ]);
      setProfile(me);
      setFavorites(favoritesData);
      setActivities(activityData);
      setReviews(reviewsData);
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cargar tu perfil.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  // Se actualiza la vista local y también el AuthContext, para que el sidebar muestre el nombre y avatar nuevos
  function handleProfileSaved(user) {
    setProfile((current) => ({ ...current, user }));
    updateUser(user);
  }

  function handlePreferencesSaved(preferences) {
    setProfile((current) => ({ ...current, preferences }));
  }

  if (loading) return <Loader text="Cargando tu perfil…" />;
  if (error) {
    return (
      <div className="page">
        <ErrorMessage message={error} onRetry={loadProfile} />
      </div>
    );
  }

  const { user, preferences } = profile;
  const languageLabel = LANGUAGE_OPTIONS.find(({ value }) => value === preferences.language)?.label ?? preferences.language;

  return (
    <div className="page">
      <PageHeader tag="TU IDENTIDAD MUSICAL" title="Perfil" subtitle="Personalizá tu espacio y mirá tu actividad." />

      <section className="profile-hero">
        <Avatar user={user} className="big-avatar" />
        <div className="profile-hero-info">
          <h2>{user.display_name || user.username}</h2>
          <p className="muted">@{user.username}</p>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-meta">
            <span>
              <CalendarDays size={14} /> Desde {formatDate(user.created_at)}
            </span>
            <span>
              <Heart size={14} /> {pluralize(favorites.total, 'favorito')}
            </span>
            <span>
              <MessageSquare size={14} /> {pluralize(reviews.length, 'reseña')}
            </span>
            <span>
              {preferences.is_public ? <Globe size={14} /> : <Lock size={14} />}
              {preferences.is_public ? 'Perfil público' : 'Perfil privado'}
            </span>
            <span>
              <Target size={14} /> {preferences.yearly_goal ? `Objetivo: ${preferences.yearly_goal} temas` : 'Sin objetivo anual'}
            </span>
            <span>Idioma: {languageLabel}</span>
          </div>
          {preferences.favorite_genres?.length > 0 && (
            <div className="profile-genres">
              {preferences.favorite_genres.map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="two-col">
        <section className="section">
          <div className="section-head">
            <h2>Editar perfil</h2>
          </div>
          <div className="panel">
            <ProfileForm user={user} onSaved={handleProfileSaved} />
          </div>
        </section>
        <section className="section">
          <div className="section-head">
            <h2>Preferencias</h2>
          </div>
          <div className="panel">
            <PreferencesForm preferences={preferences} onSaved={handlePreferencesSaved} />
          </div>
        </section>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Tus favoritos</h2>
          <Link className="text-link" to="/biblioteca">
            Ver biblioteca
          </Link>
        </div>
        {favorites.items.length === 0 ? (
          <p className="muted">Marcá temas con el corazón y van a aparecer acá.</p>
        ) : (
          <div className="cards">
            {favorites.items.map(({ id, content }) => (
              <Link key={id} className="music-card" to={`/detalle/${content.type}/${content.external_id}`}>
                <Cover src={content.cover_url} alt={content.title} />
                <b>{content.title}</b>
                <small>{content.artist_name}</small>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="two-col">
        <section className="section">
          <div className="section-head">
            <h2>Actividad reciente</h2>
          </div>
          <div className="panel">
            <ActivityList activities={activities} />
          </div>
        </section>
        <section className="section">
          <div className="section-head">
            <h2>Mis reseñas</h2>
          </div>
          <div className="panel">
            <ReviewList reviews={reviews} />
          </div>
        </section>
      </div>

      <button type="button" className="logout" onClick={logout}>
        <LogOut /> Cerrar sesión
      </button>
    </div>
  );
}

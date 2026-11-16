import React, { useEffect, useRef, useState } from 'react';
import api from './services/api.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Avatar from './components/UI/Avatar.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import CollectionsPage from './pages/CollectionsPage.jsx';
import CollectionDetailPage from './pages/CollectionDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Home as HomeI, Search, Library, ListMusic, UserRound, ChartNoAxesColumn, LogOut, Plus, Heart, Play, Pause, Music2, Star, ChevronRight, ArrowLeft, X, Disc3, Headphones, Sparkles, LoaderCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getFormErrors } from './utils/forms.js';
import { useDebounce } from './hooks/useDebounce.js';
import { getChart, searchMusic } from './services/search.service.js';


const fallback = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80';
const labels = { quiero_escuchar: 'Quiero escuchar', escuchando: 'Escuchando', escuchado: 'Escuchado', favorito: 'Favorito' };

function Guard({ children }) {
  let { user, loading } = useAuth();
  if (loading) return <div className="center"><LoaderCircle className="spin" /> Cargando tu música…</div>;
  return user ? children : <Navigate to="/login" />;
}

function Side() {
  let { user, logout } = useAuth();
  return (
    <>
      <aside className="sidebar">
        <div className="brand"><i><Music2 /></i>My <b>Collection</b></div>
        <nav>
          <NavLink to="/"><HomeI />Inicio</NavLink>
          <NavLink to="/explorar"><Search />Explorar</NavLink>
          <NavLink to="/biblioteca"><Library />Tu biblioteca</NavLink>
          <NavLink to="/colecciones"><ListMusic />Colecciones</NavLink>
        </nav>
        <div className="side-label">TU ESPACIO</div>
        <NavLink className="side-link" to="/estadisticas"><ChartNoAxesColumn />Tus estadísticas</NavLink>
        <NavLink className="side-link" to="/perfil"><UserRound />Perfil</NavLink>
        <div className="side-user">
          <Avatar user={user} />
          <span><b>{user?.display_name || user?.username}</b><small>@{user?.username}</small></span>
          <button onClick={logout}><LogOut /></button>
        </div>
      </aside>
      <nav className="mobile-nav">
        <NavLink to="/"><HomeI />Inicio</NavLink>
        <NavLink to="/explorar"><Search />Explorar</NavLink>
        <NavLink to="/biblioteca"><Library />Biblioteca</NavLink>
        <NavLink to="/colecciones"><ListMusic />Colecciones</NavLink>
        <NavLink to="/perfil"><UserRound />Perfil</NavLink>
      </nav>
    </>
  );
}

function Layout({ children }) {
  return (
    <div className="layout">
      <Side />
      <main className="main">
        <div className="mobile-brand"><i><Music2 /></i> My Collection</div>
        {children}
      </main>
    </div>
  );
}

function Head({ tag, title, sub, action }) {
  return (
    <div className="head">
      <div>
        <small className="eyebrow">{tag}</small>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Cover({ src, className = '' }) {
  return <img className={'cover ' + className} src={src || fallback} onError={e => e.currentTarget.src = fallback} />;
}

function Card({ x, open, isPlaying = false, onTogglePreview = null }) {
  return (
    <div
      className="music-card"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      style={{ cursor: 'pointer' }}
    >
      <div className="coverbox">
        <Cover src={x.cover_url} />
        {onTogglePreview && x.preview_url ? (
          <span
            role="button"
            tabIndex={0}
            title={isPlaying ? 'Pausar adelanto' : 'Escuchar adelanto'}
            aria-label={isPlaying ? 'Pausar adelanto' : 'Escuchar adelanto'}
            onClick={(e) => onTogglePreview(e, x)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onTogglePreview(e, x);
              }
            }}
          >
            {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </span>
        ) : (
          <span><Play fill="currentColor" /></span>
        )}
      </div>
      <b>{x.title}</b>
      <small>{x.artist_name || x.title}</small>
    </div>
  );
}

function Home() {
  let [chart, setChart] = useState([]), [s, setS] = useState(null), [activity, setActivity] = useState([]);
  let nav = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/search/chart', { params: { type: 'track', limit: 8 } }),
      api.get('/stats'),
      api.get('/activity', { params: { limit: 5 } }),
    ]).then(([a, b, c]) => {
      setChart(a.data.results || []);
      setS(b.data);
      setActivity(c.data.activities || []);
    });
  }, []);

  return (
    <div className="page">
      <div className="welcome">
        <div>
          <small className="eyebrow">TU UNIVERSO MUSICAL</small>
          <h1>Buenas noches <em>✦</em></h1>
          <p>Tu música, tu biblioteca, tus estadísticas.</p>
        </div>
        <Disc3 className="welcome-disc" />
      </div>
      <div className="quick-stats">
        {[[s?.totals?.library ?? '—', 'En tu biblioteca', <Library />], [s?.totals?.favorites ?? '—', 'Favoritos', <Heart />], [s?.totals?.collections ?? '—', 'Colecciones', <ListMusic />]].map((x, i) => (
          <div className="quick" key={i}>
            <span>{x[2]}</span>
            <b>{x[0]}</b>
            <small>{x[1]}</small>
          </div>
        ))}
      </div>
      <Section title="Destacados de hoy" action={<NavLink className="text-link" to="/explorar">Explorar <ChevronRight size={15} /></NavLink>}>
        <div className="cards">
          {chart.map(x => <Card key={x.external_id} x={x} open={() => nav(`/detalle/${x.type}/${x.external_id}`)} />)}
        </div>
      </Section>
      <div className="two-col">
        <Section title="Progreso de tu biblioteca">
          <div className="panel progress">
            <b>{s?.totals?.listened || 0} <small>/ {s?.totals?.library || 0} escuchados</small></b>
            <p>{s?.progress_percent || 0}% de tu biblioteca</p>
            <div className="progressbar"><i style={{ width: `${s?.progress_percent || 0}%` }} /></div>
            <NavLink className="text-link" to="/biblioteca">Ver biblioteca <ChevronRight size={15} /></NavLink>
          </div>
        </Section>
        <Section title="Actividad reciente">
          <div className="panel activity">
            {activity.map((a, i) => (
              <p key={a.id || i}>
                <i /> <span>{({ added: 'Agregaste', favorited: 'Marcaste como favorito', rated: 'Puntuaste', reviewed: 'Escribiste una reseña', status_changed: 'Cambiaste el estado' })[a.type] || 'Actualizaste'} <b>{a.metadata?.title || 'tu música'}</b></span>
              </p>
            ))}
            {!activity.length && <small className="muted">Tu actividad aparecerá acá.</small>}
          </div>
        </Section>
      </div>
    </div>
  );
}

const EXPLORE_LIMIT = 25;

function Explore() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [type, setType] = useState('track');
  const [page, setPage] = useState(0);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  const audioRef = useRef(null);
  const nav = useNavigate();

  const searched = Boolean(debouncedQ.trim());
  const totalPages = Math.ceil(total / EXPLORE_LIMIT);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchExplore() {
      setBusy(true);
      try {
        if (!debouncedQ.trim()) {
          const chartResults = await getChart({ type, limit: 12 });
          if (!active) return;
          setResults(chartResults);
          setTotal(chartResults.length);
        } else {
          const data = await searchMusic({
            q: debouncedQ,
            type,
            limit: EXPLORE_LIMIT,
            offset: page * EXPLORE_LIMIT,
          });
          if (!active) return;
          setResults(data.results || []);
          setTotal(data.total ?? 0);
        }
      } catch {
        if (!active) return;
        setResults([]);
        setTotal(0);
      } finally {
        if (active) setBusy(false);
      }
    }

    fetchExplore();
    return () => {
      active = false;
    };
  }, [debouncedQ, type, page]);

  function togglePreview(e, item) {
    e.stopPropagation();
    if (!item.preview_url) return;

    if (playingId === item.external_id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(item.preview_url);
    audioRef.current = audio;
    setPlayingId(item.external_id);

    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
  }

  function handleQueryChange(e) {
    setQ(e.target.value);
    setPage(0);
  }

  function handleTypeChange(newType) {
    if (newType === type) return;
    setType(newType);
    setPage(0);
  }

  function goToPage(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page">
      <Head tag="ENCONTRÁ TU PRÓXIMA CANCIÓN" title="Explorar" sub="Descubrí música nueva y sumala a tu colección." />

      <form className="search" onSubmit={(e) => e.preventDefault()}>
        <Search />
        <input
          placeholder="¿Qué querés escuchar?"
          value={q}
          onChange={handleQueryChange}
        />
        {q && (
          <button
            type="button"
            className="text-link"
            onClick={() => { setQ(''); setPage(0); }}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </form>

      <div className="pills">
        {[['track', 'Canciones'], ['album', 'Álbumes'], ['artist', 'Artistas']].map(([v, l]) => (
          <button
            type="button"
            className={v === type ? 'on' : ''}
            onClick={() => handleTypeChange(v)}
            key={v}
          >
            {l}
          </button>
        ))}
      </div>

      <Section
        title={searched ? `Resultados${total ? ` (${total})` : ''}` : 'Lo más escuchado'}
        action={busy ? <small className="muted">Buscando…</small> : null}
      >
        <div className="cards">
          {results.map((x) => (
            <Card
              key={x.external_id}
              x={x}
              open={() => nav(`/detalle/${x.type}/${x.external_id}`)}
              isPlaying={playingId === x.external_id}
              onTogglePreview={x.preview_url ? togglePreview : null}
            />
          ))}
        </div>

        {!busy && !results.length && (
          <div className="empty">
            <Search />
            <b>{searched ? 'No encontramos resultados' : 'Buscá música para empezar'}</b>
          </div>
        )}

        {searched && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button
              type="button"
              className="outline"
              disabled={page === 0 || busy}
              onClick={() => goToPage(page - 1)}
            >
              Anterior
            </button>
            <small className="muted">
              Página {page + 1} de {totalPages}
            </small>
            <button
              type="button"
              className="outline"
              disabled={page + 1 >= totalPages || busy}
              onClick={() => goToPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}

function Detail() {
  let { type, externalId } = useParams(), [content, setContent] = useState(null), [item, setItem] = useState(null), [review, setReview] = useState(null), [reviews, setReviews] = useState([]), [busy, setBusy] = useState(true), [modal, setModal] = useState(''), [body, setBody] = useState(''), [collections, setCollections] = useState([]);
  let nav = useNavigate();

  async function load() {
    let [a, b] = await Promise.all([api.get(`/search/${type}/${externalId}`), api.get(`/library/by-external/deezer/${externalId}`)]);
    setContent(a.data.content);
    setItem(b.data.item);
    setReview(b.data.review);
    if (b.data.content) api.get(`/contents/${b.data.content.id}/reviews`).then(r => setReviews(r.data.reviews || []));
  }

  useEffect(() => {
    setBusy(true);
    load().catch(() => {}).finally(() => setBusy(false));
  }, [type, externalId]);

  async function update(p) {
    let r = await api.patch(`/library/${item.id}`, p);
    setItem(r.data.item);
  }

  async function saveReview() {
    try {
      if (review) await api.patch(`/reviews/${review.id}`, { body });
      else await api.post('/reviews', { content, body });
      await load();
      setModal('');
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo guardar');
    }
  }

  if (busy) return <div className="page"><div className="center"><LoaderCircle className="spin" /></div></div>;
  if (!content) return <div className="page"><button className="text-link" onClick={() => nav(-1)}>‹ Volver</button><div className="empty">No encontramos el contenido.</div></div>;

  return (
    <div className="page">
      <button className="back" onClick={() => nav(-1)}><ArrowLeft /> Volver</button>
      <div className="detail-hero">
        <Cover src={content.cover_url} className="detail-cover" />
        <div>
          <small className="eyebrow">{content.type?.toUpperCase()}</small>
          <h1>{content.title}</h1>
          <p>{content.artist_name}</p>
          <small>{content.genres?.join(' · ')} {content.release_year && ` · ${content.release_year}`}</small>
          <div className="actions">
            {item ? (
              <>
                <select value={item.status} onChange={e => update({ status: e.target.value })}>
                  {Object.entries(labels).map(([v, l]) => <option value={v} key={v}>{l}</option>)}
                </select>
                <button className={'round ' + (item.is_favorite ? 'liked' : '')} onClick={() => update({ is_favorite: !item.is_favorite })}>
                  <Heart fill={item.is_favorite ? 'currentColor' : 'none'} />
                </button>
                <button className="round" onClick={async () => { await api.delete(`/library/${item.id}`); setItem(null); }}>
                  <X />
                </button>
              </>
            ) : (
              <button className="btn" onClick={async () => { let r = await api.post('/library', { content, status: 'quiero_escuchar' }); setItem(r.data.item); }}>
                <Plus /> Agregar a biblioteca
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="two-col detail-cols">
        <Section title="Tu puntuación">
          <div className="stars">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className={n <= (item?.rating || 0) ? 'chosen' : ''} onClick={() => item && update({ rating: item.rating === n ? null : n })}>
                <Star fill="currentColor" />
              </button>
            ))}
          </div>
        </Section>
        <Section title="Tu reseña" action={<button className="text-link" onClick={() => { setBody(review?.body || ''); setModal('review'); }}>{review ? 'Editar' : 'Escribir reseña'}</button>}>
          {review ? (
            <div className="panel">
              {review.body}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="text-link" onClick={async () => { if (confirm('¿Eliminar tu reseña?')) { await api.delete(`/reviews/${review.id}`); setReview(null); setReviews(v => v.filter(x => x.id !== review.id)); } }}>
                  Eliminar reseña
                </button>
              </div>
            </div>
          ) : (
            <p className="muted">Todavía no escribiste una reseña.</p>
          )}
          <h3 className="subhead">Reseñas de la comunidad</h3>
          {reviews.filter(r => !r.is_mine).map(r => (
            <div className="panel review" key={r.id}>
              <b>{r.author?.display_name || r.author?.username}</b>
              <p>{r.body}</p>
            </div>
          ))}
        </Section>
      </div>
      {modal === 'review' && (
        <Modal title="Tu reseña" close={() => setModal('')}>
          <textarea value={body} maxLength={5000} onChange={e => setBody(e.target.value)} placeholder="¿Qué te pareció?" />
          <button className="btn" onClick={saveReview}>Publicar reseña</button>
        </Modal>
      )}
      <button className="outline" onClick={async () => { let r = await api.get('/collections'); setCollections(r.data.collections || []); setModal('collection'); }}>
        Guardar en colección
      </button>
      {modal === 'collection' && (
        <Modal title="Guardar en colección" close={() => setModal('')}>
          {collections.map(c => (
            <button className="choice" key={c.id} onClick={async () => { try { await api.post(`/collections/${c.id}/items`, { content }); setModal(''); alert('Agregado'); } catch (e) { alert(e.response?.data?.message || 'Error'); } }}>
              {c.name} <ChevronRight />
            </button>
          ))}
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, close, children }) {
  return (
    <div className="overlay" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button onClick={close}><X /></button>
        </header>
        {children}
      </div>
    </div>
  );
}

function Stats() {
  let [s, setS] = useState(null);
  useEffect(() => {
    api.get('/stats').then(r => setS(r.data)).catch(() => {});
  }, []);

  if (!s) return <div className="center"><LoaderCircle className="spin" /> Cargando estadísticas…</div>;
  let pie = (s.by_status || []).map(x => ({ name: labels[x.status], value: x.count })), colors = ['#1ed760', '#479bff', '#b49bff', '#ffb84d'];

  return (
    <div className="page">
      <Head tag="TUS HÁBITOS MUSICALES" title="Tus estadísticas" sub="Una mirada a todo lo que escuchás y guardás." />
      <div className="stats-hero">
        <small>TU MÚSICA EN NÚMEROS</small>
        <h2>{(s.minutes_listened?.minutes || 0).toLocaleString('es-AR')} min</h2>
        <p>Minutos escuchados</p>
        <HeadKpis totals={s.totals} avg={s.ratings?.average} />
      </div>
      <div className="stats-grid">
        <div className="panel">
          <h3>Estado de tu biblioteca</h3>
          <div className="chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={48} outerRadius={78}>
                  {pie.map((x, i) => <Cell key={i} fill={colors[i % 4]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {pie.map((x, i) => <span key={i}><i style={{ background: colors[i % 4] }} />{x.name} <b>{x.value}</b></span>)}
          </div>
        </div>
        <div className="panel">
          <h3>Actividad por mes</h3>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={s.activity_by_month || []}>
                <XAxis dataKey="month" tickFormatter={x => x.slice(5)} tick={{ fill: '#aaa', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="count" fill="#1ed760" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <h3>Top 5 artistas</h3>
          {(s.top_artists || []).map((a, i) => (
            <div className="rank" key={i}>
              <b>{i + 1}</b>
              <Cover src={a.cover_url} />
              <span>{a.name}<small>{a.count} contenidos</small></span>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Géneros que más escuchás</h3>
          {(s.top_genres || []).map((g, i) => (
            <div className="genre" key={i}>
              <span>{g.name}</span>
              <i><b style={{ width: `${Math.max(5, g.count / (s.top_genres[0]?.count || 1) * 100)}%` }} /></i>
              <small>{g.count}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="wrapped-banner">
        <div>
          <small>MY COLLECTION · WRAPPED</small>
          <h2>Tu año en música.</h2>
          <p>Descubrí tus artistas, canciones y hábitos del año.</p>
          <NavLink className="light-btn" to={`/wrapped/${new Date().getFullYear()}`}>Ver mi resumen <ChevronRight /></NavLink>
        </div>
        <Sparkles size={65} />
      </div>
    </div>
  );
}

function HeadKpis({ totals = {}, avg }) {
  return (
    <div className="kpis">
      {[['Biblioteca', totals.library], ['Favoritos', totals.favorites], ['Puntuación', avg ? `${avg} ★` : '—'], ['Reseñas', totals.reviews]].map((x, i) => (
        <div key={i}>
          <small>{x[0]}</small>
          <b>{x[1] ?? 0}</b>
        </div>
      ))}
    </div>
  );
}

function Wrapped() {
  let { year } = useParams(), [w, setW] = useState(null);
  useEffect(() => {
    api.get('/stats/wrapped', { params: { year } }).then(r => setW(r.data)).catch(() => {});
  }, [year]);

  if (!w) return <div className="center"><LoaderCircle className="spin" /> Armando tu resumen…</div>;

  return (
    <div className="page wrapped-page">
      <NavLink className="back" to="/estadisticas"><ArrowLeft /> Estadísticas</NavLink>
      <div className="wrapped-intro">
        <small>MY COLLECTION · WRAPPED {year}</small>
        <h1>Tu {year}<br /><em>en música.</em></h1>
        <p>Mati, este fue tu año. Estos fueron tus momentos musicales.</p>
        <strong>{Number(w.minutes_listened || 0).toLocaleString('es-AR')}</strong>
        <span>minutos escuchados</span>
      </div>
      <div className="wrapped-tiles">
        <div className="tile green"><small>TU ARTISTA MÁS ESCUCHADO</small><h2>{w.top_artists?.[0]?.name || '—'}</h2><b>{w.top_artists?.[0]?.minutes || 0} min</b></div>
        <div className="tile purple"><small>TU GÉNERO DEL AÑO</small><h2>{w.top_genres?.[0]?.name || '—'}</h2></div>
        <div className="tile orange"><small>CONTENIDOS DESCUBIERTOS</small><h2>{w.distinct_contents || 0}</h2></div>
        <div className="tile blue"><small>PUNTUACIÓN PROMEDIO</small><h2>{w.avg_rating ? `${w.avg_rating} ★` : '—'}</h2></div>
      </div>
      <div className="wrapped-tiles">
        <div className="tile blue"><small>TU MOMENTO MÁS ACTIVO</small><h2>{w.most_active_month?.month || '—'}</h2><b>{w.most_active_month?.count || 0} acciones</b></div>
        <div className="tile purple"><small>TU HORA DE ESCUCHA</small><h2>{w.top_listening_hour?.hour != null ? `${String(w.top_listening_hour.hour).padStart(2, '0')}:00` : '—'}</h2><b>{w.top_listening_hour ? `${w.top_listening_hour.plays} reproducciones` : 'Sin historial de escucha'}</b></div>
        <div className="tile orange"><small>OBJETIVO ANUAL</small><h2>{w.goal?.percent == null ? 'Sin objetivo' : `${w.goal.percent}%`}</h2><b>{w.goal?.target ? `${w.goal.completed} de ${w.goal.target} canciones` : 'Podés fijar un objetivo desde tus preferencias'}</b></div>
        <div className="tile green"><small>CONTENIDOS AGREGADOS</small><h2>{w.items_added || 0}</h2><b>{w.reviews_written || 0} reseñas escritas</b></div>
      </div>
      <Section title="Tus artistas más escuchados">
        {(w.top_artists || []).map((a, i) => (
          <div className="rank" key={i}>
            <b>{i + 1}</b>
            <Cover src={a.cover_url} />
            <span>{a.name}<small>{a.minutes} min</small></span>
          </div>
        ))}
      </Section>
      <Section title="Tus canciones más escuchadas">
        {(w.top_tracks || []).map((x, i) => (
          <div className="track-row" key={i}>
            <Cover src={x.content?.cover_url} />
            <span><b>{x.content?.title}</b><small>{x.content?.artist_name}</small></span>
            <b>{x.plays} plays</b>
          </div>
        ))}
      </Section>
      <div className="wrapped-end">
        <Sparkles />
        <h2>Gracias por compartir tu año con música.</h2>
      </div>
    </div>
  );
}

function AuthPage({ mode }) {
  const { login, register } = useAuth();
  const nav = useNavigate();

  const [f, setF] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFieldErrors({});
    setError('');
  }, [mode]);

  function updateField(field, value) {
    setF((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (error) setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (mode === 'register' && f.password !== f.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await login({ email: f.email.trim(), password: f.password });
      } else {
        await register({
          username: f.username.trim(),
          email: f.email.trim(),
          password: f.password,
        });
      }
      nav('/');
    } catch (err) {
      const { message, fieldErrors: errors } = getFormErrors(err);
      setFieldErrors(errors);
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="brand">
          <i><Music2 /></i> My <b>Collection</b>
        </div>
        <div>
          <small>TU MÚSICA. TU HISTORIA.</small>
          <h1>Todo lo que<br />escuchás, <em>en un solo lugar.</em></h1>
          <p>Armá tu biblioteca musical, guardá tus favoritos y descubrí tus estadísticas.</p>
        </div>
        <Disc3 />
      </div>

      <div className="auth-side">
        <form onSubmit={submit} noValidate>
          <small>{mode === 'login' ? 'QUÉ BUENO TENERTE DE VUELTA' : 'EMPEZÁ TU COLECCIÓN'}</small>
          <h2>{mode === 'login' ? 'Iniciá sesión' : 'Crear cuenta'}</h2>
          <p>{mode === 'login' ? 'Entrá para seguir disfrutando de tu música.' : 'Armá tu biblioteca musical en un minuto.'}</p>

          {mode === 'register' && (
            <label>
              Nombre de usuario
              <input
                value={f.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="mati_music"
              />
              {fieldErrors.username && <small className="error">{fieldErrors.username}</small>}
            </label>
          )}

          <label>
            Correo electrónico
            <input
              type="email"
              value={f.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="nombre@correo.com"
            />
            {fieldErrors.email && <small className="error">{fieldErrors.email}</small>}
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={f.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="••••••••"
            />
            {fieldErrors.password && <small className="error">{fieldErrors.password}</small>}
          </label>

          {mode === 'register' && (
            <label>
              Confirmar contraseña
              <input
                type="password"
                value={f.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="••••••••"
              />
              {fieldErrors.confirmPassword && <small className="error">{fieldErrors.confirmPassword}</small>}
            </label>
          )}

          {error && <div className="error">{error}</div>}

          <button className="btn submit" disabled={busy}>
            {busy ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Registrarme'}
          </button>

          <div className="switch">
            {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <NavLink to={mode === 'login' ? '/register' : '/login'}>
              {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
            </NavLink>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProtectedApp() {
  return (
    <Guard>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorar" element={<Explore />} />
          <Route path="/detalle/:type/:externalId" element={<Detail />} />
          <Route path="/biblioteca" element={<LibraryPage />} />
          <Route path="/colecciones" element={<CollectionsPage />} />
          <Route path="/colecciones/:id" element={<CollectionDetailPage />} />
          <Route path="/estadisticas" element={<Stats />} />
          <Route path="/wrapped/:year" element={<Wrapped />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Guard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
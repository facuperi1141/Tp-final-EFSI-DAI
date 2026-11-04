// Crea (o rehace) la cuenta de demostración con datos con historia.
// Es idempotente: se puede correr varias veces y siempre deja lo mismo, sin duplicar.
// Los contenidos se buscan en Deezer en el momento, así los ids son reales.
// Uso: npm run db:seed   (necesita DEMO_USER_PASSWORD en el .env)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { DATABASE_URL, DATABASE_SSL, DEMO_USER_PASSWORD } = process.env;
const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || 'demo@mycollection.app').toLowerCase();

if (!DATABASE_URL || !DEMO_USER_PASSWORD) {
  console.error('Faltan DATABASE_URL o DEMO_USER_PASSWORD en el .env');
  process.exit(1);
}

// status, favorito, puntuación y hace cuántos días se agregó.
// changedAfter: días después de agregarlo en que pasó a su estado final
const TRACKS = [
  { artist: 'Soda Stereo', track: 'De Música Ligera', genres: ['Rock nacional', 'Rock'], status: 'favorito', fav: true, rating: 5, added: 170, changedAfter: 3 },
  { artist: 'Gustavo Cerati', track: 'Crimen', genres: ['Rock nacional', 'Pop'], status: 'favorito', fav: true, rating: 5, added: 160, changedAfter: 10 },
  { artist: 'Charly García', track: 'Demoliendo Hoteles', genres: ['Rock nacional', 'Rock'], status: 'escuchado', fav: true, rating: 4, added: 150, changedAfter: 5 },
  { artist: 'Fito Paez', track: 'Mariposa Tecknicolor', genres: ['Rock nacional', 'Pop'], status: 'escuchado', fav: false, rating: 4, added: 140, changedAfter: 7 },
  { artist: 'Patricio Rey y sus Redonditos de Ricota', track: 'Jijiji', genres: ['Rock nacional', 'Rock'], status: 'escuchado', fav: false, rating: 3, added: 120, changedAfter: 20 },
  { artist: 'Queen', track: 'Bohemian Rhapsody', genres: ['Rock'], status: 'favorito', fav: true, rating: 5, added: 110, changedAfter: 2 },
  { artist: 'The Beatles', track: 'Here Comes The Sun', genres: ['Rock', 'Pop'], status: 'escuchado', fav: true, rating: 4, added: 95, changedAfter: 4 },
  { artist: 'Radiohead', track: 'Karma Police', genres: ['Alternativo', 'Rock'], status: 'escuchado', fav: false, rating: null, added: 80, changedAfter: 12 },
  { artist: 'Daft Punk', track: 'Get Lucky', genres: ['Electrónica', 'Dance'], status: 'escuchando', fav: true, rating: null, added: 60, changedAfter: 6 },
  { artist: 'Arctic Monkeys', track: 'Do I Wanna Know?', genres: ['Alternativo', 'Rock'], status: 'escuchando', fav: false, rating: 3, added: 45, changedAfter: 3 },
  { artist: 'Bizarrap', track: 'Quevedo: Bzrp Music Sessions, Vol. 52', genres: ['Electrónica', 'Urbano latino'], status: 'escuchando', fav: false, rating: null, added: 30, changedAfter: 1 },
  { artist: 'Nirvana', track: 'Smells Like Teen Spirit', genres: ['Rock', 'Grunge'], status: 'quiero_escuchar', fav: false, rating: null, added: 20 },
  { artist: 'Bad Bunny', track: 'Tití Me Preguntó', genres: ['Urbano latino', 'Reggaetón'], status: 'quiero_escuchar', fav: false, rating: null, added: 12 },
  { artist: 'Taylor Swift', track: 'Anti-Hero', genres: ['Pop'], status: 'quiero_escuchar', fav: false, rating: null, added: 8 },
  { artist: 'Luis Alberto Spinetta', track: 'Seguir viviendo sin tu amor', genres: ['Rock nacional'], status: 'escuchado', fav: false, rating: 5, added: 70, changedAfter: 2 },
];

// Deezer suele devolver la fecha de la reedición; para las décadas se usa el año original
const ORIGINAL_YEARS = [1990, 2006, 1984, 1994, 1986, 1975, 1969, 1997, 2013, 2013, 2022, 1991, 2022, 2022, 1986];
TRACKS.forEach((entry, i) => {
  entry.year = ORIGINAL_YEARS[i];
});

const REVIEWS = [
  { track: 0, days: 160, body: 'El cierre de Soda en River. Cada vez que la escucho es como estar ahí. Un clásico que no envejece.' },
  { track: 1, days: 140, body: 'La mejor canción de Cerati solista para mí. La letra y los arreglos de cuerdas son perfectos.' },
  { track: 5, days: 105, body: 'Seis minutos que pasan volando. No hay otra canción que cambie tanto de estilo y funcione así de bien.' },
  { track: 4, days: 90, body: 'Me costó entrar, pero en vivo es otra cosa. El pogo más grande del mundo tiene sentido.' },
];

const COLLECTIONS = [
  { name: 'Rock nacional', description: 'Lo mejor del rock argentino', days: 155, tracks: [0, 1, 2, 3, 4, 14] },
  { name: 'Para estudiar', description: 'Tranquilas, para concentrarse', days: 75, tracks: [7, 6, 9, 14] },
  { name: 'Clásicos de siempre', description: 'Las que nunca fallan', days: 100, tracks: [5, 6, 13, 11, 0] },
];

// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (days, hour = 20) => {
  const date = new Date(now - days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
};

// Pseudoaleatorio con semilla fija: el historial generado es siempre el mismo
function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function deezer(path) {
  const res = await fetch(`https://api.deezer.com${path}`, { signal: AbortSignal.timeout(10000) });
  const data = await res.json();
  if (data.error) throw new Error(`Deezer: ${data.error.message}`);
  return data;
}

async function findTrack({ artist, track, genres, year: originalYear }) {
  const q = encodeURIComponent(`artist:"${artist}" track:"${track}"`);
  let { data } = await deezer(`/search/track?q=${q}&limit=1`);
  if (!data.length) ({ data } = await deezer(`/search/track?q=${encodeURIComponent(`${artist} ${track}`)}&limit=1`));
  if (!data.length) throw new Error(`No se encontró en Deezer: ${artist} - ${track}`);

  const found = data[0];

  return {
    source: 'deezer',
    external_id: String(found.id),
    type: 'track',
    title: found.title,
    artist_name: found.artist.name,
    album_name: found.album.title,
    cover_url: found.album.cover_xl || found.album.cover_big,
    duration_ms: found.duration * 1000,
    release_year: originalYear,
    genres,
  };
}

// ---------------------------------------------------------------------------

console.log('Buscando contenidos en Deezer...');
const contents = [];
for (const entry of TRACKS) {
  contents.push(await findTrack(entry));
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_SSL === 'true',
});
await client.connect();

try {
  await client.query('BEGIN');

  const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);
  const { rows: users } = await client.query(
    `INSERT INTO users (username, email, password_hash, display_name, bio, avatar_url, created_at)
     VALUES ('demo', $1, $2, 'Demo Melómana', $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       display_name = EXCLUDED.display_name,
       bio = EXCLUDED.bio,
       avatar_url = EXCLUDED.avatar_url
     RETURNING id`,
    [
      DEMO_EMAIL,
      passwordHash,
      'Fanática del rock nacional y de descubrir música nueva. Siempre con auriculares.',
      'https://api.dicebear.com/9.x/notionists/png?seed=MyCollectionDemo&size=256',
      daysAgo(180, 10),
    ],
  );
  const userId = users[0].id;

  // Se borra lo anterior de la cuenta demo para rehacerlo igual
  for (const table of ['activities', 'listening_history', 'reviews', 'library_items', 'collections']) {
    await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
  }

  await client.query(
    `INSERT INTO user_preferences (user_id, favorite_genres, language, is_public, yearly_goal)
     VALUES ($1, $2, 'es', true, 120)
     ON CONFLICT (user_id) DO UPDATE SET
       favorite_genres = EXCLUDED.favorite_genres, language = 'es', is_public = true, yearly_goal = 120`,
    [userId, ['Rock nacional', 'Rock', 'Alternativo', 'Electrónica']],
  );

  const activity = (type, date, { contentId = null, collectionId = null, metadata = {} } = {}) =>
    client.query(
      `INSERT INTO activities (user_id, type, content_id, collection_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, contentId, collectionId, metadata, date],
    );

  // Contenidos y biblioteca
  const contentIds = [];
  for (const [i, content] of contents.entries()) {
    const { rows } = await client.query(
      `INSERT INTO contents (source, external_id, type, title, artist_name, album_name, cover_url, duration_ms, release_year, genres)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (source, external_id) DO UPDATE SET
         title = EXCLUDED.title, artist_name = EXCLUDED.artist_name, album_name = EXCLUDED.album_name,
         cover_url = EXCLUDED.cover_url, duration_ms = EXCLUDED.duration_ms,
         release_year = EXCLUDED.release_year, genres = EXCLUDED.genres
       RETURNING id`,
      [content.source, content.external_id, content.type, content.title, content.artist_name,
        content.album_name, content.cover_url, content.duration_ms, content.release_year, content.genres],
    );
    const contentId = rows[0].id;
    contentIds.push(contentId);

    const entry = TRACKS[i];
    const addedAt = daysAgo(entry.added);
    const changedAt = entry.changedAfter ? daysAgo(entry.added - entry.changedAfter, 22) : addedAt;
    const meta = { title: content.title, artist: content.artist_name };

    await client.query(
      `INSERT INTO library_items (user_id, content_id, status, is_favorite, rating, added_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, contentId, entry.status, entry.fav, entry.rating, addedAt, changedAt],
    );

    const initialStatus = entry.changedAfter ? 'quiero_escuchar' : entry.status;
    await activity('added', addedAt, { contentId, metadata: { ...meta, status: initialStatus } });
    if (entry.changedAfter) {
      await activity('status_changed', changedAt, {
        contentId,
        metadata: { ...meta, from: 'quiero_escuchar', to: entry.status },
      });
    }
    if (entry.fav) await activity('favorited', changedAt, { contentId, metadata: meta });
    if (entry.rating) await activity('rated', changedAt, { contentId, metadata: { ...meta, rating: entry.rating } });
  }

  // Reseñas
  for (const review of REVIEWS) {
    const contentId = contentIds[review.track];
    const date = daysAgo(review.days, 23);
    await client.query(
      'INSERT INTO reviews (user_id, content_id, body, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)',
      [userId, contentId, review.body, date],
    );
    await activity('reviewed', date, {
      contentId,
      metadata: { title: contents[review.track].title, artist: contents[review.track].artist_name, excerpt: review.body.slice(0, 120) },
    });
  }

  // Playlists
  for (const collection of COLLECTIONS) {
    const createdAt = daysAgo(collection.days, 18);
    const { rows } = await client.query(
      `INSERT INTO collections (user_id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4) RETURNING id`,
      [userId, collection.name, collection.description, createdAt],
    );
    const collectionId = rows[0].id;
    await activity('collection_created', createdAt, { collectionId, metadata: { name: collection.name } });

    for (const [position, trackIndex] of collection.tracks.entries()) {
      const addedAt = new Date(createdAt.getTime() + (position + 1) * 60 * 60 * 1000);
      await client.query(
        'INSERT INTO collection_items (collection_id, content_id, position, added_at) VALUES ($1, $2, $3, $4)',
        [collectionId, contentIds[trackIndex], position + 1, addedAt],
      );
      await activity('collection_item_added', addedAt, {
        contentId: contentIds[trackIndex],
        collectionId,
        metadata: { name: collection.name, title: contents[trackIndex].title, artist: contents[trackIndex].artist_name },
      });
    }
  }

  // Historial de escucha simulado para el Wrapped: más reproducciones en lo mejor puntuado
  const rand = random(2026);
  let plays = 0;
  for (const [i, entry] of TRACKS.entries()) {
    if (entry.status === 'quiero_escuchar') continue;
    const weight = (entry.rating ?? 3) + (entry.fav ? 3 : 0);
    const count = Math.round(weight * 4 + rand() * 6);
    for (let p = 0; p < count; p++) {
      const day = Math.floor(rand() * entry.added);
      // Más que nada a la noche
      const hour = [8, 13, 18, 20, 21, 22, 23, 23][Math.floor(rand() * 8)];
      const playedAt = daysAgo(day, hour);
      playedAt.setMinutes(Math.floor(rand() * 60));
      const fullListen = rand() > 0.2;
      const ms = fullListen ? contents[i].duration_ms : Math.floor(contents[i].duration_ms * rand());
      await client.query(
        'INSERT INTO listening_history (user_id, content_id, played_at, ms_played) VALUES ($1, $2, $3, $4)',
        [userId, contentIds[i], playedAt, ms],
      );
      plays++;
    }
  }

  await client.query('COMMIT');
  console.log(`Listo: cuenta ${DEMO_EMAIL} con ${contents.length} contenidos, ${REVIEWS.length} reseñas, ` +
    `${COLLECTIONS.length} playlists y ${plays} reproducciones.`);
} catch (err) {
  await client.query('ROLLBACK');
  if (err.constraint === 'users_username_key') {
    console.error('Falló el seed: el usuario "demo" ya existe con otro email. Cambiá DEMO_USER_EMAIL o borrá esa cuenta.');
  } else {
    console.error('Falló el seed:', err.message);
  }
  process.exitCode = 1;
} finally {
  await client.end();
}

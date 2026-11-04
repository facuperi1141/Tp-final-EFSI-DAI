-- 001_init.sql: estructura inicial de My Collection (temática: música)

CREATE TYPE content_source AS ENUM ('deezer', 'spotify');
CREATE TYPE content_type AS ENUM ('track', 'album', 'artist');
CREATE TYPE library_status AS ENUM ('quiero_escuchar', 'escuchando', 'escuchado', 'favorito');
CREATE TYPE activity_type AS ENUM (
  'added',
  'removed',
  'status_changed',
  'favorited',
  'unfavorited',
  'rated',
  'reviewed',
  'review_updated',
  'review_deleted',
  'collection_created',
  'collection_updated',
  'collection_deleted',
  'collection_item_added',
  'collection_item_removed'
);

-- Pone updated_at = now() en cada UPDATE
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Usuarios ---------------------------------------------------------------

CREATE TABLE users (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      varchar(30)  NOT NULL CHECK (username ~ '^[A-Za-z0-9_.]{3,30}$'),
  email         varchar(255) NOT NULL CHECK (email = lower(email)),
  password_hash text         NOT NULL,
  display_name  varchar(60),
  bio           varchar(500),
  avatar_url    varchar(500),
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- Únicos sin distinguir mayúsculas: "Matias" y "matias" son el mismo usuario
CREATE UNIQUE INDEX users_username_key ON users (lower(username));
CREATE UNIQUE INDEX users_email_key ON users (email);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_preferences (
  user_id         integer PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  favorite_genres text[]      NOT NULL DEFAULT '{}',
  language        varchar(10) NOT NULL DEFAULT 'es',
  is_public       boolean     NOT NULL DEFAULT false,
  yearly_goal     integer     CHECK (yearly_goal BETWEEN 1 AND 100000),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Contenidos: caché de lo que viene de la API externa --------------------

CREATE TABLE contents (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source       content_source NOT NULL,
  external_id  varchar(64)    NOT NULL,
  type         content_type   NOT NULL,
  title        varchar(300)   NOT NULL,
  artist_name  varchar(300),
  album_name   varchar(300),
  cover_url    varchar(500),
  duration_ms  integer  CHECK (duration_ms >= 0),
  release_year smallint CHECK (release_year BETWEEN 1800 AND 2100),
  genres       text[]   NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE TRIGGER contents_updated_at BEFORE UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Biblioteca ---------------------------------------------------------------

CREATE TABLE library_items (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_id  integer NOT NULL REFERENCES contents (id) ON DELETE CASCADE,
  status      library_status NOT NULL DEFAULT 'quiero_escuchar',
  is_favorite boolean  NOT NULL DEFAULT false,
  rating      smallint CHECK (rating BETWEEN 1 AND 5),
  added_at    timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)  -- este índice también sirve para buscar por user_id
);

CREATE INDEX library_items_user_status_idx ON library_items (user_id, status);

CREATE TRIGGER library_items_updated_at BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Reseñas ------------------------------------------------------------------

CREATE TABLE reviews (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_id integer NOT NULL REFERENCES contents (id) ON DELETE CASCADE,
  body       text    NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

CREATE INDEX reviews_content_idx ON reviews (content_id);

CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Colecciones (playlists) --------------------------------------------------

CREATE TABLE collections (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name        varchar(100) NOT NULL CHECK (char_length(btrim(name)) > 0),
  description varchar(500),
  cover_url   varchar(500),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Un usuario no puede tener dos playlists con el mismo nombre
CREATE UNIQUE INDEX collections_user_name_key ON collections (user_id, lower(name));

CREATE TRIGGER collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE collection_items (
  collection_id integer NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  content_id    integer NOT NULL REFERENCES contents (id) ON DELETE CASCADE,
  position      integer NOT NULL,
  added_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, content_id)
);

-- Actividad ----------------------------------------------------------------

CREATE TABLE activities (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type          activity_type NOT NULL,
  -- SET NULL: si se borra la playlist, la actividad queda y guarda el nombre en metadata
  content_id    integer REFERENCES contents (id) ON DELETE SET NULL,
  collection_id integer REFERENCES collections (id) ON DELETE SET NULL,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activities_user_created_idx ON activities (user_id, created_at DESC);

-- Historial de escucha (opcional, para el Wrapped) -------------------------

CREATE TABLE listening_history (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_id integer NOT NULL REFERENCES contents (id) ON DELETE CASCADE,
  played_at  timestamptz NOT NULL,
  ms_played  integer NOT NULL CHECK (ms_played >= 0)
);

CREATE INDEX listening_history_user_played_idx ON listening_history (user_id, played_at DESC);

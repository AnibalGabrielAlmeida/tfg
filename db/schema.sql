-- Activar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabla de tonalidades (relación con el diagrama Musical_Key)
CREATE TABLE musical_key (
  id SERIAL PRIMARY KEY,
  tonic VARCHAR(10) NOT NULL,              -- ej: 'C', 'Eb', 'F#'
  mode VARCHAR(10) NOT NULL                -- ej: 'MAJOR', 'MINOR'
);

-- Tabla de progresiones
-- Aquí es donde usamos JSONB para guardar los acordes del prototipo
CREATE TABLE progressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_id INT REFERENCES musical_key(id),
  title VARCHAR(255) NOT NULL,
  style VARCHAR(50),                        -- 'POP', 'NEO', etc.
  bpm INT,
  time_signature VARCHAR(10),               -- '4/4', '3/4', etc.
  data JSONB NOT NULL,                      -- aquí va el array de ChordBlock del front
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

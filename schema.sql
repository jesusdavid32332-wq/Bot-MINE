-- ==============================================================================
-- Schema SQL para Neon PostgreSQL (Mines AI Bot - @chatrolexbot)
-- Compatible con Vercel Serverless y Neon Serverless Driver
-- ==============================================================================

-- 1. Tabla de Usuarios de Telegram
CREATE TABLE IF NOT EXISTS users (
    telegram_id VARCHAR(64) PRIMARY KEY,
    id VARCHAR(64) NOT NULL,
    first_name VARCHAR(255) DEFAULT '',
    last_name VARCHAR(255) DEFAULT '',
    username VARCHAR(255) DEFAULT '',
    current_step VARCHAR(64) NOT NULL DEFAULT 'INICIO',
    declared_country VARCHAR(100),
    experience_level VARCHAR(64),
    account_id VARCHAR(100),
    account_status VARCHAR(64) NOT NULL DEFAULT 'sin_registrar',
    notes TEXT DEFAULT '',
    messages_count INTEGER NOT NULL DEFAULT 0,
    has_deposited BOOLEAN NOT NULL DEFAULT FALSE,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_current_step ON users(current_step);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC);

-- 2. Tabla de Plantillas de Mensajes del Bot (15 Pasos deterministas)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    type VARCHAR(64) NOT NULL DEFAULT 'text',
    text TEXT NOT NULL,
    buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
    media_url TEXT,
    condition_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_step VARCHAR(64),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_order_index ON messages(order_index ASC);

-- 3. Tabla de Conversaciones e Historial de Mensajes por Usuario
CREATE TABLE IF NOT EXISTS conversations (
    user_id VARCHAR(64) PRIMARY KEY,
    telegram_id VARCHAR(64) NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_interaction TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_telegram_id ON conversations(telegram_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_interaction ON conversations(last_interaction DESC);

-- 4. Tabla de Biblioteca Multimedia
CREATE TABLE IF NOT EXISTS media_items (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    step_association VARCHAR(64),
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Condiciones y Palabras Clave Deterministas
CREATE TABLE IF NOT EXISTS conditions (
    id VARCHAR(64) PRIMARY KEY,
    affirmative JSONB NOT NULL DEFAULT '[]'::jsonb,
    negative JSONB NOT NULL DEFAULT '[]'::jsonb,
    country_keywords JSONB NOT NULL DEFAULT '{}'::jsonb,
    account_id_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Ajustes del Sistema y Configuración del Bot
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(64) PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Deduplicación e Idempotencia de Updates de Telegram
CREATE TABLE IF NOT EXISTS processed_updates (
    update_id VARCHAR(128) PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processed_updates_processed_at ON processed_updates(processed_at DESC);

-- 8. Tabla de Tutoriales Paso a Paso
CREATE TABLE IF NOT EXISTS tutorials (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de Enlaces de Registro y Afiliados Rastreados
CREATE TABLE IF NOT EXISTS tracked_links (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabla de Tickets de Soporte
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(64) PRIMARY KEY,
    telegram_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(255) DEFAULT '',
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

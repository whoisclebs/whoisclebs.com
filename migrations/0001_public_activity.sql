-- Migration number: 0001 	 cache de atividade pública (spec §1)
-- Só estado dinâmico e público. Nada editorial no D1.

-- Cache dos eventos públicos já filtrados pelo domínio (máx. 10 publicados por sincronização).
CREATE TABLE public_activity (
  external_id TEXT PRIMARY KEY NOT NULL,          -- ID do evento na fonte; garante upsert idempotente
  kind TEXT NOT NULL CHECK (kind IN ('push', 'create', 'release', 'pull_request', 'issue', 'star')),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  url TEXT NOT NULL CHECK (url LIKE 'https://github.com/%'),
  occurred_at TEXT NOT NULL                       -- ISO 8601 UTC
) STRICT;

CREATE INDEX public_activity_occurred_at ON public_activity (occurred_at DESC);

-- Um registro por fonte: carimbo do último sucesso, ETag para If-None-Match e último erro resumido.
CREATE TABLE sync_cursor (
  source TEXT PRIMARY KEY NOT NULL,
  last_success_at TEXT,
  etag TEXT,
  last_error TEXT CHECK (last_error IS NULL OR length(last_error) <= 200)
) STRICT;

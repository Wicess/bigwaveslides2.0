-- Postgres extensions used by Big Wave Slides search (Phase 9).
-- pg_trgm: fuzzy / typo-tolerant text search.
-- vector (pgvector): semantic "AI" product search via embeddings.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

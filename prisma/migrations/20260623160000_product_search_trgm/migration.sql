-- Phase 9 — typo-tolerant product search.
-- Requires the pg_trgm extension (enabled in prisma/extensions.sql).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN index accelerates similarity() and ILIKE on the denormalized
-- search column used by the shop search box and /api/search.
CREATE INDEX IF NOT EXISTS "Product_searchText_trgm_idx"
  ON "Product"
  USING gin ("searchText" gin_trgm_ops);

-- Migration: add image_url and original_url to catalog_actors and catalog_actresses
-- This file uses a Drizzle-compatible name (numeric prefix) so drizzle-kit migrate will apply it.

BEGIN;

ALTER TABLE catalog_actors
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS original_url text;

ALTER TABLE catalog_actresses
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS original_url text;

COMMIT;

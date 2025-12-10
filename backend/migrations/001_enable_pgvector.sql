-- Migration 001: Enable pgvector extension
-- Date: 2025-12-10
-- Description: Enables pgvector extension for AI embeddings

-- Enable pgvector extension (for AI embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Note: The incidents table and columns will be created by SQLAlchemy models
-- This migration only ensures pgvector extension is available
-- PostGIS can be added later if needed for advanced spatial queries

-- ===== VERIFICATION QUERIES =====
-- Run these to verify the migration:
-- SELECT * FROM pg_extension WHERE extname = 'vector';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'incidents' AND column_name IN ('clip_embedding', 'cluster_id');
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'incidents';

-- KalaSetu Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables and storage policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: artisans
-- ============================================================
CREATE TABLE IF NOT EXISTS artisans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_long DOUBLE PRECISION,
  state TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Run this if the table already exists (Supabase SQL Editor):
-- ALTER TABLE artisans ADD COLUMN IF NOT EXISTS state TEXT;

-- ============================================================
-- TABLE: artifacts
-- ============================================================
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  art_form TEXT,
  image_url TEXT,
  qr_code_url TEXT,
  cryptographic_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Run this if the table already exists (Supabase SQL Editor):
-- ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS cryptographic_signature TEXT;

-- ============================================================
-- TABLE: stories
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  original_voice_note_url TEXT,
  raw_transcript TEXT,
  generated_narrative_english TEXT,
  generated_narrative_hindi TEXT,
  vision_tags JSONB,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Success', 'Failed')) DEFAULT 'Pending',
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (optional - disable for hackathon MVP)
-- ============================================================
-- ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STORAGE BUCKETS
-- Note: Create these via the Supabase Dashboard > Storage
-- Or via the API. Three buckets are needed:
--   1. artifact_images  (public)
--   2. voice_notes      (public)
--   3. qr_codes         (public)
-- ============================================================

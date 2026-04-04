-- Migration 002: Deadlines & Template Support

-- Add deadline tracking to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- Configurable deadlines table (set by coordinators)
CREATE TABLE IF NOT EXISTS deadlines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL,
  work_term     VARCHAR(50) NOT NULL,
  due_date      TIMESTAMPTZ NOT NULL,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_deadline UNIQUE (document_type, work_term)
);

-- Seed a default deadline for the current term
INSERT INTO deadlines (document_type, work_term, due_date)
VALUES ('work_term_report', 'Winter 2026', '2026-04-30T23:59:59Z')
ON CONFLICT (document_type, work_term) DO NOTHING;

-- Co-op Support Application - Database Schema
-- Migration 001: Initial Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'coordinator', 'employer', 'admin');

CREATE TYPE application_status AS ENUM (
  'draft',
  'pending',
  'provisionally_accepted',
  'provisionally_rejected',
  'finally_accepted',
  'finally_rejected'
);

CREATE TYPE document_type AS ENUM ('work_term_report', 'employer_evaluation');

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          user_role NOT NULL,
  student_id    VARCHAR(20) UNIQUE,
  company_name  VARCHAR(255),
  phone         VARCHAR(20),
  is_verified   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  totp_secret   VARCHAR(255),
  totp_enabled  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);

-- ============================================================
-- EMAIL VERIFICATION CODES
-- ============================================================

CREATE TABLE email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_user ON email_verifications(user_id);

-- ============================================================
-- ONBOARDING INVITATIONS (Coordinator / Employer invite-only)
-- ============================================================

CREATE TABLE invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      VARCHAR(255) UNIQUE NOT NULL,
  email      VARCHAR(255) NOT NULL,
  full_name  VARCHAR(255) NOT NULL,
  role       user_role NOT NULL CHECK (role IN ('coordinator', 'employer')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status     invitation_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ============================================================
-- CO-OP APPLICATIONS
-- ============================================================

CREATE TABLE applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                application_status DEFAULT 'draft',
  gpa                   DECIMAL(3,2),
  program               VARCHAR(255),
  year_of_study         INTEGER,
  cover_letter          TEXT,
  additional_info       TEXT,
  phone                 VARCHAR(20),
  address               TEXT,
  autosave_data         JSONB,
  submitted_at          TIMESTAMPTZ,
  provisional_reviewed_by UUID REFERENCES users(id),
  provisional_reviewed_at TIMESTAMPTZ,
  final_reviewed_by     UUID REFERENCES users(id),
  final_reviewed_at     TIMESTAMPTZ,
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_student_application UNIQUE (student_id)
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_gpa ON applications(gpa);

-- ============================================================
-- DOCUMENTS (Work Term Reports & Employer Evaluations)
-- ============================================================

CREATE TABLE documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type    document_type NOT NULL,
  file_path        VARCHAR(500),
  file_name        VARCHAR(255),
  file_size        INTEGER,
  confirmation_number VARCHAR(20) UNIQUE NOT NULL,
  is_online_form   BOOLEAN DEFAULT FALSE,
  form_data        JSONB,
  uploaded_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_student ON documents(student_id);
CREATE INDEX idx_documents_uploader ON documents(uploader_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- ============================================================
-- EMPLOYER-STUDENT ASSIGNMENTS
-- ============================================================

CREATE TABLE employer_student_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_term   VARCHAR(50),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_employer_student UNIQUE (employer_id, student_id)
);

CREATE INDEX idx_assignments_employer ON employer_student_assignments(employer_id);
CREATE INDEX idx_assignments_student ON employer_student_assignments(student_id);

-- ============================================================
-- PLACEMENT TRACKER (accepted students without placement)
-- ============================================================

CREATE TABLE placement_tracker (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  status      VARCHAR(50) DEFAULT 'seeking',
  notes       TEXT,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracker_student ON placement_tracker(student_id);
CREATE INDEX idx_tracker_status ON placement_tracker(status);

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================

CREATE TABLE password_resets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG (optional, for compliance tracking)
-- ============================================================

CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(255) NOT NULL,
  entity     VARCHAR(100),
  entity_id  UUID,
  details    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);

-- ============================================================
-- SEED: Default admin user (password: Admin123!@#)
-- ============================================================

INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active)
VALUES (
  'admin@csa-portal.com',
  '$2a$12$FqQIHm8gSAANli0HD9H9kujBVRCOfuIZcpIyZhxOKbSOx4KEAQxDG',
  'System Administrator',
  'admin',
  true,
  true
);

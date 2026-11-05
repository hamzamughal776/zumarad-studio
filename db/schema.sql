-- Apply with a dedicated least-privilege database role.
-- Example: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/schema.sql

CREATE TABLE IF NOT EXISTS contact_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  company VARCHAR(120) NOT NULL DEFAULT '',
  project_type VARCHAR(40) NOT NULL CHECK (project_type IN (
    'business-website','ecommerce','web-application','ui-ux',
    'ai-integration','maintenance','other'
  )),
  budget_range VARCHAR(20) NOT NULL CHECK (budget_range IN (
    'not-sure','under-500','500-1500','1500-5000','5000-plus'
  )),
  preferred_timeline VARCHAR(20) NOT NULL CHECK (preferred_timeline IN (
    'asap','2-4-weeks','1-3-months','flexible'
  )),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 20 AND 4000),
  consent_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','replied','closed','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx
  ON contact_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx
  ON contact_submissions (status, created_at DESC);

-- Future tables for authenticated administration, leads, proposals, clients,
-- invoices and maintenance should be added only with explicit access-control
-- design, migrations, retention rules and audit requirements.

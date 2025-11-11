-- Surveying Division Database Schema
-- Run this in Supabase SQL Editor

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- LOOKUP TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS crs_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  wkt TEXT,
  proj4text TEXT,
  authority VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accuracy_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tolerance_mm NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sla_days INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'job', 'plan', 'control_point', etc.
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SURVEYORS & ACCREDITATION
-- =====================================================

CREATE TABLE IF NOT EXISTS surveyors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entra_id VARCHAR(255) UNIQUE, -- Microsoft Entra ID user ID
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  license_no VARCHAR(100) UNIQUE,
  license_expiry DATE,
  company VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, expired
  competencies JSONB DEFAULT '[]'::jsonb,
  cpd_hours INTEGER DEFAULT 0,
  conflict_declarations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INSTRUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(100) NOT NULL, -- GNSS, Total Station, Level, etc.
  make VARCHAR(100),
  model VARCHAR(100),
  serial_no VARCHAR(100) UNIQUE NOT NULL,
  calibration_due DATE,
  status VARCHAR(50) DEFAULT 'available', -- available, in-use, maintenance, retired
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SURVEY JOBS
-- =====================================================

CREATE TABLE IF NOT EXISTS survey_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number VARCHAR(100) UNIQUE NOT NULL,
  case_id VARCHAR(100), -- Link to land case
  title_id VARCHAR(100), -- Link to title system
  lrc_ref VARCHAR(100), -- Land Registration Commission reference
  request_source VARCHAR(100) NOT NULL, -- ROT, external, court, enforcement
  purpose TEXT NOT NULL,
  job_type_id UUID REFERENCES job_types(id),
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  status VARCHAR(50) DEFAULT 'registered', -- registered, assigned, field_work, processing, qa, endorsed, completed, cancelled
  assigned_to UUID REFERENCES surveyors(id),
  assigned_date TIMESTAMPTZ,
  sla_due DATE,
  location_description TEXT,
  site_geom GEOMETRY(Point, 4326), -- Approximate site location
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_jobs_status ON survey_jobs(status);
CREATE INDEX IF NOT EXISTS idx_survey_jobs_assigned ON survey_jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_survey_jobs_sla ON survey_jobs(sla_due);
CREATE INDEX IF NOT EXISTS idx_survey_jobs_geom ON survey_jobs USING GIST(site_geom);

-- =====================================================
-- WORK ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_job_id UUID REFERENCES survey_jobs(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  site_access TEXT,
  safety_notes TEXT,
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  instruments JSONB DEFAULT '[]'::jsonb, -- Array of instrument IDs
  vehicle VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft', -- draft, approved, in-progress, completed
  checklist JSONB DEFAULT '[]'::jsonb,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_job ON work_orders(survey_job_id);

-- =====================================================
-- CONTROL POINTS (with PostGIS)
-- =====================================================

CREATE TABLE IF NOT EXISTS control_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) UNIQUE NOT NULL,
  geom GEOMETRY(PointZ, 4326) NOT NULL, -- 3D point with lat/lon/height
  datum VARCHAR(50) NOT NULL,
  accuracy_class_id UUID REFERENCES accuracy_classes(id),
  installed_on DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, deprecated, destroyed
  monument_type VARCHAR(100),
  description TEXT,
  history JSONB DEFAULT '[]'::jsonb, -- Version history
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_control_points_geom ON control_points USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_control_points_code ON control_points(code);

-- =====================================================
-- FIELD UPLOADS
-- =====================================================

CREATE TABLE IF NOT EXISTS field_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_job_id UUID REFERENCES survey_jobs(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- GNSS, RINEX, CSV, photo, field_notes, etc.
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL, -- SharePoint or Supabase Storage URL
  file_size BIGINT,
  checksum VARCHAR(64),
  uploaded_by UUID REFERENCES surveyors(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  validations JSONB DEFAULT '{}'::jsonb, -- Validation results
  status VARCHAR(50) DEFAULT 'pending', -- pending, validated, rejected
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_field_uploads_job ON field_uploads(survey_job_id);

-- =====================================================
-- PROCESSING RUNS
-- =====================================================

CREATE TABLE IF NOT EXISTS processing_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_job_id UUID REFERENCES survey_jobs(id) ON DELETE CASCADE,
  control_set JSONB DEFAULT '[]'::jsonb, -- Array of control point IDs used
  crs_id UUID REFERENCES crs_library(id),
  residuals JSONB DEFAULT '{}'::jsonb, -- Least squares adjustment residuals
  accuracy_class_id UUID REFERENCES accuracy_classes(id),
  qa_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  reviewer_id UUID REFERENCES surveyors(id),
  review_date TIMESTAMPTZ,
  review_notes TEXT,
  report_url TEXT, -- Link to processing report
  created_by UUID REFERENCES surveyors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_runs_job ON processing_runs(survey_job_id);

-- =====================================================
-- SURVEY PLANS
-- =====================================================

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_job_id UUID REFERENCES survey_jobs(id) ON DELETE CASCADE,
  plan_no VARCHAR(100) UNIQUE, -- Official survey plan number (issued on endorsement)
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft', -- draft, review, endorsed, superseded
  sheet_count INTEGER DEFAULT 1,
  plan_pdf_url TEXT,
  endorsement_date TIMESTAMPTZ,
  endorsed_by UUID REFERENCES surveyors(id),
  digital_signature TEXT, -- Signature hash/reference
  metadata JSONB DEFAULT '{}'::jsonb, -- Bearings, distances, monuments
  is_immutable BOOLEAN DEFAULT false, -- Set true on endorsement
  created_by UUID REFERENCES surveyors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_job ON plans(survey_job_id);
CREATE INDEX IF NOT EXISTS idx_plans_number ON plans(plan_no);

-- =====================================================
-- PARCEL FABRIC (Versioned)
-- =====================================================

CREATE TABLE IF NOT EXISTS parcel_fabric (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id VARCHAR(100) NOT NULL, -- External parcel ID
  geom GEOMETRY(Polygon, 4326) NOT NULL,
  source_plan_id UUID REFERENCES plans(id),
  version INTEGER NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ, -- NULL = current version
  change_note TEXT,
  change_type VARCHAR(50), -- split, amalgamation, boundary_adjustment, easement, etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcel_fabric_parcel ON parcel_fabric(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcel_fabric_geom ON parcel_fabric USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_parcel_fabric_effective ON parcel_fabric(effective_from, effective_to);

-- =====================================================
-- DISPUTES & LEGAL LIAISON
-- =====================================================

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_job_id UUID REFERENCES survey_jobs(id) ON DELETE CASCADE,
  legal_case_id VARCHAR(100), -- External legal case reference
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- open, escalated, resolved, closed
  bundle_url TEXT, -- Evidence bundle location
  escalated_date TIMESTAMPTZ,
  escalated_by UUID REFERENCES surveyors(id),
  resolution_notes TEXT,
  resolved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_job ON disputes(survey_job_id);
CREATE INDEX IF NOT EXISTS idx_disputes_legal_case ON disputes(legal_case_id);

-- =====================================================
-- DOCUMENTS & RECORDS
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_table VARCHAR(100) NOT NULL, -- survey_jobs, plans, disputes, etc.
  owner_id UUID NOT NULL,
  doc_type VARCHAR(100) NOT NULL, -- plan, field_note, photo, report, legal_bundle, etc.
  file_name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  hash VARCHAR(64),
  retention_label VARCHAR(100), -- M365 retention label
  legal_hold BOOLEAN DEFAULT false,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_table, owner_id);

-- =====================================================
-- AUDIT LOG (Immutable)
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor VARCHAR(255) NOT NULL, -- User email or Entra ID
  action VARCHAR(100) NOT NULL, -- create, update, delete, endorse, etc.
  entity_table VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- =====================================================
-- ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE surveyors ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_fabric ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your auth setup)
-- These are basic examples - customize based on Entra ID roles

-- Survey Jobs: Users can see jobs they're assigned to or all if admin
CREATE POLICY "Users can view assigned jobs" ON survey_jobs
  FOR SELECT
  USING (
    auth.uid()::text = assigned_to::text
    OR auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'role' = 'surveyor_general'
  );

CREATE POLICY "Admins can insert jobs" ON survey_jobs
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'chief_surveyor'));

CREATE POLICY "Users can update assigned jobs" ON survey_jobs
  FOR UPDATE
  USING (
    auth.uid()::text = assigned_to::text
    OR auth.jwt() ->> 'role' IN ('admin', 'chief_surveyor')
  );

-- Plans: Immutable once endorsed
CREATE POLICY "Users can view plans" ON plans
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert plans" ON plans
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('registered_surveyor', 'chief_surveyor', 'admin'));

CREATE POLICY "Only non-endorsed plans can be updated" ON plans
  FOR UPDATE
  USING (
    is_immutable = false
    AND auth.jwt() ->> 'role' IN ('registered_surveyor', 'chief_surveyor', 'admin')
  );

-- Audit log: Insert only, no updates or deletes
CREATE POLICY "System can insert audit logs" ON audit_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" ON audit_log
  FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'surveyor_general'));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_surveyors_updated_at BEFORE UPDATE ON surveyors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_jobs_updated_at BEFORE UPDATE ON survey_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_control_points_updated_at BEFORE UPDATE ON control_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_runs_updated_at BEFORE UPDATE ON processing_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instruments_updated_at BEFORE UPDATE ON instruments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log changes to audit_log
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (actor, action, entity_table, entity_id, before_state, after_state)
  VALUES (
    COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'system'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_survey_jobs AFTER INSERT OR UPDATE OR DELETE ON survey_jobs
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_plans AFTER INSERT OR UPDATE OR DELETE ON plans
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_parcel_fabric AFTER INSERT OR UPDATE OR DELETE ON parcel_fabric
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default CRS
INSERT INTO crs_library (code, name, authority) VALUES
  ('EPSG:4326', 'WGS 84', 'EPSG'),
  ('EPSG:3857', 'Web Mercator', 'EPSG'),
  ('EPSG:32754', 'WGS 84 / UTM zone 54S', 'EPSG')
ON CONFLICT (code) DO NOTHING;

-- Insert accuracy classes
INSERT INTO accuracy_classes (code, name, tolerance_mm) VALUES
  ('CLASS_A', 'Class A (High Precision)', 5),
  ('CLASS_B', 'Class B (Standard)', 20),
  ('CLASS_C', 'Class C (General)', 50),
  ('CLASS_D', 'Class D (Reconnaissance)', 100)
ON CONFLICT (code) DO NOTHING;

-- Insert job types
INSERT INTO job_types (code, name, sla_days) VALUES
  ('CADASTRAL', 'Cadastral Survey', 30),
  ('CONTROL', 'Control Point Establishment', 14),
  ('SUBDIVISION', 'Subdivision Survey', 45),
  ('BOUNDARY', 'Boundary Definition', 30),
  ('EASEMENT', 'Easement Survey', 21),
  ('COURT_ORDER', 'Court Ordered Survey', 60)
ON CONFLICT (code) DO NOTHING;

-- Insert survey statuses
INSERT INTO survey_statuses (code, name, category, sort_order) VALUES
  ('REGISTERED', 'Registered', 'job', 1),
  ('ASSIGNED', 'Assigned', 'job', 2),
  ('FIELD_WORK', 'Field Work in Progress', 'job', 3),
  ('PROCESSING', 'Processing', 'job', 4),
  ('QA_REVIEW', 'QA Review', 'job', 5),
  ('ENDORSED', 'Endorsed', 'job', 6),
  ('COMPLETED', 'Completed', 'job', 7),
  ('CANCELLED', 'Cancelled', 'job', 99)
ON CONFLICT (code) DO NOTHING;

-- Insert demo admin user
INSERT INTO surveyors (entra_id, name, email, license_no, status) VALUES
  ('demo-admin-id', 'Admin User', 'admin@lands.gov.pg', 'ADM001', 'active')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE survey_jobs IS 'Core survey job registry with case/title linkages';
COMMENT ON TABLE control_points IS 'Geodetic control points with PostGIS 3D geometry';
COMMENT ON TABLE parcel_fabric IS 'Versioned parcel boundaries for temporal queries';
COMMENT ON TABLE audit_log IS 'Immutable audit trail for compliance and forensics';

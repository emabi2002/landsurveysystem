-- Sample Data for Testing Surveying Division System
-- Run this AFTER running database-schema.sql

-- =====================================================
-- SAMPLE SURVEY JOBS
-- =====================================================

INSERT INTO survey_jobs (
  job_number,
  request_source,
  purpose,
  job_type_id,
  priority,
  status,
  sla_due,
  location_description,
  site_geom
) VALUES
  (
    'SJ-2024-0001',
    'external',
    'Cadastral survey for new residential subdivision at Port Moresby',
    (SELECT id FROM job_types WHERE code = 'SUBDIVISION' LIMIT 1),
    'high',
    'field_work',
    CURRENT_DATE + INTERVAL '15 days',
    'Port Moresby, NCD - Section 45',
    ST_SetSRID(ST_MakePoint(147.1803, -9.4438), 4326)
  ),
  (
    'SJ-2024-0002',
    'rot',
    'Boundary definition for land title dispute resolution',
    (SELECT id FROM job_types WHERE code = 'BOUNDARY' LIMIT 1),
    'urgent',
    'processing',
    CURRENT_DATE + INTERVAL '10 days',
    'Lae, Morobe Province - Lot 234',
    ST_SetSRID(ST_MakePoint(146.9934, -6.7222), 4326)
  ),
  (
    'SJ-2024-0003',
    'court',
    'Court-ordered survey for property settlement case',
    (SELECT id FROM job_types WHERE code = 'COURT_ORDER' LIMIT 1),
    'urgent',
    'qa_review',
    CURRENT_DATE - INTERVAL '5 days', -- Overdue for testing
    'Mount Hagen, Western Highlands',
    ST_SetSRID(ST_MakePoint(144.2306, -5.8667), 4326)
  ),
  (
    'SJ-2024-0004',
    'external',
    'Easement survey for utility corridor',
    (SELECT id FROM job_types WHERE code = 'EASEMENT' LIMIT 1),
    'normal',
    'registered',
    CURRENT_DATE + INTERVAL '21 days',
    'Madang, Madang Province',
    ST_SetSRID(ST_MakePoint(145.7869, -5.2219), 4326)
  ),
  (
    'SJ-2024-0005',
    'internal',
    'Control network densification for coastal areas',
    (SELECT id FROM job_types WHERE code = 'CONTROL' LIMIT 1),
    'normal',
    'completed',
    CURRENT_DATE - INTERVAL '30 days',
    'Rabaul, East New Britain',
    ST_SetSRID(ST_MakePoint(152.1808, -4.2019), 4326)
  );

-- =====================================================
-- SAMPLE CONTROL POINTS
-- =====================================================

INSERT INTO control_points (
  code,
  geom,
  datum,
  accuracy_class_id,
  installed_on,
  status,
  monument_type,
  description
) VALUES
  (
    'CP-POM-001',
    ST_SetSRID(ST_MakePointZ(147.1803, -9.4438, 25.5), 4326),
    'WGS84',
    (SELECT id FROM accuracy_classes WHERE code = 'CLASS_A' LIMIT 1),
    '2023-06-15',
    'active',
    'Concrete pillar with brass disk',
    'Primary control point at Port Moresby International Airport. Stable foundation, clear sky view.'
  ),
  (
    'CP-POM-002',
    ST_SetSRID(ST_MakePointZ(147.1925, -9.4380, 42.3), 4326),
    'WGS84',
    (SELECT id FROM accuracy_classes WHERE code = 'CLASS_A' LIMIT 1),
    '2023-06-16',
    'active',
    'Concrete pillar',
    'Secondary control near Parliament House. Good access, monument in excellent condition.'
  ),
  (
    'CP-LAE-001',
    ST_SetSRID(ST_MakePointZ(146.9934, -6.7222, 15.8), 4326),
    'WGS84',
    (SELECT id FROM accuracy_classes WHERE code = 'CLASS_B' LIMIT 1),
    '2023-08-10',
    'active',
    'Steel rod with cap',
    'Control point at Lae city center. Monument stable, clear GPS reception.'
  ),
  (
    'CP-MTH-001',
    ST_SetSRID(ST_MakePointZ(144.2306, -5.8667, 1680.2), 4326),
    'PNG94',
    (SELECT id FROM accuracy_classes WHERE code = 'CLASS_A' LIMIT 1),
    '2022-11-20',
    'active',
    'Concrete pillar with brass disk',
    'High-precision control at Mount Hagen. Elevation critical for regional network.'
  ),
  (
    'CP-RAB-001',
    ST_SetSRID(ST_MakePointZ(152.1808, -4.2019, 8.5), 4326),
    'WGS84',
    (SELECT id FROM accuracy_classes WHERE code = 'CLASS_B' LIMIT 1),
    '2020-03-15',
    'deprecated',
    'Steel rod',
    'Old control point at Rabaul. Monument tilted due to volcanic activity. Replaced by CP-RAB-002.'
  );

-- =====================================================
-- SAMPLE SURVEY PLANS
-- =====================================================

INSERT INTO plans (
  survey_job_id,
  version,
  status,
  sheet_count,
  metadata
) VALUES
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0001' LIMIT 1),
    1,
    'draft',
    5,
    '{"survey_method": "GNSS RTK", "datum": "WGS84", "zone": "UTM 54S"}'::jsonb
  ),
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0002' LIMIT 1),
    1,
    'review',
    3,
    '{"survey_method": "Total Station", "datum": "PNG94", "notes": "Pending senior surveyor review"}'::jsonb
  ),
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0003' LIMIT 1),
    1,
    'review',
    2,
    '{"survey_method": "GNSS Static", "datum": "WGS84", "court_ref": "CC-2024-1234"}'::jsonb
  );

-- Create one endorsed plan for testing
INSERT INTO plans (
  survey_job_id,
  plan_no,
  version,
  status,
  sheet_count,
  endorsement_date,
  endorsed_by,
  digital_signature,
  is_immutable,
  metadata
) VALUES
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0005' LIMIT 1),
    'SP-2024-00001',
    1,
    'endorsed',
    4,
    CURRENT_DATE - INTERVAL '15 days',
    'Chief Surveyor - J. Smith',
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    true,
    '{"survey_method": "GNSS Network", "datum": "WGS84", "accuracy": "CLASS_A"}'::jsonb
  );

-- =====================================================
-- SAMPLE FIELD UPLOADS
-- =====================================================

INSERT INTO field_uploads (
  survey_job_id,
  type,
  file_name,
  file_url,
  file_size,
  checksum,
  uploaded_by,
  validations,
  status
) VALUES
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0001' LIMIT 1),
    'GNSS',
    'POM_BASE_001_20240115.obs',
    'storage/SJ-2024-0001/POM_BASE_001_20240115.obs',
    15728640, -- 15 MB
    'a3f5d9e2c1b7f8a6',
    (SELECT id FROM surveyors WHERE email = 'admin@lands.gov.pg' LIMIT 1),
    '{"format": "RINEX 3.04", "crs": "WGS84", "epochs": 14400, "satellites": 32}'::jsonb,
    'validated'
  ),
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0001' LIMIT 1),
    'photo',
    'site_overview_001.jpg',
    'storage/SJ-2024-0001/site_overview_001.jpg',
    4194304, -- 4 MB
    'b8e3a1c9d7f2e5a4',
    (SELECT id FROM surveyors WHERE email = 'admin@lands.gov.pg' LIMIT 1),
    '{"resolution": "4032x3024", "timestamp": "2024-01-15T10:30:00Z"}'::jsonb,
    'validated'
  ),
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0002' LIMIT 1),
    'RINEX',
    'LAE_ROVER_20240120.rnx',
    'storage/SJ-2024-0002/LAE_ROVER_20240120.rnx',
    8388608, -- 8 MB
    'c5d2f8a1b3e9d7c6',
    (SELECT id FROM surveyors WHERE email = 'admin@lands.gov.pg' LIMIT 1),
    '{"format": "RINEX 2.11", "duration_hours": 4, "sample_rate": "1s"}'::jsonb,
    'pending'
  ),
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0003' LIMIT 1),
    'field_notes',
    'boundary_measurements.pdf',
    'storage/SJ-2024-0003/boundary_measurements.pdf',
    2097152, -- 2 MB
    'd9a7f3e1c5b8d2a6',
    (SELECT id FROM surveyors WHERE email = 'admin@lands.gov.pg' LIMIT 1),
    '{"pages": 12, "signed": true}'::jsonb,
    'validated'
  );

-- =====================================================
-- SAMPLE PROCESSING RUNS
-- =====================================================

INSERT INTO processing_runs (
  survey_job_id,
  control_set,
  crs_id,
  residuals,
  accuracy_class_id,
  qa_status,
  report_url,
  created_by
) VALUES
  (
    (SELECT id FROM survey_jobs WHERE job_number = 'SJ-2024-0002' LIMIT 1),
    ARRAY[(SELECT id FROM control_points WHERE code = 'CP-LAE-001')],
    (SELECT id FROM crs_library WHERE code = 'EPSG:4326' LIMIT 1),
    '{"horizontal_rms": 0.008, "vertical_rms": 0.012, "max_residual": 0.015}'::jsonb,
    (SELECT id FROM accuracy_classes WHERE code = 'CLASS_A' LIMIT 1),
    'approved',
    'reports/processing/SJ-2024-0002_run_001.pdf',
    (SELECT id FROM surveyors WHERE email = 'admin@lands.gov.pg' LIMIT 1)
  );

-- =====================================================
-- SAMPLE PARCEL FABRIC
-- =====================================================

INSERT INTO parcel_fabric (
  parcel_id,
  geom,
  source_plan_id,
  version,
  effective_from,
  change_note,
  change_type
) VALUES
  (
    'P-2024-001',
    ST_SetSRID(ST_GeomFromText('POLYGON((147.18 -9.44, 147.19 -9.44, 147.19 -9.45, 147.18 -9.45, 147.18 -9.44))'), 4326),
    (SELECT id FROM plans WHERE plan_no = 'SP-2024-00001' LIMIT 1),
    1,
    CURRENT_DATE - INTERVAL '15 days',
    'Initial parcel creation from endorsed survey plan',
    'new'
  );

-- =====================================================
-- SAMPLE AUDIT LOG ENTRIES
-- =====================================================

INSERT INTO audit_log (
  actor,
  action,
  entity_table,
  entity_id,
  after_state
) VALUES
  (
    'admin@lands.gov.pg',
    'endorse',
    'plans',
    (SELECT id FROM plans WHERE plan_no = 'SP-2024-00001' LIMIT 1),
    '{"plan_no": "SP-2024-00001", "status": "endorsed", "is_immutable": true}'::jsonb
  ),
  (
    'admin@lands.gov.pg',
    'create',
    'control_points',
    (SELECT id FROM control_points WHERE code = 'CP-POM-001' LIMIT 1),
    '{"code": "CP-POM-001", "status": "active", "datum": "WGS84"}'::jsonb
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count records created
SELECT 'Survey Jobs' AS table_name, COUNT(*) AS count FROM survey_jobs
UNION ALL
SELECT 'Control Points', COUNT(*) FROM control_points
UNION ALL
SELECT 'Plans', COUNT(*) FROM plans
UNION ALL
SELECT 'Field Uploads', COUNT(*) FROM field_uploads
UNION ALL
SELECT 'Processing Runs', COUNT(*) FROM processing_runs
UNION ALL
SELECT 'Parcel Fabric', COUNT(*) FROM parcel_fabric
UNION ALL
SELECT 'Audit Log Entries', COUNT(*) FROM audit_log;

-- Summary
SELECT
  'Sample data loaded successfully!' AS message,
  '5 survey jobs, 5 control points, 4 plans, 4 uploads' AS details;

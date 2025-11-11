// Database Types for Surveying Division System

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any

export interface SurveyJob {
  id: string
  job_number: string
  case_id?: string
  title_id?: string
  lrc_ref?: string
  request_source: string
  purpose: string
  job_type_id?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: string
  assigned_to?: string
  assigned_date?: string
  sla_due?: string
  location_description?: string
  site_geom?: JsonValue // GeoJSON
  metadata?: Record<string, JsonValue>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Surveyor {
  id: string
  entra_id?: string
  name: string
  email: string
  license_no?: string
  license_expiry?: string
  company?: string
  phone?: string
  status: 'active' | 'suspended' | 'expired'
  competencies?: string[]
  cpd_hours?: number
  conflict_declarations?: JsonValue[]
  created_at: string
  updated_at: string
}

export interface WorkOrder {
  id: string
  survey_job_id: string
  scope: string
  site_access?: string
  safety_notes?: string
  schedule_start?: string
  schedule_end?: string
  instruments?: string[]
  vehicle?: string
  status: 'draft' | 'approved' | 'in-progress' | 'completed'
  checklist?: JsonValue[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ControlPoint {
  id: string
  code: string
  geom: JsonValue // PostGIS PointZ
  datum: string
  accuracy_class_id?: string
  installed_on?: string
  status: 'active' | 'deprecated' | 'destroyed'
  monument_type?: string
  description?: string
  history?: JsonValue[]
  metadata?: Record<string, JsonValue>
  created_at: string
  updated_at: string
}

export interface FieldUpload {
  id: string
  survey_job_id: string
  type: string
  file_name: string
  file_url: string
  file_size?: number
  checksum?: string
  uploaded_by?: string
  uploaded_at: string
  validations?: Record<string, JsonValue>
  status: 'pending' | 'validated' | 'rejected'
  metadata?: Record<string, JsonValue>
}

export interface ProcessingRun {
  id: string
  survey_job_id: string
  control_set?: string[]
  crs_id?: string
  residuals?: Record<string, JsonValue>
  accuracy_class_id?: string
  qa_status: 'pending' | 'approved' | 'rejected'
  reviewer_id?: string
  review_date?: string
  review_notes?: string
  report_url?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  survey_job_id: string
  plan_no?: string
  version: number
  status: 'draft' | 'review' | 'endorsed' | 'superseded'
  sheet_count: number
  plan_pdf_url?: string
  endorsement_date?: string
  endorsed_by?: string
  digital_signature?: string
  metadata?: Record<string, JsonValue>
  is_immutable: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ParcelFabric {
  id: string
  parcel_id: string
  geom: JsonValue // PostGIS Polygon
  source_plan_id?: string
  version: number
  effective_from: string
  effective_to?: string
  change_note?: string
  change_type?: string
  metadata?: Record<string, JsonValue>
  created_at: string
}

export interface Dispute {
  id: string
  survey_job_id: string
  legal_case_id?: string
  reason: string
  status: 'open' | 'escalated' | 'resolved' | 'closed'
  bundle_url?: string
  escalated_date?: string
  escalated_by?: string
  resolution_notes?: string
  resolved_date?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  owner_table: string
  owner_id: string
  doc_type: string
  file_name: string
  url: string
  hash?: string
  retention_label?: string
  legal_hold: boolean
  created_by?: string
  created_at: string
}

export interface AuditLog {
  id: string
  actor: string
  action: string
  entity_table: string
  entity_id: string
  before_state?: Record<string, JsonValue>
  after_state?: Record<string, JsonValue>
  ip_address?: string
  user_agent?: string
  timestamp: string
}

export interface JobType {
  id: string
  code: string
  name: string
  description?: string
  sla_days?: number
  active: boolean
  created_at: string
}

export interface AccuracyClass {
  id: string
  code: string
  name: string
  description?: string
  tolerance_mm?: number
  created_at: string
}

export interface CRS {
  id: string
  code: string
  name: string
  wkt?: string
  proj4text?: string
  authority?: string
  active: boolean
  created_at: string
}

export interface Instrument {
  id: string
  type: string
  make?: string
  model?: string
  serial_no: string
  calibration_due?: string
  status: 'available' | 'in-use' | 'maintenance' | 'retired'
  metadata?: Record<string, JsonValue>
  created_at: string
  updated_at: string
}

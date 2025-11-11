# Surveying Division Sub-System

A comprehensive cadastral survey management system for land administration, built with Next.js, Supabase (PostGIS), and Microsoft 365 integration.

## 🎯 Overview

This system manages:
- **Survey Job Registry** - Intake, assignment, and tracking of cadastral survey jobs
- **Work Orders** - Field work planning with instruments, vehicles, and safety checklists
- **Control Points** - Geodetic control network with PostGIS 3D spatial data
- **Field Data Management** - Upload and validation of GNSS, RINEX, photos, and field notes
- **Processing & QA** - Coordinate processing, least-squares adjustments, and peer review
- **Plan Endorsement** - Survey plan compilation, endorsement workflow, and numbering
- **Parcel Fabric** - Versioned authoritative boundaries with temporal queries
- **Legal Liaison** - Dispute tracking and evidence bundle packaging for ROT/courts
- **Audit & Compliance** - Immutable audit trail, retention labels, and role-based access

## 🚀 Quick Start

### 1. Prerequisites

- **Supabase Account** with PostGIS enabled
- **Node.js 18+** or Bun runtime
- (Optional) Microsoft Entra ID for SSO
- (Optional) Microsoft 365 for email/SharePoint

### 2. Database Setup

1. Go to your Supabase SQL Editor
2. Copy and run the entire schema from `.same/database-schema.sql`
3. This creates all tables, enables PostGIS, sets up RLS, and inserts seed data

### 3. Environment Configuration

Create `.env.local` (already included):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Install Dependencies

```bash
bun install
```

### 5. Run Development Server

```bash
bun run dev
```

Visit: http://localhost:3000

### 6. Login

**Demo Credentials:**
- Email: `admin@lands.gov.pg`
- Password: `demo123`

⚠️ **IMPORTANT:** Change this password immediately in production!

## 🔐 Security Actions (CRITICAL)

Before deploying to production:

1. **Rotate Supabase API Keys**
   - Dashboard → Project Settings → API → Regenerate both keys
   - Update `.env.local`

2. **Change Default Password**
   - Supabase Dashboard → Authentication → Users
   - Reset password for `admin@lands.gov.pg`

3. **Store Secrets Securely**
   - Never commit `.env.local` to version control
   - Use environment vault for production deployments

## 📊 Database Schema

### Core Tables

- `survey_jobs` - Main job registry with case/title linkages
- `surveyors` - Registered surveyors with licenses and competencies
- `work_orders` - Field work planning and resource allocation
- `control_points` - PostGIS 3D points (lat/lon/height)
- `field_uploads` - Data files with checksums and validation
- `processing_runs` - Coordinate processing and QA results
- `plans` - Survey plans with endorsement workflow (immutable when endorsed)
- `parcel_fabric` - PostGIS polygons with temporal versioning
- `disputes` - Legal case linkages and evidence bundles
- `documents` - File metadata with retention labels
- `audit_log` - Immutable audit trail

### Spatial Data (PostGIS)

```sql
-- Control Points: 3D geometry
control_points.geom → GEOMETRY(PointZ, 4326)

-- Parcel Fabric: Polygon boundaries
parcel_fabric.geom → GEOMETRY(Polygon, 4326)
```

### Temporal Versioning

```sql
-- Current version
SELECT * FROM parcel_fabric
WHERE parcel_id = 'P123' AND effective_to IS NULL;

-- Historical query
SELECT * FROM parcel_fabric
WHERE parcel_id = 'P123'
  AND effective_from <= '2024-01-01'
  AND (effective_to IS NULL OR effective_to > '2024-01-01');
```

## 🗺️ Features by Module

### Dashboard
- Real-time statistics (jobs, control points, overdue items)
- Quick actions and navigation
- SLA monitoring

### Survey Jobs
- ✅ Job registration with auto-generated job numbers
- ✅ Case/Title/LRC reference linking
- ✅ Priority levels and SLA tracking
- ✅ Search and filtering
- 🔄 Assignment workflow (planned)
- 🔄 Detailed job view/edit (planned)

### Control Points
- 🔄 3D coordinate management (PostGIS)
- 🔄 Accuracy class tracking
- 🔄 Monument descriptions
- 🔄 History and versioning

### Field Uploads
- 🔄 Multi-file upload (GNSS, RINEX, CSV, photos)
- 🔄 Auto-validation (CRS, checksums)
- 🔄 Virus scanning integration

### Processing & QA
- 🔄 Least-squares adjustments
- 🔄 Residuals and accuracy metrics
- 🔄 Peer review workflow
- 🔄 Non-conformity tracking

### Plans
- 🔄 Plan compilation and metadata
- 🔄 Endorsement workflow (multi-level approval)
- 🔄 Official plan numbering
- 🔄 Digital signatures
- 🔄 Immutability on endorsement

### Parcel Fabric
- 🔄 Splits, amalgamations, adjustments
- 🔄 Easement management
- 🔄 Version control with effective dates
- 🔄 GeoJSON export

### Legal Disputes
- 🔄 Dispute registration and tracking
- 🔄 Evidence bundle packaging
- 🔄 ROT/Court integration
- 🔄 Resolution tracking

### Reports
- 🔄 SLA compliance dashboards
- 🔄 Job aging reports
- 🔄 QA defect rates
- 🔄 Instrument utilization

## 🔧 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Authentication:** Supabase Auth (demo) → Entra ID (production)
- **UI:** shadcn/ui + Tailwind CSS
- **Notifications:** Sonner (toast) + Microsoft Graph (email)
- **Documents:** SharePoint/OneDrive or Supabase Storage
- **Maps:** PostGIS spatial queries
- **Forms:** React Hook Form + Zod validation
- **Runtime:** Bun (development) / Node.js (production)

## 📁 Project Structure

```
surveying-division-system/
├── .same/                     # Documentation and guides
│   ├── database-schema.sql    # Complete DB schema
│   ├── SETUP_GUIDE.md         # Detailed setup instructions
│   └── todos.md               # Development progress
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── dashboard/         # Main application pages
│   │   │   ├── jobs/          # Survey jobs module
│   │   │   ├── control-points/
│   │   │   ├── plans/
│   │   │   ├── fabric/
│   │   │   └── ...
│   │   ├── layout.tsx         # Root layout with auth
│   │   └── page.tsx           # Login/redirect page
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── layout/            # Dashboard layout
│   │   └── ui/                # shadcn components
│   └── lib/
│       ├── supabase/          # Supabase client utilities
│       ├── auth/              # Auth provider/context
│       └── types/             # TypeScript definitions
├── .env.local                 # Environment variables (DO NOT COMMIT)
└── package.json
```

## 🔐 Row-Level Security (RLS)

All tables have RLS enabled. Example policies:

```sql
-- Users see only assigned jobs or if they're admin
CREATE POLICY "job_access" ON survey_jobs
  FOR SELECT USING (
    auth.uid()::text = assigned_to::text
    OR auth.jwt() ->> 'role' IN ('admin', 'surveyor_general')
  );

-- Endorsed plans are immutable
CREATE POLICY "no_modify_endorsed" ON plans
  FOR UPDATE USING (is_immutable = false);
```

## 🌐 Future Integrations

### Microsoft Entra ID (Azure AD)
- SSO with organizational credentials
- Role-based access via Entra ID groups
- Replace Supabase Auth

### Microsoft Graph API
- Send notifications from shared mailbox
- SharePoint document storage
- Calendar integration for field schedules

### External Systems
- **ROT (Registrar of Titles):** Title issuance readiness
- **Legal Case Management:** Dispute escalation
- **Government Printer:** Gazettal publishing
- **LRC (Land Registration Commission):** Case linkages

## 📚 Documentation

- **Setup Guide:** `.same/SETUP_GUIDE.md` - Comprehensive setup instructions
- **Database Schema:** `.same/database-schema.sql` - Complete schema with comments
- **API Documentation:** (Coming soon) - REST API endpoints
- **User Manual:** (Coming soon) - End-user guides

## 🧪 Testing

### Manual Testing

1. **Login:** Test with `admin@lands.gov.pg` / `demo123`
2. **Dashboard:** Verify statistics load from Supabase
3. **Create Job:** Register a new survey job
4. **Navigation:** Test all sidebar menu items

### Database Testing

```sql
-- Verify PostGIS
SELECT PostGIS_Version();

-- Check seed data
SELECT * FROM job_types;
SELECT * FROM accuracy_classes;

-- Test RLS
SELECT * FROM survey_jobs; -- Should respect user's access
```

## 📝 Development Roadmap

### Phase B (In Progress)
- [ ] Complete CRUD for all modules
- [ ] File upload functionality
- [ ] Assignment workflow
- [ ] QA checklist implementation
- [ ] Endorsement workflow with digital signatures

### Phase C (Planned)
- [ ] ROT integration
- [ ] Legal escalation workflow
- [ ] Email notifications via Graph
- [ ] SharePoint document management

### Phase D (Planned)
- [ ] Parcel fabric version control
- [ ] Gazettal package generation
- [ ] Advanced reporting and dashboards
- [ ] Map-based visualizations

### Phase E (Future)
- [ ] Entra ID SSO
- [ ] Mobile app for field workers
- [ ] Real-time collaboration
- [ ] Advanced analytics

## 🆘 Support

- **Email:** support@same.new
- **Documentation:** Check `.same/` folder
- **Issues:** Contact your system administrator

## 📄 License

Government of Papua New Guinea - Lands Division
Proprietary and Confidential

## ⚠️ Security & Compliance

This system handles sensitive government data:

- ✅ TLS encryption in transit
- ✅ Encryption at rest (Supabase default)
- ✅ Immutable audit logs
- ✅ Row-level security
- 🔄 M365 retention policies (pending)
- 🔄 DLP policies (pending)
- 🔄 Regular backups (configure)
- 🔄 Disaster recovery plan (pending)
- 🔄 Penetration testing (before go-live)

---

**Built with ❤️ by Same.New**

For technical support or feature requests, contact your development team.

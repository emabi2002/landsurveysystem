# Surveying Division System - Setup Guide

## 🚨 SECURITY FIRST - IMMEDIATE ACTIONS REQUIRED

Before using this system in production, you **MUST** complete these security steps:

### 1. Rotate Supabase API Keys
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to Project Settings → API
3. Click "Regenerate" for both:
   - `anon` public key
   - `service_role` secret key
4. Update `.env.local` with the new keys

### 2. Change Default Password
1. Go to Supabase Dashboard → Authentication → Users
2. Find user: `admin@lands.gov.pg`
3. Reset password to a strong, unique password
4. **Never** use `demo123` in production

### 3. Store Secrets Securely
- Use environment variables for all credentials
- Never commit `.env.local` to version control
- Use Same.New's environment vault for production deployments
- Rotate keys if they've been exposed

---

## 📋 Prerequisites

- Supabase account with PostGIS enabled
- (Optional) Microsoft Entra ID tenant for SSO
- (Optional) Microsoft 365 for email/SharePoint integration
- Node.js 18+ or Bun runtime

---

## 🗄️ Database Setup

### Step 1: Enable PostGIS

Run this in your Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 2: Create Schema

Copy the entire contents of `.same/database-schema.sql` and run it in the Supabase SQL Editor. This will:

- Create all tables with proper relationships
- Enable PostGIS for spatial data (control points, parcel fabric)
- Set up Row-Level Security (RLS)
- Create audit triggers
- Insert seed data (CRS, accuracy classes, job types)
- Create demo admin user

### Step 3: Verify Tables

Check that these tables exist:
- `survey_jobs`
- `surveyors`
- `work_orders`
- `control_points` (with PostGIS geometry)
- `field_uploads`
- `processing_runs`
- `plans`
- `parcel_fabric` (with PostGIS geometry)
- `disputes`
- `documents`
- `audit_log`
- `crs_library`, `accuracy_classes`, `job_types`, `survey_statuses`
- `instruments`

---

## 🔐 Authentication Setup

### Current: Supabase Auth (Demo)

The system currently uses Supabase email/password authentication for demo purposes.

**Demo Credentials:**
- Email: `admin@lands.gov.pg`
- Password: `demo123` (⚠️ CHANGE THIS IMMEDIATELY)

### Future: Microsoft Entra ID (Azure AD) SSO

To integrate with Entra ID:

1. **Register Application in Azure Portal:**
   - Go to Azure Portal → Entra ID → App Registrations
   - Create new registration
   - Set redirect URI: `http://localhost:3000/auth/callback` (dev) and your production URL
   - Note the Client ID and Tenant ID

2. **Configure App Roles:**
   Create these roles in your Entra ID app:
   - `Surveyor-General`
   - `Chief-Surveyor`
   - `Registered-Surveyor`
   - `Survey-Technician`
   - `ROT-Liaison`
   - `Legal-Liaison`
   - `Records-Clerk`
   - `System-Admin`

3. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id
   NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id
   AZURE_AD_CLIENT_SECRET=your-client-secret
   ```

4. **Update Code:**
   - Replace `AuthProvider.tsx` with MSAL (already installed)
   - Use Entra ID tokens for RLS policies
   - Map Entra ID groups to database roles

---

## 📧 Email & Notifications

### Option 1: Microsoft Graph API (Recommended)

1. **Grant Graph Permissions in Azure Portal:**
   - API Permissions → Add Microsoft Graph
   - Add: `Mail.Send`, `Mail.ReadWrite`
   - Admin consent required

2. **Configure Environment:**
   ```env
   GRAPH_API_SCOPE=https://graph.microsoft.com/.default
   SMTP_USER=survey-notices@yourdomain.gov.pg
   ```

3. **Usage:**
   - Send from shared mailbox: `survey-notices@lands.gov.pg`
   - Ensures institutional continuity

### Option 2: SMTP Fallback

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=survey-notices@yourdomain.gov.pg
SMTP_PASSWORD=your-password
```

---

## 📁 Document Storage

### Option 1: SharePoint (Recommended)

1. **Create SharePoint Site:**
   - Create site: "Surveying Division"
   - Create libraries: Plans, Field Data, Legal Bundles, Gazettals

2. **Register Graph API Permissions:**
   - `Sites.Selected` (least privilege)
   - Grant access to specific site

3. **Store Metadata in Supabase:**
   - `documents` table stores URLs, retention labels, checksums
   - Actual files in SharePoint

### Option 2: Supabase Storage

- Create buckets: `plans`, `field-data`, `documents`
- Enable RLS on storage buckets
- Set retention policies

---

## 🚀 Deployment

### Development

```bash
cd surveying-division-system
bun install
bun run dev
```

Visit: http://localhost:3000

### Production (Netlify)

1. Update `.env.local` with production values
2. Store secrets in Netlify environment variables
3. Deploy from Same.New or:

```bash
bun run build
# Test build locally
bun run start
```

---

## 📊 Row-Level Security (RLS)

The database schema includes basic RLS policies. Customize based on your org:

### Example: Job Access by Assignment

```sql
CREATE POLICY "Users see assigned jobs" ON survey_jobs
  FOR SELECT
  USING (
    auth.uid()::text = assigned_to::text
    OR auth.jwt() ->> 'role' IN ('admin', 'chief_surveyor', 'surveyor_general')
  );
```

### Example: Immutable Plans

Plans with `is_immutable = true` (endorsed) cannot be updated:

```sql
CREATE POLICY "Endorsed plans cannot be modified" ON plans
  FOR UPDATE
  USING (is_immutable = false);
```

---

## 🧪 Testing

### Test Admin Login

1. Visit http://localhost:3000
2. Login with `admin@lands.gov.pg` / `demo123`
3. You should see the dashboard

### Test Job Registration

1. Navigate to Survey Jobs
2. Click "Register New Job"
3. Fill form and submit
4. Job should appear in table with generated job number

### Test Database

Open Supabase SQL Editor and run:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check PostGIS
SELECT PostGIS_Version();

-- Check seed data
SELECT * FROM job_types;
SELECT * FROM accuracy_classes;
SELECT * FROM crs_library;

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies;
```

---

## 📋 Data Model Overview

### Core Entities

```
survey_jobs (main registry)
  ↓ has many
work_orders (field planning)
  ↓ has many
field_uploads (GNSS, photos, notes)
  ↓ leads to
processing_runs (coordinates, QA)
  ↓ produces
plans (survey plans)
  ↓ updates
parcel_fabric (authoritative boundaries)
```

### Spatial Data (PostGIS)

- **control_points**: `GEOMETRY(PointZ, 4326)` - 3D points (lat/lon/height)
- **parcel_fabric**: `GEOMETRY(Polygon, 4326)` - Parcel boundaries

### Temporal Versioning

`parcel_fabric` uses `effective_from` and `effective_to` for historical queries:

```sql
-- Current version
SELECT * FROM parcel_fabric
WHERE parcel_id = 'P123' AND effective_to IS NULL;

-- Version at specific date
SELECT * FROM parcel_fabric
WHERE parcel_id = 'P123'
  AND effective_from <= '2024-01-01'
  AND (effective_to IS NULL OR effective_to > '2024-01-01');
```

---

## 🔧 Troubleshooting

### Can't Login

- Check Supabase is running
- Verify environment variables are set
- Check browser console for errors
- Verify user exists in Supabase Auth

### Database Errors

- Ensure PostGIS is enabled
- Check RLS policies aren't blocking access
- Verify Supabase API keys are correct
- Check browser network tab for 401/403 errors

### Development Server Won't Start

```bash
# Clear cache and reinstall
rm -rf node_modules .next
bun install
bun run dev
```

---

## 📚 Next Steps

1. ✅ Run database schema
2. ✅ Change default password
3. ✅ Rotate API keys
4. ⏳ Configure Entra ID SSO
5. ⏳ Set up SharePoint integration
6. ⏳ Configure email notifications
7. ⏳ Implement full workflows
8. ⏳ Add ROT/Legal integrations
9. ⏳ Deploy to production
10. ⏳ User acceptance testing

---

## 🆘 Support

- **Same.New:** support@same.new
- **Documentation:** Check `.same/` folder for additional guides
- **Database Schema:** `.same/database-schema.sql`
- **Todos:** `.same/todos.md`

---

## 📄 License & Compliance

This system handles sensitive government data. Ensure:

- ✅ All data encrypted in transit (TLS)
- ✅ All data encrypted at rest (Supabase default)
- ✅ Audit logs are immutable
- ✅ Retention policies configured (M365)
- ✅ DLP policies active
- ✅ Regular backups scheduled
- ✅ Disaster recovery plan tested
- ✅ User access reviewed quarterly
- ✅ Penetration testing before go-live

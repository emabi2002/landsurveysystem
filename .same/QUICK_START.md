# Quick Start Guide - Get Your System Running in 15 Minutes

## ⚠️ Important: YOU Must Complete These Steps

I cannot access your Supabase or Azure accounts. Please follow these steps carefully.

---

## Step 1: Run Database Schema (5 minutes)

### Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login with your credentials
   - Select your project: `yvnkyjnwvylrweyzvibs`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run Schema**
   - Open file: `.same/database-schema.sql`
   - Select ALL content (Ctrl+A or Cmd+A)
   - Copy it (Ctrl+C or Cmd+C)
   - Paste into Supabase SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

4. **Verify Success**
   You should see:
   ```
   Success. No rows returned
   ```

5. **Check Tables Created**
   - Click "Table Editor" in sidebar
   - You should see these tables:
     - survey_jobs
     - surveyors
     - control_points
     - field_uploads
     - processing_runs
     - plans
     - parcel_fabric
     - disputes
     - documents
     - audit_log
     - And lookup tables (job_types, accuracy_classes, etc.)

### ✅ Verification Checklist

Run this query in SQL Editor to verify:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 15+ tables
```

```sql
-- Check PostGIS is enabled
SELECT PostGIS_Version();

-- Should return version number
```

```sql
-- Check seed data
SELECT * FROM job_types;
SELECT * FROM accuracy_classes;
SELECT * FROM crs_library;

-- Should return several rows for each
```

---

## Step 2: Test the System (10 minutes)

### 2.1 Login (1 min)

1. Open: http://localhost:3000
2. Login with:
   - Email: `admin@lands.gov.pg`
   - Password: `demo123`
3. Should redirect to dashboard

**✅ Success:** You see the dashboard with statistics

---

### 2.2 Test Feature #1: Survey Jobs (2 min)

1. Click "Survey Jobs" in sidebar
2. Click "Register New Job" button
3. Fill form:
   - Request Source: `External Surveyor`
   - Job Type: `Cadastral Survey`
   - Purpose: `Test survey for property boundary determination`
   - Priority: `Normal`
4. Click "Register Job"

**✅ Success:**
- Toast notification: "Survey job SJ-2024-NNNN registered successfully"
- Job appears in table
- Auto-generated job number shown

**Screenshot:** Take a screenshot showing the new job in the table

---

### 2.3 Test Feature #2: Control Points Map (3 min)

1. Click "Control Points" in sidebar
2. Click "Add Control Point" button
3. Fill form:
   - Control Point Code: `CP-TEST-001`
   - Latitude: `-6.314993`
   - Longitude: `143.95555`
   - Elevation: `100.5`
   - Datum: `WGS84`
   - Status: `Active`
   - Monument Type: `Concrete pillar`
   - Description: `Test control point for system validation`
4. Click "Create"
5. Switch to "Map View"
6. Click on the marker on the map
7. Popup should show control point details

**✅ Success:**
- Control point created
- Shows on map
- Clicking marker displays popup with details
- Can switch between Map and Table views

**Screenshot:** Take a screenshot of the map with the marker

---

### 2.4 Test Feature #3: File Uploads (2 min)

1. Click "Field Uploads" in sidebar
2. Click "Upload Files" button
3. In dialog:
   - Select Survey Job: (choose the job you created earlier)
   - File Type: `GNSS Data`
4. **Drag and drop test:**
   - Find any file on your computer (PDF, image, etc.)
   - Drag it into the upload zone
   - File should appear in the list with validation status
5. Click "Upload N File(s)"

**✅ Success:**
- File upload dialog opens
- Can drag and drop files
- Files show in list with preview (if image)
- Upload statistics update
- Files appear in the uploads table

**Screenshot:** Take screenshot of the upload interface with files

---

### 2.5 Test Feature #4: Plan Endorsement (1 min)

**Note:** You need sample data for this. Let me create it for you.

1. Click "Plans" in sidebar
2. View statistics at top (will show 0 until you create plans)

**To create a test plan, run this in Supabase SQL Editor:**

```sql
-- Get a survey job ID
SELECT id FROM survey_jobs LIMIT 1;

-- Create a test plan (replace 'job-id-here' with actual ID from above)
INSERT INTO plans (
  survey_job_id,
  version,
  status,
  sheet_count,
  metadata
) VALUES (
  'job-id-here',
  1,
  'review',
  3,
  '{"type": "cadastral", "notes": "Test plan for endorsement"}'::jsonb
);
```

3. Refresh the Plans page
4. You should see 1 plan with status "REVIEW"
5. Click "Endorse" button
6. Fill endorsement form:
   - Approval Level: `Senior Surveyor`
   - Comments: `Test endorsement for system validation`
   - Digital Signature PIN: `test123`
7. Click "Endorse Plan"

**✅ Success:**
- Plan status changes to "ENDORSED"
- Plan number assigned (SP-2024-00001)
- Shows as "Locked" (immutable)
- Statistics update

**Screenshot:** Take screenshot showing endorsed plan with plan number

---

### 2.6 Test Feature #5: Reports Dashboard (2 min)

1. Click "Reports" in sidebar
2. View SLA metrics at top:
   - On Time
   - Overdue
   - Delayed
   - Total Jobs
3. Scroll down to view charts:
   - Job Creation Trend (line chart)
   - Job Status Distribution (pie chart)
   - Priority Distribution (bar chart)
   - SLA Compliance Rate (circular gauge)
4. Change time range dropdown (7/30/90/365 days)
5. Charts should update

**✅ Success:**
- All charts render correctly
- SLA metrics display
- Time range filter works
- Key Insights section shows analysis

**Screenshot:** Take screenshot of the dashboard with charts

---

## Step 3: Review Entra ID Guide (Read-Only)

You don't need to implement this right now, but please review:

1. Open file: `.same/ENTRA_ID_INTEGRATION.md`
2. Read through Part 1: Azure Portal Configuration
3. Familiarize yourself with the 8 app roles defined
4. Understand the migration process

**Note:** Implementing Entra ID SSO requires:
- Azure Active Directory admin access
- Permission to register applications
- Ability to assign users to roles

This is optional and should be done when you're ready to move to production.

---

## Troubleshooting

### Database Schema Won't Run

**Error:** `relation already exists`

**Solution:**
- Schema has already been run
- Skip this step
- Verify tables exist in Table Editor

**Error:** `permission denied for schema public`

**Solution:**
- You need owner/admin access to Supabase project
- Contact your Supabase admin

### Can't Login

**Error:** Invalid email or password

**Solution:**
1. Check Supabase Dashboard → Authentication → Users
2. Verify `admin@lands.gov.pg` exists
3. If not, run this in SQL Editor:

```sql
-- This should already exist from schema, but if not:
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@lands.gov.pg',
  crypt('demo123', gen_salt('bf')),
  NOW()
);
```

### Tables Not Showing Data

**Solution:**
- Ensure you ran the database schema completely
- Check for errors in SQL Editor output
- Verify seed data was inserted:

```sql
SELECT COUNT(*) FROM job_types;
-- Should return 6

SELECT COUNT(*) FROM accuracy_classes;
-- Should return 4
```

### Map Not Loading

**Solution:**
- Map requires internet connection (loads OpenStreetMap tiles)
- Check browser console for errors
- Ensure PostGIS is enabled

### Charts Not Showing

**Solution:**
- Charts need data to display
- Create at least 1 survey job first
- Change time range to include created jobs

---

## Security Reminder ⚠️

After testing, immediately:

1. **Rotate Supabase API Keys:**
   - Supabase Dashboard → Settings → API
   - Click "Regenerate" for both keys
   - Update `.env.local`

2. **Change Admin Password:**
   - Supabase Dashboard → Authentication → Users
   - Find `admin@lands.gov.pg`
   - Click → Reset Password
   - Use strong password (min 12 chars)

3. **Store Credentials Securely:**
   - Use password manager
   - Never commit `.env.local` to git
   - For production, use environment vault

---

## What You've Accomplished ✅

After completing this guide, you have:

- ✅ Database schema running with PostGIS
- ✅ All 15+ tables created
- ✅ Seed data loaded
- ✅ Survey Jobs module tested
- ✅ Control Points with map tested
- ✅ File uploads tested
- ✅ Plan endorsement tested
- ✅ Reports dashboard tested
- ✅ Reviewed Entra ID integration guide

**Total time:** ~15 minutes

---

## Next Steps

Choose one:

1. **Continue Testing:**
   - Create more survey jobs
   - Add multiple control points
   - Upload various file types
   - Test all workflows

2. **Customize:**
   - Add your organization's logo
   - Customize color scheme
   - Add more job types
   - Configure email notifications

3. **Deploy to Production:**
   - Follow `.same/DEPLOYMENT_GUIDE.md`
   - Set up Netlify hosting
   - Configure production environment
   - Implement Entra ID SSO

4. **Develop Further:**
   - Build remaining modules (Work Orders, Processing, etc.)
   - Add ROT integration
   - Implement parcel fabric management
   - Build mobile app

---

## Support

**Stuck?** Check these resources:

- **Setup Guide:** `.same/SETUP_GUIDE.md`
- **Admin Handbook:** `.same/ADMIN_HANDBOOK.md`
- **Feature Summary:** `.same/FEATURE_SUMMARY.md`
- **Database Schema:** `.same/database-schema.sql`

**Still need help?**
- Email: support@same.new
- Include screenshots and error messages

---

**Last Updated:** [Current Date]
**Version:** 5.0
**Status:** Ready for Testing ✅

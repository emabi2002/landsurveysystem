# Testing Checklist - Surveying Division System

**Print this page and check off items as you test!**

---

## Pre-Testing Setup ⚙️

- [ ] Database schema run successfully (`.same/database-schema.sql`)
- [ ] Sample data loaded (`.same/sample-data.sql`) - OPTIONAL
- [ ] Environment variables configured (`.env.local`)
- [ ] Dev server running (`bun run dev`)
- [ ] Browser opened to: http://localhost:3000

---

## Authentication & Access 🔐

### Login
- [ ] Can access login page
- [ ] Login with `admin@lands.gov.pg` / `demo123`
- [ ] Redirects to dashboard after successful login
- [ ] Dashboard displays without errors

### Dashboard Overview
- [ ] Dashboard shows correct title "Surveying Division"
- [ ] Statistics cards display (Total Jobs, Active Jobs, etc.)
- [ ] All numbers load correctly (may be 0 if no sample data)
- [ ] Quick Actions section displays
- [ ] Navigation sidebar visible
- [ ] User avatar/email shown in sidebar

**Screenshot:** □ Taken

---

## Feature 1: Survey Jobs Module 📋

### Job Registration
- [ ] Click "Survey Jobs" in navigation
- [ ] Page loads without errors
- [ ] Click "Register New Job" button
- [ ] Dialog/modal opens
- [ ] All form fields visible:
  - [ ] Request Source dropdown
  - [ ] Job Type dropdown (6 types: Cadastral, Control, Subdivision, Boundary, Easement, Court Order)
  - [ ] Purpose textarea
  - [ ] Case ID field
  - [ ] Title ID field
  - [ ] LRC Reference field
  - [ ] Priority dropdown (Low, Normal, High, Urgent)
  - [ ] Location Description textarea

### Create Test Job
Fill with:
- Request Source: `External Surveyor`
- Job Type: `Cadastral Survey`
- Purpose: `Test survey for boundary determination`
- Priority: `Normal`

- [ ] Click "Register Job"
- [ ] Toast notification shows success
- [ ] Job number auto-generated (format: SJ-YYYY-NNNN)
- [ ] Job appears in table
- [ ] Status shown as "REGISTERED"
- [ ] SLA due date calculated and displayed
- [ ] Created date shows today's date

### Search & Filter
- [ ] Search box visible
- [ ] Type job number into search
- [ ] Table filters to show only matching jobs
- [ ] Clear search shows all jobs again

### Job Details
- [ ] Each row shows:
  - [ ] Job Number
  - [ ] Purpose (truncated if long)
  - [ ] Priority badge (color-coded)
  - [ ] Status badge
  - [ ] Case/Title ID
  - [ ] SLA Due date
  - [ ] Created date

**Screenshot:** □ Taken (showing job table)

**Test Result:** ⬜ PASS  ⬜ FAIL

**Notes:** _______________________________________

---

## Feature 2: Control Points with Map 🗺️

### Navigation
- [ ] Click "Control Points" in navigation
- [ ] Page loads without errors
- [ ] Two buttons visible: "Map View" and "Table View"
- [ ] "Add Control Point" button visible
- [ ] Search box visible

### Create Control Point
- [ ] Click "Add Control Point"
- [ ] Dialog opens with form fields:
  - [ ] Control Point Code
  - [ ] Latitude (number input)
  - [ ] Longitude (number input)
  - [ ] Elevation
  - [ ] Datum dropdown (WGS84, GDA94, PNG94)
  - [ ] Accuracy Class dropdown
  - [ ] Status dropdown (Active, Deprecated, Destroyed)
  - [ ] Monument Type
  - [ ] Installation Date
  - [ ] Description

Fill with test data:
- Code: `CP-TEST-001`
- Latitude: `-6.314993`
- Longitude: `143.95555`
- Elevation: `100.5`
- Datum: `WGS84`
- Status: `Active`
- Monument Type: `Concrete pillar`
- Description: `Test control point`

- [ ] Click "Create"
- [ ] Toast notification shows success
- [ ] Dialog closes
- [ ] Control point appears in list

### Map View Testing
- [ ] Click "Map View" button
- [ ] Map loads (shows OpenStreetMap tiles)
- [ ] Map centered on Papua New Guinea region
- [ ] Control point marker visible on map
- [ ] Click on marker
- [ ] Popup appears showing:
  - [ ] Control point code
  - [ ] Status
  - [ ] Coordinates (lat/lon)
  - [ ] Elevation
  - [ ] Datum
  - [ ] Monument type
  - [ ] Description

### Table View Testing
- [ ] Click "Table View" button
- [ ] Table displays with columns:
  - [ ] Code
  - [ ] Datum
  - [ ] Status (badge)
  - [ ] Monument Type
  - [ ] Installed date
  - [ ] Description
  - [ ] Actions (Edit/Delete buttons)

### Edit Control Point
- [ ] Click Edit button (pencil icon)
- [ ] Dialog opens with pre-filled data
- [ ] Change description to "Updated test control point"
- [ ] Click "Update"
- [ ] Toast shows success
- [ ] Table refreshes with updated data

### Search
- [ ] Type control point code in search box
- [ ] Table/map filters to show only matching points
- [ ] Clear search shows all points

### Delete
- [ ] Click Delete button (trash icon)
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" - nothing happens
- [ ] Click Delete again
- [ ] Click "OK" in confirmation
- [ ] Control point removed from list
- [ ] Toast shows success

**Screenshot:** □ Map view  □ Table view

**Test Result:** ⬜ PASS  ⬜ FAIL

**Notes:** _______________________________________

---

## Feature 3: File Upload System 📤

### Navigation
- [ ] Click "Field Uploads" in navigation
- [ ] Page loads without errors
- [ ] Statistics cards show:
  - [ ] Total Uploads
  - [ ] Pending Validation
  - [ ] Validated
  - [ ] Rejected
- [ ] "Upload Files" button visible
- [ ] Uploads table visible (may be empty)

### Upload Interface
- [ ] Click "Upload Files"
- [ ] Dialog opens with:
  - [ ] Survey Job dropdown
  - [ ] File Type dropdown (GNSS, RINEX, CSV, photo, field_notes, PDF)
  - [ ] Upload zone visible

### Drag and Drop Test
- [ ] Find a file on your computer (any PDF or image)
- [ ] Drag file over upload zone
- [ ] Zone highlights/changes color
- [ ] Drop file
- [ ] File appears in list with:
  - [ ] File name
  - [ ] File size
  - [ ] Status indicator
  - [ ] Remove button (X)

### Multiple Files
- [ ] Add 2-3 more files (drag or click to browse)
- [ ] All files appear in list
- [ ] Each has preview (if image)
- [ ] File count updates

### Validation
- [ ] Try uploading very large file (>100MB) - should show error
- [ ] Error message displays: "File size exceeds 100MB"
- [ ] File marked as error status
- [ ] Can remove errored file

### Upload Process
Select from dropdowns:
- Survey Job: (choose one from list)
- File Type: `GNSS Data`

- [ ] "Upload N File(s)" button enabled
- [ ] Shows correct file count
- [ ] Click upload button
- [ ] Loading indicator shows
- [ ] Toast notification on success
- [ ] Dialog closes
- [ ] Files appear in uploads table

### Uploads Table
- [ ] Table shows uploaded files with:
  - [ ] File Name
  - [ ] Type (badge with color)
  - [ ] Size (in MB)
  - [ ] Status (badge: Pending/Validated/Rejected)
  - [ ] Uploaded date and time
  - [ ] Download button

### Statistics Update
- [ ] Total Uploads count increased
- [ ] Pending Validation count increased
- [ ] Numbers match actual uploads

**Screenshot:** □ Upload interface  □ Uploads table

**Test Result:** ⬜ PASS  ⬜ FAIL

**Notes:** _______________________________________

---

## Feature 4: Plan Endorsement Workflow ✅

### Prerequisites
Run this SQL in Supabase to create a test plan:

```sql
INSERT INTO plans (
  survey_job_id,
  version,
  status,
  sheet_count
) VALUES (
  (SELECT id FROM survey_jobs LIMIT 1),
  1,
  'review',
  3
);
```

### Navigation
- [ ] Click "Plans" in navigation
- [ ] Page loads without errors
- [ ] Statistics cards show:
  - [ ] Total Plans
  - [ ] Pending Review
  - [ ] Endorsed
  - [ ] Draft

### Plans Table
- [ ] Table displays with columns:
  - [ ] Plan Number (or "Pending")
  - [ ] Version
  - [ ] Status (badge)
  - [ ] Sheets
  - [ ] Endorsed By
  - [ ] Date
  - [ ] Actions

### Endorsement Process
- [ ] Find plan with status "REVIEW"
- [ ] "Endorse" button visible
- [ ] Click "Endorse"
- [ ] Dialog opens with:
  - [ ] Plan Details section showing:
    - [ ] Current Status
    - [ ] Version
    - [ ] Sheet Count
  - [ ] Approval Level dropdown (Survey Officer, Senior Surveyor, Chief Surveyor, Surveyor-General)
  - [ ] Comments textarea
  - [ ] Digital Signature PIN field (password type)
  - [ ] Warning message about immutability

Fill endorsement form:
- Approval Level: `Senior Surveyor`
- Comments: `Test endorsement - all checks passed`
- Digital Signature PIN: `test123`

- [ ] Click "Endorse Plan"
- [ ] Loading indicator shows
- [ ] Toast notification on success
- [ ] Dialog closes
- [ ] Table refreshes

### Verification
- [ ] Plan status changed to "ENDORSED"
- [ ] Plan number assigned (format: SP-YYYY-NNNNN)
- [ ] Endorsed By shows user name
- [ ] Endorsement date shows today
- [ ] Badge shows "Locked" or immutability indicator
- [ ] "Endorse" button no longer available for this plan

### Statistics Update
- [ ] Endorsed count increased by 1
- [ ] Pending Review count decreased by 1
- [ ] Total Plans count unchanged

### Audit Trail (Check in Supabase)
Run SQL:
```sql
SELECT * FROM audit_log
WHERE action = 'endorse'
ORDER BY timestamp DESC LIMIT 1;
```

- [ ] Audit entry created
- [ ] Contains plan ID
- [ ] Contains endorsement details
- [ ] Timestamp recorded

**Screenshot:** □ Endorsement dialog  □ Endorsed plan

**Test Result:** ⬜ PASS  ⬜ FAIL

**Notes:** _______________________________________

---

## Feature 5: Reports & Analytics Dashboard 📊

### Navigation
- [ ] Click "Reports" in navigation
- [ ] Page loads without errors
- [ ] Time range dropdown visible (default: Last 30 days)
- [ ] Export button visible

### SLA Metrics Cards
Four cards at top showing:
- [ ] On Time (count + percentage)
  - [ ] Number displays
  - [ ] Green color if performing well
- [ ] Overdue (count)
  - [ ] Number displays
  - [ ] Red color for emphasis
- [ ] Delayed (count)
  - [ ] Number displays
  - [ ] Orange color for warning
- [ ] Total Jobs (count)
  - [ ] Number displays
  - [ ] Shows jobs in selected time range

### Charts Section

#### Chart 1: Job Creation Trend (Line Chart)
- [ ] Chart renders without errors
- [ ] X-axis shows dates
- [ ] Y-axis shows job counts
- [ ] Line connects data points
- [ ] Tooltip shows on hover
- [ ] Legend displays
- [ ] Chart responsive to window size

#### Chart 2: Job Status Distribution (Pie Chart)
- [ ] Pie chart renders
- [ ] Different colors for each status
- [ ] Labels show status names
- [ ] Values/percentages visible
- [ ] Tooltip shows on hover
- [ ] All slices add up to 100%

#### Chart 3: Priority Distribution (Bar Chart)
- [ ] Bar chart renders
- [ ] X-axis shows priority levels
- [ ] Y-axis shows counts
- [ ] Bars color-coded
- [ ] Tooltip shows on hover
- [ ] Legend displays

#### Chart 4: SLA Compliance Rate (Circular Gauge)
- [ ] Circular gauge renders
- [ ] Percentage displayed in center (large number)
- [ ] Color changes based on performance:
  - [ ] Green if ≥90%
  - [ ] Orange if 70-89%
  - [ ] Red if <70%
- [ ] Progress arc fills correctly
- [ ] Text below shows "X of Y jobs completed on time"

### Time Range Filter
Test each option:
- [ ] Select "Last 7 days"
  - [ ] All charts update
  - [ ] Metrics recalculate
- [ ] Select "Last 30 days" (default)
  - [ ] Charts show 30-day data
- [ ] Select "Last 90 days"
  - [ ] Wider time range data
- [ ] Select "Last year"
  - [ ] Annual data displayed

### Key Insights Section
- [ ] Insights panel visible at bottom
- [ ] Shows relevant insights based on data:
  - [ ] Green box if SLA >90% ("Excellent Performance")
  - [ ] Red box if overdue jobs exist ("Attention Required")
  - [ ] Blue box for workload summary

### Export (Button Check)
- [ ] Export button visible
- [ ] Click export button
- [ ] (Functionality placeholder - just verify button works)

**Screenshot:** □ Full dashboard  □ Charts closeup

**Test Result:** ⬜ PASS  ⬜ FAIL

**Notes:** _______________________________________

---

## Integration: Entra ID Guide Review 📖

### Documentation Check
- [ ] Open file: `.same/ENTRA_ID_INTEGRATION.md`
- [ ] File opens successfully
- [ ] Contains all sections:
  - [ ] Overview
  - [ ] Prerequisites
  - [ ] Part 1: Azure Portal Configuration
  - [ ] Part 2: Application Code Changes
  - [ ] Part 3: Testing
  - [ ] Part 4: Production Deployment
  - [ ] Part 5: Graph API Integration
  - [ ] Troubleshooting
  - [ ] Security Best Practices

### Content Review
- [ ] App registration steps clear
- [ ] 8 app roles defined:
  - [ ] Surveyor-General
  - [ ] Chief Surveyor
  - [ ] Registered Surveyor
  - [ ] Survey Technician
  - [ ] ROT Liaison
  - [ ] Legal Liaison
  - [ ] Records Clerk
  - [ ] System Admin
- [ ] Code examples provided
- [ ] MSAL configuration template included
- [ ] Troubleshooting section helpful
- [ ] Migration checklist included

**Review Result:** ⬜ Complete  ⬜ Needs Clarification

**Questions/Notes:** _______________________________________

---

## Security Verification 🔒

### Current Security State
- [ ] Using demo credentials (admin@lands.gov.pg / demo123)
- [ ] Credentials shown in login form (warning visible)
- [ ] Environment variables in `.env.local` (not committed to git)
- [ ] API keys stored securely

### Post-Testing Security Actions
**MUST DO BEFORE PRODUCTION:**

- [ ] Rotate Supabase anon key
- [ ] Rotate Supabase service role key
- [ ] Change admin password from demo123
- [ ] Update `.env.local` with new keys
- [ ] Remove demo credentials from login form
- [ ] Verify `.gitignore` includes `.env.local`

---

## Final Verification ✅

### Overall System Health
- [ ] No console errors in browser
- [ ] All pages load without breaking
- [ ] Navigation works smoothly
- [ ] No broken links
- [ ] Responsive design works (try different window sizes)
- [ ] Toast notifications appear and dismiss correctly

### Database Health
Run in Supabase SQL Editor:

```sql
-- Check all tables have RLS enabled
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies
  );
-- Should return empty (all tables have policies)

-- Check PostGIS
SELECT PostGIS_Version();
-- Should return version number

-- Check audit log
SELECT COUNT(*) FROM audit_log;
-- Should have entries
```

- [ ] All checks pass
- [ ] No errors in queries

### Documentation Complete
- [ ] README.md reviewed
- [ ] SETUP_GUIDE.md available
- [ ] DEPLOYMENT_GUIDE.md available
- [ ] ADMIN_HANDBOOK.md available
- [ ] ENTRA_ID_INTEGRATION.md available
- [ ] FEATURE_SUMMARY.md available
- [ ] QUICK_START.md available
- [ ] This TESTING_CHECKLIST.md printed/reviewed

---

## Test Summary

### Results
**Total Features Tested:** 5

**Pass:**
- [ ] Survey Jobs
- [ ] Control Points
- [ ] File Uploads
- [ ] Plan Endorsement
- [ ] Reports Dashboard

**Fail:** (list any)
_______________________________________

### Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Performance Notes
- Page load times: _______________________________________
- Map rendering: _______________________________________
- Chart rendering: _______________________________________
- Overall responsiveness: _______________________________________

---

## Sign-Off

**Tested By:** _______________________________________

**Date:** _______________________________________

**Time Spent:** _______ minutes

**Overall Assessment:**
⬜ Ready for Production
⬜ Minor fixes needed
⬜ Major issues found

**Next Steps:**
_______________________________________
_______________________________________
_______________________________________

---

**Thank you for testing the Surveying Division System! 🎉**

**Questions or issues?** Contact support@same.new

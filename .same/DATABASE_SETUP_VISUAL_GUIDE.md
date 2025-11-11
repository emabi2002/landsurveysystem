# Visual Database Setup Guide

## 🎯 Goal: Get Your Database Ready in 5 Minutes

This guide shows you EXACTLY what to click and where.

---

## Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Login with your Supabase account
3. You should see your projects list

**What you'll see:**
```
Your Supabase Projects
┌─────────────────────────────┐
│ yvnkyjnwvylrweyzvibs         │  ← Click this one
│ Surveying Division System    │
└─────────────────────────────┘
```

**Action:** Click on your project

---

## Step 2: Navigate to SQL Editor

Once inside your project:

1. Look at the left sidebar
2. Find "SQL Editor" icon (looks like </> or ⚡)
3. Click on it

**What you'll see in left sidebar:**
```
☰ Home
📊 Table Editor
⚡ SQL Editor          ← Click here
🔐 Authentication
📁 Storage
🔗 Edge Functions
⚙️  Settings
```

**Action:** Click "SQL Editor"

---

## Step 3: Create New Query

In SQL Editor:

1. Look for "New query" button (top right area)
2. Click it

**What you'll see:**
```
SQL Editor
┌──────────────────────┐
│  + New query         │  ← Click here
└──────────────────────┘

or

Templates    Queries    ⭐ Favorites
[ + New query ]  ← Or click here
```

**Action:** Click "+ New query"

**Result:** A blank SQL editor appears on the right side

---

## Step 4: Open the Database Schema File

On your computer:

1. Navigate to your project folder: `surveying-division-system`
2. Open the `.same` folder
3. Find file: `database-schema.sql`
4. Open it with any text editor:
   - VS Code (recommended)
   - Notepad (Windows)
   - TextEdit (Mac)
   - Any code editor

**File location:**
```
surveying-division-system/
  └── .same/
      └── database-schema.sql  ← This file
```

---

## Step 5: Copy the Schema

1. With `database-schema.sql` open:
2. Press **Ctrl+A** (Windows) or **Cmd+A** (Mac) to select all
3. Press **Ctrl+C** (Windows) or **Cmd+C** (Mac) to copy

**What you're copying:**
- The file is about 400+ lines
- Starts with: `-- Surveying Division Database Schema`
- Ends with: `COMMENT ON TABLE audit_log IS '...'`

**Tip:** Make sure you got EVERYTHING - scroll to the very bottom before copying!

---

## Step 6: Paste into Supabase

Back in the Supabase SQL Editor:

1. Click inside the blank editor area
2. Press **Ctrl+V** (Windows) or **Cmd+V** (Mac) to paste

**What you should see:**
```sql
-- Surveying Division Database Schema
-- Run this in Supabase SQL Editor

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- LOOKUP TABLES
-- =====================================================
...
[hundreds more lines]
...
```

**Verification:**
- Editor is full of SQL code
- Scroll down - there should be many lines
- Look for sections like "LOOKUP TABLES", "SURVEYORS", "CONTROL POINTS", etc.

---

## Step 7: Run the Schema

1. Look for the "RUN" button (usually green, top right of editor)
2. Click "RUN"

**What you'll see:**
```
┌──────────────────────┐
│    RUN    ▶          │  ← Click this button
└──────────────────────┘

or

[ Run ] (Ctrl+Enter)   ← Or press Ctrl+Enter
```

**Action:** Click "RUN" or press **Ctrl+Enter**

---

## Step 8: Wait for Execution

**What happens:**
1. Button shows "Running..." or spinner
2. Progress indicator may appear
3. Takes 5-30 seconds (depending on connection)

**During this time:**
- Don't close the browser
- Don't navigate away
- Wait patiently

**Progress indicators:**
```
Running...  [=====>            ] 45%
```

---

## Step 9: Check for Success

After execution completes, you'll see results below the editor:

**✅ SUCCESS looks like:**
```
Success. No rows returned
Execution time: 2.3 seconds
```

or

```
Results
┌──────────────────────┐
│ ✓ Success            │
│ 0 rows returned      │
│ 2.3s execution time  │
└──────────────────────┘
```

**❌ ERROR looks like:**
```
Error: relation "survey_jobs" already exists
```

**If you see error:**
- If error says "already exists" → Schema was already run, you're good! ✅
- If other error → Copy the error message and check Troubleshooting section below

---

## Step 10: Verify Tables Created

### Method 1: Table Editor

1. Click "Table Editor" in left sidebar
2. You should see a list of tables:

**Expected tables:**
```
Tables
├── accuracy_classes
├── audit_log
├── control_points        ← PostGIS geometry
├── crs_library
├── disputes
├── documents
├── field_uploads
├── instruments
├── job_types
├── parcel_fabric        ← PostGIS geometry
├── plans
├── processing_runs
├── survey_jobs          ← Main table
├── survey_statuses
├── surveyors
└── work_orders
```

**Count:** You should see **15+ tables**

### Method 2: SQL Query

In SQL Editor, run this:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected result:** List of 15+ table names

---

## Step 11: Verify PostGIS

Run this query:

```sql
SELECT PostGIS_Version();
```

**Expected result:**
```
postgis_version
───────────────────────────────────
3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

**✅ If you see a version number:** PostGIS is working!

**❌ If error:** PostGIS not enabled. Contact Supabase support.

---

## Step 12: Verify Seed Data

Run this query:

```sql
SELECT * FROM job_types;
```

**Expected result:** 6 rows
```
CADASTRAL
CONTROL
SUBDIVISION
BOUNDARY
EASEMENT
COURT_ORDER
```

Run this:

```sql
SELECT * FROM accuracy_classes;
```

**Expected result:** 4 rows
```
CLASS_A
CLASS_B
CLASS_C
CLASS_D
```

**✅ If you see data:** Seed data loaded successfully!

---

## Step 13: Check RLS Policies

Run this query:

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected result:** Multiple rows showing policies for:
- survey_jobs
- plans
- audit_log
- (and other tables)

**✅ If you see policies:** RLS (Row-Level Security) is enabled!

---

## Step 14: Optional - Load Sample Data

If you want test data to play with:

1. Open file: `.same/sample-data.sql`
2. Copy all content (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor (Ctrl+V)
4. Click "RUN"

**What this adds:**
- 5 sample survey jobs
- 5 sample control points
- 4 sample plans (including 1 endorsed)
- 4 sample file uploads
- 1 sample processing run
- 1 sample parcel
- Audit log entries

**Time:** ~10 seconds

**Result:** Your dashboard will show actual data instead of zeros!

---

## Troubleshooting

### Error: "relation already exists"

**Cause:** Schema has already been run

**Solution:** This is OK! Skip to verification steps.

**To reset completely (DANGER - deletes all data):**
```sql
-- ⚠️ WARNING: This deletes EVERYTHING!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run database-schema.sql again
```

### Error: "permission denied"

**Cause:** Not enough permissions

**Solution:**
1. Check you're the project owner
2. Or ask project owner to run the schema
3. Or contact Supabase support

### Error: "extension postgis does not exist"

**Cause:** PostGIS not enabled on your Supabase project

**Solution:**
1. Go to: Database → Extensions
2. Search for "postgis"
3. Click "Enable"
4. Wait for activation
5. Run schema again

### Tables not showing up

**Causes:**
1. Schema didn't run completely
2. Error occurred mid-execution
3. Wrong project selected

**Solutions:**
1. Check error messages in SQL Editor
2. Verify you're in correct project
3. Try running schema again
4. Contact support if persists

### Can't find .same folder

**Cause:** Wrong directory or hidden files

**Solution:**
1. Make sure you're in: `surveying-division-system/` folder
2. Show hidden files:
   - Windows: View → Show hidden files
   - Mac: Cmd+Shift+.
   - Linux: Ctrl+H
3. `.same` starts with a dot, might be hidden

---

## Visual Checklist

Print this and check off:

```
DATABASE SETUP CHECKLIST

□ Opened Supabase dashboard
□ Selected correct project
□ Navigated to SQL Editor
□ Created new query
□ Opened database-schema.sql file
□ Copied entire file content
□ Pasted into SQL Editor
□ Clicked RUN button
□ Saw "Success" message
□ Verified tables created (15+)
□ Verified PostGIS enabled
□ Verified seed data loaded
□ Verified RLS policies enabled
□ (Optional) Loaded sample data

TOTAL TIME: _____ minutes
```

---

## Next Steps

After database is set up:

1. **Test the application:**
   - Open: http://localhost:3000
   - Login: admin@lands.gov.pg / demo123
   - Follow: `.same/QUICK_START.md`

2. **Change security credentials:**
   - Rotate API keys
   - Change admin password
   - See: `.same/SETUP_GUIDE.md`

3. **Deploy to production:**
   - Follow: `.same/DEPLOYMENT_GUIDE.md`

---

## Help & Support

**Stuck?**
- Re-read this guide carefully
- Check Troubleshooting section
- Review error messages

**Still stuck?**
- Email: support@same.new
- Include:
  - Screenshot of error
  - Step where you got stuck
  - What you've tried

**Supabase Issues?**
- Supabase Docs: https://supabase.com/docs
- Supabase Support: https://supabase.com/dashboard/support

---

**🎉 Congratulations!**

Once you see "Success" and tables are created, you're ready to use the system!

**Created by:** Same.New
**Last Updated:** [Current Date]

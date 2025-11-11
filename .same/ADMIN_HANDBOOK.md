# Administrator Handbook - Surveying Division System

## Table of Contents

1. [System Overview](#system-overview)
2. [Admin Responsibilities](#admin-responsibilities)
3. [User Management](#user-management)
4. [Database Administration](#database-administration)
5. [Security & Access Control](#security--access-control)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)
9. [Incident Response](#incident-response)

---

## System Overview

### Architecture

```
User Browser
    ↓
Next.js Application (Netlify/Vercel)
    ↓
Supabase (PostgreSQL + PostGIS)
    ↓
Data Storage
    ├── Survey Jobs
    ├── Control Points (PostGIS)
    ├── Plans
    └── Audit Logs
```

### Technology Stack

- **Frontend:** Next.js 14, React, shadcn/ui
- **Backend:** Supabase (PostgreSQL 15 + PostGIS)
- **Authentication:** Supabase Auth → Entra ID (future)
- **Storage:** SharePoint/Supabase Storage
- **Hosting:** Netlify (recommended)

### Key Components

1. **Survey Job Registry** - Core workflow management
2. **Control Points** - Geodetic network (PostGIS spatial data)
3. **Parcel Fabric** - Versioned boundary management
4. **Audit System** - Immutable audit trail
5. **RLS (Row-Level Security)** - Data access control

---

## Admin Responsibilities

### Daily Tasks

- [ ] Monitor system health dashboard
- [ ] Review error logs
- [ ] Check pending user requests
- [ ] Verify backup completion

### Weekly Tasks

- [ ] Review audit logs for anomalies
- [ ] Check database performance metrics
- [ ] Update job statistics report
- [ ] Review user access patterns

### Monthly Tasks

- [ ] User access review
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Security audit
- [ ] Backup restoration test
- [ ] Performance optimization review

### Quarterly Tasks

- [ ] Rotate API keys and secrets
- [ ] Review and update RLS policies
- [ ] Disaster recovery drill
- [ ] User training sessions
- [ ] System capacity planning

---

## User Management

### Adding New Users

#### Method 1: Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter:
   - Email: `user@lands.gov.pg`
   - Password: Generate strong password
   - Confirm user
4. Add to `surveyors` table:
   ```sql
   INSERT INTO surveyors (email, name, status)
   VALUES ('user@lands.gov.pg', 'Full Name', 'active');
   ```

#### Method 2: SQL

```sql
-- Create auth user (requires service role key)
-- Then add to surveyors table
INSERT INTO surveyors (
  email,
  name,
  license_no,
  license_expiry,
  company,
  status
) VALUES (
  'newuser@lands.gov.pg',
  'Jane Doe',
  'LS-2024-001',
  '2025-12-31',
  'PNG Surveying Ltd',
  'active'
);
```

### Assigning Roles

Roles are managed via Entra ID groups (future) or custom claims:

```sql
-- Example: Grant admin role (update RLS policies to use this)
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"surveyor_general"'
)
WHERE email = 'admin@lands.gov.pg';
```

### Role Hierarchy

1. **Surveyor-General** - Full system access, endorsement authority
2. **Chief Surveyor** - Job assignment, QA sign-off
3. **Registered Surveyor** - Perform surveys, upload data
4. **Survey Technician** - Data entry, preliminary processing
5. **ROT Liaison** - View endorsed plans, coordinate with ROT
6. **Legal Liaison** - Access disputes, create evidence bundles
7. **Records Clerk** - Document management, retention
8. **System Admin** - Configuration only (no data modification)

### Disabling Users

```sql
-- Suspend user
UPDATE surveyors
SET status = 'suspended'
WHERE email = 'user@lands.gov.pg';

-- Also disable in Supabase Auth
-- Dashboard → Authentication → Users → Disable User
```

### Password Reset

1. Supabase Dashboard → Authentication → Users
2. Find user → Send recovery email
3. User receives reset link
4. Or manually reset:
   ```sql
   -- Generate new password
   UPDATE auth.users
   SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
   WHERE email = 'user@lands.gov.pg';
   ```

---

## Database Administration

### Connection Details

- **Host:** `your-project.supabase.co`
- **Database:** `postgres`
- **Port:** `5432`
- **SSL:** Required

### Direct Access

```bash
# Using psql
psql "postgresql://postgres:[PASSWORD]@your-project.supabase.co:5432/postgres"

# Using pgAdmin
# Add new server connection with above details
```

### Common Admin Queries

#### Check Database Size

```sql
SELECT
  pg_size_pretty(pg_database_size('postgres')) AS size;
```

#### Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bytes DESC;
```

#### Active Connections

```sql
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'postgres';
```

#### Index Usage

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Maintenance Tasks

#### Vacuum and Analyze

```sql
-- Vacuum all tables
VACUUM ANALYZE;

-- Specific table
VACUUM ANALYZE survey_jobs;
```

#### Reindex

```sql
-- Reindex table
REINDEX TABLE survey_jobs;

-- Reindex database
REINDEX DATABASE postgres;
```

#### Update Statistics

```sql
ANALYZE;
```

### PostGIS Maintenance

#### Check PostGIS Version

```sql
SELECT PostGIS_Version();
SELECT PostGIS_Full_Version();
```

#### Spatial Index Maintenance

```sql
-- Rebuild spatial index
REINDEX INDEX idx_control_points_geom;
REINDEX INDEX idx_parcel_fabric_geom;
```

#### Validate Geometries

```sql
-- Check for invalid geometries
SELECT id, code
FROM control_points
WHERE NOT ST_IsValid(geom);

-- Fix invalid geometries
UPDATE control_points
SET geom = ST_MakeValid(geom)
WHERE NOT ST_IsValid(geom);
```

---

## Security & Access Control

### Row-Level Security (RLS)

#### View Active Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

#### Test RLS

```sql
-- As admin
SET ROLE postgres;
SELECT COUNT(*) FROM survey_jobs; -- Should see all

-- Simulate regular user
SET ROLE authenticated;
SET request.jwt.claims TO '{"email":"user@lands.gov.pg","role":"registered_surveyor"}';
SELECT COUNT(*) FROM survey_jobs; -- Should see only assigned
```

#### Common RLS Patterns

```sql
-- View only assigned jobs
CREATE POLICY "view_assigned_jobs" ON survey_jobs
  FOR SELECT
  USING (
    auth.uid()::text = assigned_to::text
    OR auth.jwt() ->> 'role' IN ('admin', 'surveyor_general')
  );

-- Prevent deletion of endorsed plans
CREATE POLICY "no_delete_endorsed" ON plans
  FOR DELETE
  USING (is_immutable = false);
```

### API Key Management

#### Rotate Anon Key

1. Supabase Dashboard → Settings → API
2. Click "Regenerate" next to `anon` public key
3. Copy new key
4. Update environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=new-key-here
   ```
5. Redeploy application

#### Rotate Service Role Key

1. Same process as anon key
2. Update:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=new-key-here
   ```
3. **Critical:** Service role bypasses RLS!

### Audit Log Review

#### Recent Admin Actions

```sql
SELECT
  timestamp,
  actor,
  action,
  entity_table,
  entity_id
FROM audit_log
WHERE action IN ('endorse', 'delete', 'update_fabric')
ORDER BY timestamp DESC
LIMIT 100;
```

#### Suspicious Activity

```sql
SELECT
  DATE(timestamp) AS date,
  actor,
  COUNT(*) AS actions,
  array_agg(DISTINCT action) AS action_types
FROM audit_log
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), actor
HAVING COUNT(*) > 100
ORDER BY actions DESC;
```

#### Failed Login Attempts

```sql
-- This requires auth.audit_log (enable in Supabase)
SELECT *
FROM auth.audit_log_entries
WHERE log_type = 'failed_login'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## Monitoring & Alerts

### Health Checks

#### Application Health

```bash
# Check if app is responding
curl -I https://survey.lands.gov.pg

# Check login page
curl https://survey.lands.gov.pg | grep "Surveying Division"
```

#### Database Health

```sql
-- Connection pool
SELECT count(*) AS connections
FROM pg_stat_activity
WHERE datname = 'postgres';

-- Long running queries
SELECT
  pid,
  now() - query_start AS duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 minutes'
ORDER BY duration DESC;

-- Table bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Set Up Alerts

#### Supabase Dashboard

1. Go to Reports → Alerts
2. Configure:
   - Database CPU > 80%
   - Database RAM > 90%
   - Storage > 80%
   - Connection pool > 80%

#### External Monitoring

Use UptimeRobot or similar:

```
Monitor: https://survey.lands.gov.pg
Interval: 5 minutes
Alert: Email + SMS
```

### Performance Metrics

#### Query Performance

```sql
-- Slowest queries
SELECT
  query,
  calls,
  total_time / 1000 AS total_seconds,
  mean_time / 1000 AS mean_seconds,
  max_time / 1000 AS max_seconds
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```

---

## Backup & Recovery

### Automated Backups

Supabase provides automated daily backups.

**Configuration:**
- Dashboard → Database → Backups
- Frequency: Daily at 2 AM UTC
- Retention: 30 days (adjust based on needs)

### Manual Backup

```bash
# Full database dump
pg_dump -h your-project.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup-$(date +%Y%m%d).dump

# SQL format (for review)
pg_dump -h your-project.supabase.co \
  -U postgres \
  -d postgres \
  > backup-$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
# Restore full dump
pg_restore -h your-project.supabase.co \
  -U postgres \
  -d postgres \
  -c \
  backup-20241201.dump

# Restore SQL
psql -h your-project.supabase.co \
  -U postgres \
  -d postgres \
  < backup-20241201.sql
```

### Table-Level Restore

```sql
-- Export specific table
COPY survey_jobs TO '/tmp/survey_jobs_backup.csv' CSV HEADER;

-- Import table
COPY survey_jobs FROM '/tmp/survey_jobs_backup.csv' CSV HEADER;
```

### Test Recovery

**Monthly procedure:**

1. Download latest backup
2. Restore to test database
3. Verify data integrity
4. Test application connectivity
5. Document any issues

---

## Troubleshooting

### Common Issues

#### Can't Login

**Symptoms:** Login fails with incorrect credentials

**Causes:**
- Wrong password
- User account disabled
- Database connection issue

**Resolution:**
```sql
-- Check user exists
SELECT email, confirmed_at FROM auth.users
WHERE email = 'user@lands.gov.pg';

-- Check if confirmed
UPDATE auth.users
SET confirmed_at = NOW()
WHERE email = 'user@lands.gov.pg';

-- Reset password
-- Use Supabase Dashboard → Auth → Users → Send Recovery Email
```

#### Slow Performance

**Symptoms:** Pages load slowly, queries timeout

**Diagnosis:**
```sql
-- Check active queries
SELECT pid, age(clock_timestamp(), query_start), query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY age DESC;

-- Check locks
SELECT * FROM pg_locks
WHERE NOT granted;
```

**Resolution:**
1. Kill long-running queries
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE pid = 12345;
   ```
2. VACUUM ANALYZE
3. Rebuild indexes if needed

#### RLS Blocking Access

**Symptoms:** User can't see data they should access

**Diagnosis:**
```sql
-- Test as user
SET ROLE authenticated;
SET request.jwt.claims TO '{"email":"user@lands.gov.pg"}';
SELECT * FROM survey_jobs; -- Empty?

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'survey_jobs';
```

**Resolution:**
1. Review RLS policies
2. Check user role/claims
3. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE survey_jobs DISABLE ROW LEVEL SECURITY;
   -- TEST
   ALTER TABLE survey_jobs ENABLE ROW LEVEL SECURITY;
   ```

#### PostGIS Errors

**Symptoms:** Spatial queries fail

**Diagnosis:**
```sql
-- Check PostGIS installation
SELECT PostGIS_Version();

-- Check for invalid geometries
SELECT id FROM control_points WHERE NOT ST_IsValid(geom);
```

**Resolution:**
```sql
-- Fix invalid geometries
UPDATE control_points
SET geom = ST_MakeValid(geom)
WHERE NOT ST_IsValid(geom);

-- Rebuild spatial indexes
REINDEX INDEX idx_control_points_geom;
```

### Log Files

#### Supabase Logs

Dashboard → Logs → Database

Filter by:
- Error level
- Time range
- Query pattern

#### Application Logs

Netlify Dashboard → Functions → Logs

Check for:
- 500 errors
- Database connection errors
- Authentication failures

---

## Incident Response

### Severity Levels

**P0 - Critical**
- System completely down
- Data breach detected
- Database corruption

**P1 - High**
- Major feature broken
- Significant performance degradation
- RLS bypass discovered

**P2 - Medium**
- Minor feature broken
- Some users affected
- Workaround available

**P3 - Low**
- Cosmetic issue
- Feature request
- Documentation error

### Response Procedures

#### P0: System Down

1. **Immediate Actions**
   - Check Supabase status: https://status.supabase.com
   - Check Netlify status: https://status.netlify.com
   - Verify DNS resolution
   - Check error logs

2. **Communication**
   - Notify all users via email
   - Post status update
   - Alert management

3. **Recovery**
   - Identify root cause
   - Apply fix or rollback
   - Verify system operational
   - Post-mortem within 24 hours

#### P0: Data Breach

1. **Immediate Actions**
   - Rotate all API keys
   - Disable compromised accounts
   - Enable audit logging
   - Preserve evidence

2. **Investigation**
   - Review audit_log table
   - Check auth.audit_log_entries
   - Identify scope of breach
   - Document timeline

3. **Remediation**
   - Patch vulnerabilities
   - Force password reset
   - Update RLS policies
   - Notify affected parties

4. **Prevention**
   - Security review
   - Update procedures
   - Additional training

### Escalation Path

1. **L1 Support** → Basic troubleshooting
2. **L2 Admin** → Database/system issues
3. **L3 Developer** → Code changes required
4. **Security Team** → Incidents involving data breach
5. **Management** → System-wide outages, legal issues

### Contact List

- **System Admin:** admin@lands.gov.pg
- **Database Admin:** dba@lands.gov.pg
- **Security Team:** security@lands.gov.pg
- **Supabase Support:** support@supabase.com
- **Same.New Support:** support@same.new

---

## Key Rotation Schedule

### Quarterly Rotation

| Secret | Location | How to Rotate |
|--------|----------|---------------|
| Supabase Anon Key | Dashboard → API | Click "Regenerate" |
| Supabase Service Key | Dashboard → API | Click "Regenerate" |
| Entra ID Client Secret | Azure Portal | Certificates & Secrets → New |
| SMTP Password | M365 Admin | Generate app password |

### Rotation Procedure

1. **Pre-rotation**
   - Schedule maintenance window
   - Notify users
   - Prepare rollback plan

2. **Rotation**
   - Generate new secret
   - Update environment variables
   - Deploy application
   - Test functionality

3. **Post-rotation**
   - Verify system operational
   - Delete old secret
   - Document completion
   - Update runbook

---

## Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostGIS Manual:** https://postgis.net/docs/
- **Next.js Docs:** https://nextjs.org/docs
- **Project Documentation:** `.same/` directory

---

**Last Updated:** [Date]
**Maintained By:** System Administrator
**Review Frequency:** Quarterly

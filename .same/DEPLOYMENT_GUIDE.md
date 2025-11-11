# Deployment Guide - Surveying Division System

## Pre-Deployment Checklist

### ⚠️ CRITICAL SECURITY ACTIONS

Before deploying to production, you **MUST** complete these:

- [ ] **Rotate Supabase API keys** in Dashboard → Project Settings → API
- [ ] **Change admin password** from `demo123` to a strong password
- [ ] **Remove demo credentials** from all documentation
- [ ] **Review all RLS policies** for production environment
- [ ] **Configure backup schedule** in Supabase
- [ ] **Set up monitoring and alerts**
- [ ] **Enable audit logging** for all critical operations
- [ ] **Test disaster recovery** procedure

### Database Setup

- [ ] Run `database-schema.sql` in Supabase SQL Editor
- [ ] Verify PostGIS is enabled (`SELECT PostGIS_Version();`)
- [ ] Confirm all seed data is loaded
- [ ] Test RLS policies with different user roles
- [ ] Set up database backups (daily recommended)

### Environment Variables

- [ ] Create production `.env.local` with new keys
- [ ] Configure Entra ID credentials (if using)
- [ ] Set up Microsoft Graph API credentials (if using)
- [ ] Configure SMTP settings for email notifications
- [ ] Set `NODE_ENV=production`

---

## Deployment Options

### Option 1: Netlify (Recommended)

Netlify supports both static and dynamic Next.js deployments.

#### Static Deployment (Faster)

1. **Prepare for Static Export**

   Update `next.config.js`:
   ```javascript
   module.exports = {
     output: 'export',
     distDir: 'out',
   }
   ```

2. **Build and Deploy**
   ```bash
   cd surveying-division-system
   bun run build
   zip -r9 output.zip out
   ```

3. **Deploy via Same.New**
   - Use the Deploy button in Same.New
   - Select "Static Site"
   - Upload `output.zip`

**Limitations:** Static export doesn't support API routes or server-side features.

#### Dynamic Deployment (Full Features)

1. **Configure `netlify.toml`**

   Already configured in the project:
   ```toml
   [build]
     command = "bun run build"
     publish = ".next"
   ```

2. **Deploy via Same.New**
   - Click Deploy button
   - Select "Dynamic Site"
   - Netlify will handle the deployment

3. **Add Environment Variables**
   - In Netlify Dashboard → Site Settings → Environment Variables
   - Add all variables from `.env.local`

### Option 2: Vercel

1. **Connect GitHub Repository**
   - Push code to GitHub
   - Import project in Vercel Dashboard

2. **Configure Environment Variables**
   - Add all variables from `.env.local`

3. **Deploy**
   - Vercel auto-deploys on push to main branch

### Option 3: Self-Hosted (VPS/Cloud)

1. **Server Requirements**
   - Node.js 18+ or Bun runtime
   - PM2 or similar process manager
   - Nginx reverse proxy
   - SSL certificate

2. **Build**
   ```bash
   bun run build
   ```

3. **Start**
   ```bash
   pm2 start bun --name surveying -- run start
   ```

4. **Nginx Configuration**
   ```nginx
   server {
     listen 80;
     server_name survey.lands.gov.pg;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

---

## Post-Deployment Configuration

### 1. Entra ID (Azure AD) SSO

1. **Register Application**
   - Azure Portal → Entra ID → App Registrations
   - New registration
   - Redirect URI: `https://your-domain.com/auth/callback`

2. **Create App Roles**
   ```json
   [
     {
       "displayName": "Surveyor General",
       "value": "surveyor_general"
     },
     {
       "displayName": "Chief Surveyor",
       "value": "chief_surveyor"
     },
     {
       "displayName": "Registered Surveyor",
       "value": "registered_surveyor"
     }
   ]
   ```

3. **Update Environment Variables**
   ```env
   NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id
   NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id
   AZURE_AD_CLIENT_SECRET=your-client-secret
   ```

4. **Update Code**
   - Replace `AuthProvider.tsx` with MSAL implementation
   - Use `@azure/msal-react` (already installed)

### 2. Microsoft Graph API

1. **API Permissions**
   - Azure Portal → App → API Permissions
   - Add: `Mail.Send`, `Mail.ReadWrite`, `Sites.Selected`
   - Admin consent required

2. **Shared Mailbox**
   - Create: `survey-notices@lands.gov.pg`
   - Grant app access

3. **SharePoint Site**
   - Create site: "Surveying Division"
   - Libraries: Plans, Field Data, Legal Bundles
   - Grant app `Sites.Selected` permission

### 3. Email Notifications

Configure in environment:

```env
GRAPH_API_SCOPE=https://graph.microsoft.com/.default
SMTP_USER=survey-notices@lands.gov.pg
```

Or fallback to SMTP:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=survey-notices@lands.gov.pg
SMTP_PASSWORD=your-app-password
```

### 4. Custom Domain

1. **Netlify**
   - Dashboard → Domain Settings
   - Add custom domain: `survey.lands.gov.pg`
   - Configure DNS:
     ```
     CNAME  survey  your-site.netlify.app
     ```

2. **SSL Certificate**
   - Netlify provides free SSL (Let's Encrypt)
   - Auto-renewal

---

## Monitoring & Maintenance

### Health Checks

1. **Application Health**
   - Test login at: `https://survey.lands.gov.pg`
   - Verify dashboard loads
   - Test job creation

2. **Database Health**
   ```sql
   -- Check table counts
   SELECT
     'survey_jobs' AS table, COUNT(*) FROM survey_jobs
   UNION ALL
   SELECT 'control_points', COUNT(*) FROM control_points;

   -- Check RLS
   SELECT tablename, policyname FROM pg_policies;
   ```

3. **API Health**
   - Monitor Supabase dashboard for errors
   - Check query performance
   - Review connection pool

### Backups

1. **Supabase Backups**
   - Dashboard → Database → Backups
   - Schedule: Daily at 2 AM UTC
   - Retention: 30 days

2. **Export Critical Data**
   ```bash
   # Monthly export
   pg_dump -h your-db.supabase.co -U postgres -d postgres > backup-$(date +%Y%m%d).sql
   ```

3. **Document Backups**
   - SharePoint: Built-in versioning
   - Supabase Storage: Configure lifecycle rules

### Logging

1. **Application Logs**
   - Netlify: Functions → Logs
   - Vercel: Deployment → Logs

2. **Audit Logs**
   ```sql
   -- Recent admin actions
   SELECT * FROM audit_log
   WHERE action IN ('endorse', 'delete', 'update_fabric')
   ORDER BY timestamp DESC
   LIMIT 100;
   ```

3. **Error Monitoring**
   - Set up Sentry or similar
   - Alert on critical errors

---

## Security Hardening

### 1. Rate Limiting

Add to Netlify `netlify.toml`:

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  rate_limit = {
    window_size = "1m",
    window_limit = 100
  }
```

### 2. Content Security Policy

Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]
```

### 3. Database Security

```sql
-- Revoke public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Grant only necessary permissions
GRANT SELECT, INSERT ON survey_jobs TO authenticated;
```

### 4. Secrets Rotation

Schedule quarterly:
- [ ] Rotate Supabase keys
- [ ] Rotate Azure AD client secret
- [ ] Update Graph API credentials
- [ ] Change service account passwords

---

## Disaster Recovery

### Scenario 1: Database Corruption

1. Stop application
2. Restore from latest Supabase backup
3. Verify data integrity
4. Resume application
5. Post-mortem analysis

### Scenario 2: Data Breach

1. **Immediate Actions**
   - Rotate all API keys
   - Force password reset for all users
   - Review audit logs for unauthorized access
   - Notify security team

2. **Investigation**
   - Check `audit_log` table
   - Review Supabase auth logs
   - Identify compromised data

3. **Remediation**
   - Apply security patches
   - Update RLS policies
   - Enable 2FA if available

### Scenario 3: Service Outage

1. Check status pages:
   - Supabase: https://status.supabase.com
   - Netlify: https://status.netlify.com

2. Failover (if configured):
   - Switch to backup region
   - Update DNS

3. Communication:
   - Notify users via email
   - Post status on internal portal

---

## Performance Optimization

### 1. Database Indexing

```sql
-- Add indexes for common queries
CREATE INDEX idx_jobs_created_at ON survey_jobs(created_at DESC);
CREATE INDEX idx_jobs_status_sla ON survey_jobs(status, sla_due);
CREATE INDEX idx_plans_job ON plans(survey_job_id);
```

### 2. Query Optimization

Use explain analyze:

```sql
EXPLAIN ANALYZE
SELECT * FROM survey_jobs
WHERE status = 'registered'
ORDER BY created_at DESC
LIMIT 50;
```

### 3. Caching

Enable Next.js caching:

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

### 4. Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image'
<Image src="/logo.png" width={200} height={100} alt="Logo" />
```

---

## User Training

### 1. Admin Training

- System configuration
- User management
- Backup procedures
- Security protocols

### 2. Surveyor Training

- Job registration
- Data upload
- QA procedures
- Plan endorsement

### 3. Support Training

- Common issues
- Password resets
- Access troubleshooting
- Escalation procedures

---

## Support & Maintenance

### Contacts

- **Technical Support:** support@same.new
- **Database Admin:** dba@lands.gov.pg
- **Security Team:** security@lands.gov.pg

### Maintenance Windows

- **Scheduled:** Sunday 2-4 AM UTC
- **Notification:** 7 days advance notice
- **Rollback Plan:** Always prepared

### SLA

- **Uptime:** 99.5% monthly
- **Support Response:** 4 hours (business hours)
- **Critical Issues:** 1 hour response

---

## Compliance Checklist

- [ ] GDPR compliance (if applicable)
- [ ] Data retention policies configured
- [ ] Audit logs enabled and monitored
- [ ] Access controls reviewed
- [ ] Encryption verified (transit + rest)
- [ ] Backup tested and validated
- [ ] Incident response plan documented
- [ ] User training completed
- [ ] Security assessment passed
- [ ] Legal review completed

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Approved By:** _______________

**Next Review:** _______________

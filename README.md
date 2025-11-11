# DLPP Surveying Division Management System

![DLPP Logo](public/dlpp-logo.svg)

A comprehensive cadastral survey management system for the Department of Lands & Physical Planning (DLPP), Papua New Guinea.

## 🎯 Overview

The Surveying Division Sub-System is a modern web-based platform designed to manage the complete lifecycle of cadastral survey operations, from job intake to plan endorsement and parcel fabric updates.

### Key Features

✅ **Survey Job Management**
- Job intake with automated assignment
- Priority-based SLA tracking
- Multi-source request handling (ROT, Court, Internal, External)
- Real-time status tracking

✅ **Control Points Registry**
- PostGIS-enabled spatial database
- Interactive Leaflet map visualization
- Accuracy classification system
- Monument condition tracking

✅ **Field Data Upload System**
- Drag-and-drop file upload
- Multi-format support (GNSS, RINEX, Photos, Field Notes)
- Automated validation and checksum
- Metadata extraction

✅ **Plan Endorsement Workflow**
- Multi-level approval process
- Digital signature support
- Immutable endorsed plans
- Version control

✅ **Reporting & Analytics**
- SLA compliance monitoring
- Job status dashboards
- Interactive charts (Recharts)
- Export capabilities

✅ **Parcel Fabric Management**
- Versioned parcel geometry
- Change tracking and audit trail
- Integration with endorsed plans

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun runtime
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/emabi2002/landsurveysystem.git
   cd landsurveysystem
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**

   - Open Supabase SQL Editor
   - Run the schema: `.same/database-schema.sql`
   - (Optional) Load sample data: `.same/sample-data.sql`

   See detailed guide: [`.same/DATABASE_SETUP_VISUAL_GUIDE.md`](.same/DATABASE_SETUP_VISUAL_GUIDE.md)

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Open the application**

   Navigate to http://localhost:3000

   **Demo credentials:**
   - Email: `admin@lands.gov.pg`
   - Password: `demo123`

## 📚 Documentation

Complete documentation is available in the `.same` folder:

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](.same/QUICK_START.md) | 15-minute setup guide |
| [DATABASE_SETUP_VISUAL_GUIDE.md](.same/DATABASE_SETUP_VISUAL_GUIDE.md) | Step-by-step database setup |
| [TESTING_CHECKLIST.md](.same/TESTING_CHECKLIST.md) | Comprehensive testing guide |
| [FEATURE_SUMMARY.md](.same/FEATURE_SUMMARY.md) | Complete feature overview |
| [SETUP_GUIDE.md](.same/SETUP_GUIDE.md) | Technical setup documentation |
| [DEPLOYMENT_GUIDE.md](.same/DEPLOYMENT_GUIDE.md) | Production deployment |
| [ADMIN_HANDBOOK.md](.same/ADMIN_HANDBOOK.md) | Administrator manual |
| [ENTRA_ID_INTEGRATION.md](.same/ENTRA_ID_INTEGRATION.md) | Microsoft SSO setup |

## 🏗️ Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Maps:** Leaflet, React-Leaflet
- **Charts:** Recharts
- **Authentication:** Supabase Auth (demo) / Microsoft Entra ID (production)
- **Notifications:** Sonner
- **Runtime:** Bun

## 🔒 Security

### ⚠️ IMPORTANT: Before Production Deployment

1. **Rotate API Keys**
   - Generate new Supabase API keys
   - Store securely in environment vault

2. **Change Passwords**
   - Update admin password from `demo123`
   - Enforce strong password policy

3. **Enable Row-Level Security**
   - RLS policies are pre-configured in schema
   - Verify policies are active in Supabase dashboard

4. **Implement Microsoft Entra ID SSO**
   - Follow guide: [ENTRA_ID_INTEGRATION.md](.same/ENTRA_ID_INTEGRATION.md)
   - Disable demo authentication

See complete security checklist: [DEPLOYMENT_GUIDE.md](.same/DEPLOYMENT_GUIDE.md)

## 📋 System Requirements

### Database
- PostgreSQL 14+ with PostGIS extension
- Supabase project with PostGIS enabled
- Minimum 1GB storage

### Server
- Node.js 18+ or Bun runtime
- 512MB RAM minimum
- HTTPS required for production

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🎨 Green Theme & Branding

The system features a professional green color scheme aligned with DLPP branding:

- Primary green: `#16A34A` (green-600)
- Accent green: Various shades for depth
- DLPP logo integrated in header and login

## 🧪 Testing

Run the comprehensive testing checklist:

```bash
# Start dev server
bun run dev

# Follow testing guide
.same/TESTING_CHECKLIST.md
```

### Test Coverage

- Survey job lifecycle
- Control points CRUD
- File upload validation
- Plan endorsement workflow
- Reporting dashboards

## 📦 Database Schema

The system uses a comprehensive PostgreSQL schema with:

- **15+ tables** for complete survey operations
- **PostGIS** spatial columns for geometry
- **Row-Level Security** for data access control
- **Audit logging** for compliance
- **Versioning** for parcel fabric

### Key Tables

- `survey_jobs` - Main survey job registry
- `control_points` - PostGIS control point network
- `plans` - Survey plan versions
- `field_uploads` - Field data files
- `parcel_fabric` - Versioned parcel geometry
- `audit_log` - Complete audit trail

Schema file: [`.same/database-schema.sql`](.same/database-schema.sql)

## 🚢 Deployment

### Netlify/Vercel Deployment

The system supports deployment to modern hosting platforms:

```bash
# Build for production
bun run build

# Test production build locally
bun start
```

See detailed guide: [DEPLOYMENT_GUIDE.md](.same/DEPLOYMENT_GUIDE.md)

### Environment Configuration

Required environment variables for production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_AZURE_AD_CLIENT_ID` (for SSO)
- `NEXT_PUBLIC_AZURE_AD_TENANT_ID` (for SSO)
- `AZURE_AD_CLIENT_SECRET` (for SSO)

## 🤝 Contributing

This is a government system. Contributions should follow:

1. Code review process
2. Security audit requirements
3. Testing checklist completion
4. Documentation updates

## 📄 License

Proprietary system for Department of Lands & Physical Planning, Papua New Guinea.

## 📞 Support

**System Issues:**
- Review documentation in `.same` folder
- Check [ADMIN_HANDBOOK.md](.same/ADMIN_HANDBOOK.md) troubleshooting

**Supabase Issues:**
- Supabase Dashboard → Support
- https://supabase.com/docs

**Azure/Entra ID Issues:**
- IT Administrator
- Microsoft Support

## 🎯 Roadmap

See current development status: [`.same/todos.md`](.same/todos.md)

### Completed Features ✅
- Job intake and assignment
- Control points with PostGIS
- Field data upload system
- Plan endorsement workflow
- Reporting dashboards
- Green theme with DLPP branding

### Planned Features 🔮
- Microsoft Entra ID SSO (guide ready)
- ROT hand-off packages
- Legal escalation workflow
- Email notifications via Graph API
- SharePoint document integration
- Advanced spatial queries

## 🏆 Acknowledgments

- **Built with:** Same.new
- **Database:** Supabase + PostGIS
- **UI Framework:** shadcn/ui
- **Maps:** Leaflet

---

**🎉 Ready to use!**

Follow [QUICK_START.md](.same/QUICK_START.md) to get started in 15 minutes.

**⚠️ Remember:** Change demo credentials before production deployment!

---

**Department of Lands & Physical Planning**
*Papua New Guinea Government*

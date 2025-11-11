# Microsoft Entra ID (Azure AD) SSO Integration Guide

## Overview

Replace Supabase email/password authentication with Microsoft Entra ID (formerly Azure AD) for enterprise single sign-on (SSO).

**Benefits:**
- ✅ Organizational credentials (no separate passwords)
- ✅ Role-based access via Entra ID groups
- ✅ Multi-factor authentication (MFA) support
- ✅ Centralized user management
- ✅ Audit trail integration

---

## Prerequisites

- [ ] Microsoft Entra ID (Azure AD) tenant
- [ ] Global Administrator or Application Administrator role
- [ ] Users/groups configured in Entra ID
- [ ] `@azure/msal-browser` and `@azure/msal-react` installed ✅ (already added)

---

## Part 1: Azure Portal Configuration

### Step 1: Register Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Entra ID** (or Azure Active Directory)
3. Click **App registrations** → **New registration**

**Registration details:**
- Name: `Surveying Division System`
- Supported account types: `Accounts in this organizational directory only`
- Redirect URI:
  - Platform: `Single-page application (SPA)`
  - URI: `http://localhost:3000` (development)
  - Add production URI later: `https://survey.lands.gov.pg`

4. Click **Register**

**Save these values:**
- Application (client) ID: `________________________`
- Directory (tenant) ID: `________________________`

### Step 2: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph**
3. Select **Delegated permissions**
4. Add these permissions:
   - `User.Read` (read user profile)
   - `email` (read user email)
   - `openid` (OpenID Connect)
   - `profile` (basic profile info)
   - `offline_access` (refresh tokens)

5. Click **Add permissions**
6. Click **Grant admin consent** (requires admin)

### Step 3: Create App Roles

1. Go to **App roles**
2. Click **Create app role**

Create these roles:

| Display Name | Value | Description |
|--------------|-------|-------------|
| Surveyor-General | `surveyor_general` | Full system access and endorsement authority |
| Chief Surveyor | `chief_surveyor` | Job assignment and QA sign-off |
| Registered Surveyor | `registered_surveyor` | Perform surveys and upload data |
| Survey Technician | `survey_technician` | Data entry and preliminary processing |
| ROT Liaison | `rot_liaison` | View endorsed plans, coordinate with ROT |
| Legal Liaison | `legal_liaison` | Access disputes and evidence bundles |
| Records Clerk | `records_clerk` | Document management and retention |
| System Admin | `system_admin` | Configuration only, no data edits |

For each role:
- Allowed member types: `Users/Groups`
- Value: (as shown above)
- Description: (as shown above)
- Enabled: ✅

### Step 4: Assign Users to Roles

1. Go to **Enterprise applications**
2. Find your app: "Surveying Division System"
3. Click **Users and groups**
4. Click **Add user/group**
5. Select user/group
6. Select role
7. Click **Assign**

**Example:**
- User: `john.doe@lands.gov.pg`
- Role: `Registered Surveyor`

Repeat for all users.

### Step 5: Add Redirect URIs

1. Go to **Authentication**
2. Under **Single-page application**, add:
   - Development: `http://localhost:3000`
   - Production: `https://survey.lands.gov.pg`
   - Production: `https://your-netlify-domain.netlify.app`

3. **Advanced settings:**
   - Allow public client flows: `No`
   - Enable ID tokens: ✅
   - Enable access tokens: ✅

4. Save changes

---

## Part 2: Application Code Changes

### Step 1: Update Environment Variables

Add to `.env.local`:

```env
# Microsoft Entra ID (Azure AD)
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id-here
NEXT_PUBLIC_AZURE_AD_REDIRECT_URI=http://localhost:3000

# Optional: For Graph API (email, SharePoint)
NEXT_PUBLIC_GRAPH_API_SCOPE=https://graph.microsoft.com/.default
```

### Step 2: Create MSAL Configuration

Create `src/lib/auth/msalConfig.ts`:

```typescript
import { Configuration, PopupRequest } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI || 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'email', 'profile', 'openid'],
}
```

### Step 3: Replace AuthProvider

Replace `src/lib/auth/AuthProvider.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult,
} from '@azure/msal-browser'
import { msalConfig, loginRequest } from './msalConfig'

interface AuthContextType {
  user: AccountInfo | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  roles: string[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const msalInstance = new PublicClientApplication(msalConfig)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    msalInstance.initialize().then(() => {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        setUser(accounts[0])
        extractRoles(accounts[0])
      }
      setLoading(false)
    })
  }, [])

  const extractRoles = (account: AccountInfo) => {
    const userRoles = (account.idTokenClaims as any)?.roles || []
    setRoles(userRoles)
  }

  const signIn = async () => {
    try {
      const response: AuthenticationResult = await msalInstance.loginPopup(loginRequest)
      setUser(response.account)
      extractRoles(response.account)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    await msalInstance.logoutPopup()
    setUser(null)
    setRoles([])
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, roles }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### Step 4: Update LoginForm

Update `src/components/auth/LoginForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn()
      toast.success('Signed in successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Surveying Division</CardTitle>
        <CardDescription>
          Sign in with your organizational account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In with Microsoft'}
          </Button>
        </form>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Use your @lands.gov.pg credentials</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Step 5: Update Row-Level Security

Modify RLS policies to use Entra ID roles:

```sql
-- Update survey jobs policy
DROP POLICY IF EXISTS "Users can view assigned jobs" ON survey_jobs;

CREATE POLICY "Users can view jobs based on role" ON survey_jobs
  FOR SELECT
  USING (
    -- Surveyor-General and Chief Surveyor see all
    auth.jwt() ->> 'role' IN ('surveyor_general', 'chief_surveyor', 'system_admin')
    OR
    -- Others see only assigned jobs
    auth.uid()::text = assigned_to::text
  );

-- Update plans endorsement policy
CREATE POLICY "Only authorized can endorse" ON plans
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' IN ('surveyor_general', 'chief_surveyor')
    AND is_immutable = false
  );
```

---

## Part 3: Testing

### Test with Development Account

1. Start dev server: `bun run dev`
2. Navigate to: `http://localhost:3000`
3. Click "Sign In with Microsoft"
4. Microsoft login popup appears
5. Enter credentials: `your-user@lands.gov.pg`
6. Consent to permissions (first time only)
7. Should redirect to dashboard

### Verify Roles

Add to dashboard to test roles:

```typescript
const { roles } = useAuth()

console.log('User roles:', roles)
// Should show: ['registered_surveyor'] or similar
```

### Test RLS Policies

```sql
-- Set user context for testing
SET request.jwt.claims TO '{"email":"user@lands.gov.pg","role":"registered_surveyor"}';

-- Test query
SELECT * FROM survey_jobs;
-- Should return only jobs assigned to this user
```

---

## Part 4: Production Deployment

### Update Environment Variables

In Netlify/Vercel:

```env
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=prod-client-id
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AZURE_AD_REDIRECT_URI=https://survey.lands.gov.pg
```

### Update Azure Redirect URIs

1. Azure Portal → App registrations
2. Add production URI: `https://survey.lands.gov.pg`
3. Save

### Test Production Login

1. Visit: `https://survey.lands.gov.pg`
2. Sign in with organizational account
3. Verify user sees correct data based on role

---

## Part 5: Graph API Integration (Optional)

For email notifications and SharePoint integration.

### Grant Graph Permissions

1. Azure Portal → API permissions
2. Add Microsoft Graph permissions:
   - `Mail.Send` - Send emails
   - `Mail.ReadWrite` - Read/write emails
   - `Sites.Selected` - Access specific SharePoint sites

3. Click **Grant admin consent**

### Get Access Token

```typescript
import { msalInstance } from '@/lib/auth/msalConfig'

async function getGraphToken() {
  const account = msalInstance.getAllAccounts()[0]

  const response = await msalInstance.acquireTokenSilent({
    scopes: ['https://graph.microsoft.com/Mail.Send'],
    account,
  })

  return response.accessToken
}
```

### Send Email via Graph

```typescript
async function sendEmail(to: string, subject: string, body: string) {
  const token = await getGraphToken()

  const message = {
    subject,
    body: {
      contentType: 'HTML',
      content: body,
    },
    toRecipients: [{
      emailAddress: { address: to }
    }],
  }

  await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })
}
```

---

## Troubleshooting

### Error: "AADSTS50011: Redirect URI mismatch"

**Solution:**
1. Check redirect URI in Azure matches exactly
2. Include protocol (`http://` or `https://`)
3. No trailing slash

### Error: "User doesn't have required role"

**Solution:**
1. Azure Portal → Enterprise applications
2. Find your app → Users and groups
3. Verify user is assigned correct role

### Error: "Consent required"

**Solution:**
1. Have admin grant consent in Azure Portal
2. OR: Enable user consent for specific permissions

### Popup Blocked

**Solution:**
- Use redirect flow instead of popup:
  ```typescript
  await msalInstance.loginRedirect(loginRequest)
  ```

---

## Security Best Practices

1. **Rotate Client Secrets:**
   - If using client secret (not needed for SPA)
   - Rotate every 6 months

2. **Monitor Sign-ins:**
   - Azure Portal → Sign-in logs
   - Review unusual activity

3. **Enable MFA:**
   - Entra ID → Security → MFA
   - Require for all users

4. **Conditional Access:**
   - Restrict by IP range
   - Require compliant devices
   - Block legacy authentication

5. **Review Permissions:**
   - Quarterly review of user roles
   - Remove inactive users

---

## Migration Checklist

- [ ] Register app in Azure Portal
- [ ] Configure app roles
- [ ] Assign users to roles
- [ ] Update environment variables
- [ ] Replace AuthProvider with MSAL
- [ ] Update LoginForm component
- [ ] Modify RLS policies for Entra ID roles
- [ ] Test in development
- [ ] Update production redirect URIs
- [ ] Deploy to production
- [ ] Test production login
- [ ] Disable Supabase email/password auth
- [ ] Document for users
- [ ] Train administrators

---

## Support Resources

- **MSAL.js Docs:** https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview
- **Azure Portal:** https://portal.azure.com
- **Graph API:** https://learn.microsoft.com/en-us/graph/
- **Conditional Access:** https://learn.microsoft.com/en-us/entra/identity/conditional-access/

---

**Last Updated:** [Date]
**Prepared By:** System Administrator
**Review Frequency:** Quarterly

# Hearty Bridge - Next.js Application

## Important: Next.js Version Notice

This project uses **Next.js 16.2.6** (App Router). APIs, conventions, and file structure
may differ from older versions. Before modifying any Next.js internals, read the relevant
guide in `node_modules/next/dist/docs/`.

## Project Purpose

Healthcare collaboration platform for parents and therapists managing children's therapeutic care.

**User roles**: `admin`, `therapist`, `parent`

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: MongoDB via Mongoose 9
- **Auth**: JWT (`jsonwebtoken`) + bcryptjs
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod validation
- **Storage**: Cloudflare R2 via @aws-sdk/client-s3 (S3-compatible, private bucket + signed URLs)
- **i18n**: next-intl 4

## Directory Layout

```
app/
  api/          # Backend API routes (54+ endpoints)
  auth/         # Login, register pages
  dashboard/    # Protected dashboard pages
  page.tsx      # Public landing page
components/
  ui/           # Base UI components (Button, Card, Input, Dialog, etc.)
  layout/       # Header, Footer, DashboardSidebar, DashboardLayout
  auth/         # AuthGuard, ProtectedRoute
  messaging/    # ChatWindow, ConversationList
  documents/    # DocumentLibrary, DocumentUploadDialog
  schedule/     # WeeklyScheduleTable, PatientAssignmentModal
  search/       # GlobalSearchBar, SearchResults
  family-tree/  # FamilyTreeVisualization
  child-profile/ # ChildProfileLayout, MediaGallery, MilestoneTracker
  admin/        # TherapistAssignmentModal
models/         # Mongoose schemas (User, Child, Session, Message, etc.)
lib/
  contexts/     # auth-context.tsx (useAuth hook)
  db/           # mongodb.ts (connection singleton)
  middleware/   # auth.ts (withAnyAuth, withAdminAuth)
  services/     # b2-storage, mock-data-service, local-data-service
  utils/        # error-handler.ts, jwt.ts, permissions.ts
  validation/   # Zod schemas per domain
  config/       # (empty — Google config removed)
data/           # JSON mock data files (fallback when DB unavailable)
scripts/        # Database seed/setup scripts
i18n/           # next-intl config
messages/       # Translation files (Indonesian + English)
```

## API Route Pattern

Every API route must follow this pattern:

```typescript
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(
  withAnyAuth(async (req: NextRequest, { user }) => {
    // user.userId, user.email, user.role, user.name available here
    return NextResponse.json(SuccessResponse.ok(data));
  })
);
```

Use `withAdminAuth` instead of `withAnyAuth` for admin-only routes.

## Database Connection

```typescript
import connectToDatabase from '@/lib/db/mongodb';
await connectToDatabase();
```

Do NOT use `connectDB` — it does not exist. The correct export is `connectToDatabase` (default export).

## Error Responses

```typescript
ErrorResponse.badRequest('message', details?)
ErrorResponse.unauthorized()
ErrorResponse.forbidden()
ErrorResponse.notFound('resource')
ErrorResponse.conflict('message')
ErrorResponse.internal()

SuccessResponse.ok(data, message?)
SuccessResponse.created(data, message?)
```

## Zod Validation

Validate request bodies before processing:

```typescript
import { z } from 'zod';
const schema = z.object({ ... });
const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json(ErrorResponse.badRequest('Invalid input', result.error.issues));
}
```

Use `.issues` not `.errors` when accessing Zod error details.

## Auth Context (Frontend)

```typescript
import { useAuth } from '@/lib/contexts/auth-context';
const { user, isLoading, login, logout, register, updateProfile } = useAuth();
```

Token is stored in `localStorage` under key `"token"`.
Pass as: `Authorization: Bearer <token>` header.

## Path Alias

`@/*` maps to the project root (`nextjs-boilerplate/hearty-bridge/`).

## Common Commands

```bash
npm run dev               # Start dev server on port 3000
npm run build             # Production build
npm run lint              # ESLint
npx tsc --noEmit          # TypeScript check (full project)
npx tsc --noEmit --skipLibCheck <file>  # Check single file
node scripts/seed-database.js           # Seed MongoDB
node scripts/create-admin-user.js       # Create admin account
node scripts/fix-admin-password.js      # Reset admin password
```

## WSL Environment — Running via PowerShell

This project runs inside **WSL2 on Windows**. MongoDB runs as a **Windows service** and is
only accessible from Windows `127.0.0.1:27017` — NOT from WSL's own localhost.

PowerShell is available from WSL at:
`/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe`

### Start the dev server in a new PowerShell window

```bash
cmd.exe /c start powershell.exe -NoExit -Command "cd 'E:\Work\Hendra\HBridge\nextjs-boilerplate\hearty-bridge'; npm run dev"
```

App will be available at `http://localhost:3000`.

### Query MongoDB from WSL

**Direct WSL `localhost:27017` does NOT work** — MongoDB refuses the connection from WSL's network.

The correct approach is to run Node.js scripts via Windows PowerShell, which uses the Windows
localhost where MongoDB is listening:

```bash
powershell.exe -Command "cd 'E:\Work\Hendra\HBridge\nextjs-boilerplate\hearty-bridge'; node scripts\check-users.js 2>&1"
```

For ad-hoc queries, write a temporary script in `scripts/` (to access project `node_modules/mongoose`),
then run it via PowerShell:

```bash
# Example: query all users by role
powershell.exe -Command "cd 'E:\Work\Hendra\HBridge\nextjs-boilerplate\hearty-bridge'; node -e \"
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/hearty-bridge').then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log(JSON.stringify(users, null, 2));
  mongoose.disconnect();
});
\" 2>&1"
```

**Important:** Always run Node.js DB scripts via `powershell.exe`, never from WSL's own node,
because WSL node cannot reach the Windows MongoDB instance.

### mongosh

`mongosh` is **not installed** on this machine. Only `mongod.exe` and `mongos.exe` exist at
`C:\Program Files\MongoDB\Server\7.0\bin\`. Use Node.js + mongoose scripts as described above
for all DB inspection tasks.

### Open MongoDB shell window (after installing mongosh)

```bash
cmd.exe /c start powershell.exe -NoExit -Command "mongosh mongodb://localhost:27017/hearty-bridge"
```

## Environment Variables Required

```
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN=7d
NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

## Key Conventions

- Models are in `models/` and exported via `models/index.ts`
- Always soft-delete with `isActive: false` — never hard delete users/children
- Children must be 18 years or younger (enforced in `Child.pre('save')`)
- File size limit for media: 100MB
- Document access levels: `parent-only`, `therapist-only`, `shared`
- Use `uuid` for generating unique IDs where MongoDB ObjectId is not appropriate

## Mock Data Fallback

If MongoDB is unavailable, `lib/middleware/mock-fallback.ts` activates automatically
and serves data from `data/*.json` files. The `/api/local/*` endpoints always use local data.

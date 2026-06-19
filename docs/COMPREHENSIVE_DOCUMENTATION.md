# HBridge - Hearty Bridge: Comprehensive Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture](#4-architecture)
5. [Authentication System](#5-authentication-system)
6. [Database Models & Schemas](#6-database-models--schemas)
7. [API Reference](#7-api-reference)
8. [Frontend Pages & Components](#8-frontend-pages--components)
9. [Google Services Integration](#9-google-services-integration)
10. [Internationalization (i18n)](#10-internationalization-i18n)
11. [Configuration & Environment Variables](#11-configuration--environment-variables)
12. [Utilities & Services](#12-utilities--services)
13. [Mock & Local Data Layer](#13-mock--local-data-layer)
14. [Scripts](#14-scripts)
15. [Development Guide](#15-development-guide)
16. [Role-Based Access Control](#16-role-based-access-control)
17. [Security Considerations](#17-security-considerations)
18. [Feature Breakdown by Module](#18-feature-breakdown-by-module)

---

## 1. Project Overview

**Hearty Bridge (HBridge)** is a web-based healthcare collaboration platform designed to bridge the gap between parents and therapists in managing children's therapeutic journeys. The platform supports child development monitoring, secure communication, document sharing, session scheduling, and family coordination.

### Core Purpose

- **Parents** can register their children, track their progress, communicate with assigned therapists, manage documents and media, and view schedules.
- **Therapists** can manage their patient roster, record session notes and progress, communicate with parents, schedule sessions via Google Calendar/Meet, and assign milestones.
- **Admins** have full platform oversight: user management, system statistics, activity logs, and therapist assignment control.

### Key Value Propositions

- Secure, role-aware communication channel between parents and medical professionals
- Centralized child health record management with access control
- Google ecosystem integration for scheduling, video, and file management
- Family tree support for extended caregiver collaboration
- Multilingual interface (Indonesian and English)

---

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.6 | Full-stack React framework (App Router) |
| React | 19.2.4 | UI rendering |
| TypeScript | 5.x | Static typing |
| Tailwind CSS | 4.x | Utility-first CSS |
| Lucide React | 1.14.0 | Icon library |
| React Hook Form | 7.75.0 | Form state management |
| Zod | 4.4.3 | Schema validation |
| next-intl | 4.13.0 | Internationalization |
| class-variance-authority | 0.7.1 | Component variant management |
| clsx + tailwind-merge | latest | Conditional class utilities |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Next.js API Routes | 16.2.6 | REST API server |
| MongoDB | via Mongoose | Primary database |
| Mongoose | 9.6.2 | ODM for MongoDB |
| jsonwebtoken | 9.0.3 | JWT authentication |
| bcryptjs | 3.0.3 | Password hashing |
| uuid | 10.0.0 | Unique ID generation |

### Google Services

| Library | Version | Purpose |
|---|---|---|
| google-auth-library | 9.14.1 | OAuth 2.0 authentication |
| googleapis | 134.0.0 | Google API client (Calendar, Drive, Meet) |
| @google-cloud/storage | 7.15.0 | Cloud Storage (GCS) |

### DevDependencies

| Tool | Purpose |
|---|---|
| ESLint 9 + eslint-config-next | Linting |
| PostCSS + @tailwindcss/postcss | CSS processing |
| TypeScript type definitions | Type support |

---

## 3. Project Structure

```
HBridge/
├── .claude/
│   ├── agents/                     # Claude AI agent configurations
│   │   ├── backend-specialist.md
│   │   ├── development-spec-architect.md
│   │   ├── development-spec-writer.md
│   │   ├── frontend-dev-specialist.md
│   │   ├── project-management-advisor.md
│   │   └── project-monitoring-agent.md
│   └── settings.local.json
│
├── docs/                           # Project documentation
│   ├── COMPREHENSIVE_DOCUMENTATION.md   # This file
│   ├── PROJECT_PLAN.md
│   ├── PHASE_1_DETAILED.md
│   ├── PHASE_1_COMPLETION_REPORT.md
│   ├── PHASE_2_COMPREHENSIVE_PROJECT_PLAN.md
│   ├── PHASE_2_COMPLETION_REPORT.md
│   ├── PROGRESS_TRACKER.md
│   ├── TESTING_GUIDE.md
│   ├── PRODUCTION_MONITORING_DASHBOARD.md
│   └── README.md
│
└── nextjs-boilerplate/
    └── hearty-bridge/              # Main application root
        ├── app/                    # Next.js App Router
        │   ├── api/                # Backend API routes
        │   │   ├── admin/          # Admin endpoints
        │   │   ├── auth/           # Authentication endpoints
        │   │   ├── children/       # Patient/child management
        │   │   ├── conversations/  # Messaging
        │   │   ├── demo-data/      # Demo endpoint
        │   │   ├── documents/      # Document management
        │   │   ├── families/       # Family tree management
        │   │   ├── google/         # Google services
        │   │   ├── health/         # Health check
        │   │   ├── local/          # Local data fallback
        │   │   ├── media/          # Media management
        │   │   ├── search/         # Search functionality
        │   │   └── therapists/     # Therapist management
        │   ├── auth/               # Auth pages (login, register)
        │   ├── dashboard/          # Protected dashboard pages
        │   ├── about/              # Public about page
        │   ├── contact/            # Public contact page
        │   ├── services/           # Public services page
        │   ├── layout.tsx          # Root layout
        │   ├── page.tsx            # Home/landing page
        │   └── globals.css         # Global styles
        │
        ├── components/             # Reusable React components
        │   ├── admin/              # Admin-specific components
        │   ├── auth/               # Auth guard components
        │   ├── child-profile/      # Child profile UI
        │   ├── documents/          # Document management UI
        │   ├── family-tree/        # Family tree visualization
        │   ├── layout/             # Layout components (header, sidebar, footer)
        │   ├── messaging/          # Chat and conversation UI
        │   ├── schedule/           # Schedule management UI
        │   ├── search/             # Search UI
        │   └── ui/                 # Base UI component library (shadcn-style)
        │
        ├── models/                 # Mongoose database schemas
        │   ├── User.ts
        │   ├── Child.ts
        │   ├── Family.ts
        │   ├── Session.ts
        │   ├── Conversation.ts
        │   ├── Message.ts
        │   ├── Document.ts
        │   ├── MediaFile.ts
        │   ├── Progress.ts
        │   ├── Milestone.ts
        │   ├── SearchIndex.ts
        │   └── index.ts
        │
        ├── lib/                    # Shared library code
        │   ├── config/
        │   │   └── google.ts       # Google service configuration
        │   ├── contexts/
        │   │   └── auth-context.tsx # React auth context & provider
        │   ├── data/
        │   │   └── mock-data.ts    # Static mock data
        │   ├── db/
        │   │   └── mongodb.ts      # MongoDB connection helper
        │   ├── hooks/
        │   │   └── useConversations.ts
        │   ├── middleware/
        │   │   ├── auth.ts         # Auth middleware (withAnyAuth, withAdminAuth)
        │   │   └── mock-fallback.ts
        │   ├── services/
        │   │   ├── google-auth.ts
        │   │   ├── google-calendar.ts
        │   │   ├── google-cloud-storage.ts
        │   │   ├── google-drive.ts
        │   │   ├── google-meet.ts
        │   │   ├── local-data-service.ts
        │   │   ├── mock-data-service.ts
        │   │   └── index.ts
        │   ├── types/
        │   │   ├── auth.ts
        │   │   ├── google.ts
        │   │   └── index.ts
        │   ├── utils/
        │   │   ├── api.ts
        │   │   ├── assignment-engine.ts
        │   │   ├── child.ts
        │   │   ├── error-handler.ts
        │   │   ├── jwt.ts
        │   │   └── permissions.ts
        │   ├── validation/
        │   │   ├── auth.ts
        │   │   ├── child.ts
        │   │   ├── document.ts
        │   │   ├── family.ts
        │   │   ├── media.ts
        │   │   ├── messaging.ts
        │   │   └── search.ts
        │   ├── index.ts
        │   └── utils.ts
        │
        ├── data/                   # JSON mock data files
        │   ├── children.json
        │   ├── therapists.json
        │   ├── users.json
        │   ├── reports.json
        │   └── schedules.json
        │
        ├── i18n/                   # Internationalization config
        ├── messages/               # Translation message files
        ├── public/                 # Static assets
        ├── scripts/                # Database & utility scripts
        │   ├── create-admin-user.js
        │   ├── fix-admin-password.js
        │   ├── populate-mongodb.js
        │   ├── populate-simple.js
        │   ├── seed-database.js
        │   ├── test-api.js
        │   └── test-therapist-data.js
        │
        ├── next.config.ts          # Next.js configuration
        ├── tsconfig.json           # TypeScript configuration
        ├── postcss.config.mjs      # PostCSS configuration
        ├── eslint.config.mjs       # ESLint configuration
        └── package.json
```

---

## 4. Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Public   │  │ Auth     │  │ Dashboard (Protected) │  │
│  │ Pages    │  │ Pages    │  │ Pages                │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│          React 19 + Next.js App Router                   │
│          Auth Context (localStorage JWT)                 │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / fetch
┌───────────────────────▼─────────────────────────────────┐
│                  Next.js API Routes                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │   Auth   │  │ Business │  │   Google Services     │  │
│  │Middleware│  │   Logic  │  │   APIs                │  │
│  └──────────┘  └──────────┘  └───────────────────────┘  │
│          Error Handler + Validation (Zod)                │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
┌─────────▼──────────┐    ┌──────────▼──────────────┐
│      MongoDB        │    │   Google Cloud Services  │
│  (Mongoose ODM)     │    │  Drive / Calendar /      │
│  12 Collections     │    │  Meet / Storage          │
└─────────────────────┘    └─────────────────────────┘
```

### Data Flow for Authentication

```
User submits login form
        │
        ▼
POST /api/auth/login
        │
        ▼
Validate input (Zod schema)
        │
        ▼
Find user in MongoDB by email
        │
        ▼
bcryptjs.compare(password, hash)
        │
        ▼
Generate JWT (jsonwebtoken)
        │
        ▼
Return { token, user } to client
        │
        ▼
Store token in localStorage
        │
        ▼
Auth context updates user state
        │
        ▼
Redirect to /dashboard
```

### API Request Flow

```
Incoming Request
        │
        ▼
withAnyAuth middleware
  - Extract Bearer token from Authorization header
  - Verify JWT signature
  - Attach user to request context
        │
        ▼
Route Handler
  - Validate request body (Zod)
  - Check role-based permissions
  - Execute business logic
  - Interact with MongoDB via Mongoose
        │
        ▼
withErrorHandling wrapper
  - Catch and format errors
  - Return consistent JSON response
```

---

## 5. Authentication System

### JWT Token Flow

- **Token Storage**: `localStorage` under the key `"token"`
- **Token Format**: Standard JWT with payload `{ userId, email, role }`
- **Token Expiry**: 7 days (configurable via `JWT_EXPIRES_IN`)
- **Token Transmission**: `Authorization: Bearer <token>` header

### Auth Context (`lib/contexts/auth-context.tsx`)

The `AuthProvider` wraps the entire app and exposes the following via `useAuth()`:

| Property/Method | Type | Description |
|---|---|---|
| `user` | `User \| null` | Currently authenticated user object |
| `isLoading` | `boolean` | Auth check in progress |
| `login(credentials)` | `async function` | Login and store token |
| `register(userData)` | `async function` | Register new user |
| `logout()` | `async function` | Clear token, redirect to login |
| `updateProfile(data)` | `async function` | Update user profile |

### Auth Middleware (`lib/middleware/auth.ts`)

Two middleware wrappers are available for API routes:

- **`withAnyAuth`**: Requires a valid JWT (any role)
- **`withAdminAuth`**: Requires a valid JWT with `role === 'admin'`

### Password Security

- Hashing algorithm: **bcryptjs** with 12 salt rounds
- Hashing occurs in the Mongoose `pre('save')` hook (only on new documents)
- Password is never returned in API responses (`toSafeObject()` removes it)
- Minimum password length: 8 characters

### User Roles

| Role | Access Level | Description |
|---|---|---|
| `admin` | Full system access | Platform management, user oversight |
| `therapist` | Patient + communication | Manage assigned patients, sessions |
| `parent` | Own children + communication | View child profiles, communicate with therapist |

---

## 6. Database Models & Schemas

### Connection (`lib/db/mongodb.ts`)

Uses a singleton pattern to maintain a single MongoDB connection across Next.js API route invocations. Connects using `MONGODB_URI` environment variable.

---

### User Model (`models/User.ts`)

**Collection**: `users`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `name` | String | required, 2–100 chars | Full name |
| `email` | String | required, unique, lowercase | Email address |
| `password` | String | required, min 8 chars, hashed | Password (bcrypt) |
| `role` | Enum | required: admin/therapist/parent | User role |
| `phone` | String | optional | Contact phone number |
| `avatar` | String | optional | Avatar image URL |
| `profile.specialization` | String[] | optional | Therapist specializations |
| `profile.clinic` | String | optional, max 200 chars | Clinic/hospital name |
| `profile.experience` | Number | optional, 0–50 | Years of experience |
| `profile.address` | String | optional | Address |
| `profile.emergencyContact` | Object | optional | Emergency contact (name, phone, relation) |
| `permissions` | String[] | optional | Custom permissions |
| `emailVerified` | Boolean | default: false | Email verification status |
| `lastLogin` | Date | optional | Timestamp of last login |
| `isActive` | Boolean | default: true | Soft delete flag |
| `createdAt` | Date | auto | Mongoose timestamp |
| `updatedAt` | Date | auto | Mongoose timestamp |

**Indexes**: `email` (unique), `role`, `isActive`, `createdAt`

**Instance Methods**: `comparePassword(password)`, `toSafeObject()`

**Static Methods**: `findByEmail(email)`, `findActiveUsers(role?)`

---

### Child Model (`models/Child.ts`)

**Collection**: `children`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `name` | String | required, 2–100 chars | Child's full name |
| `dateOfBirth` | Date | required, valid date | Date of birth |
| `gender` | Enum | required: male/female | Gender |
| `parentId` | ObjectId (ref: User) | required | Parent user reference |
| `therapistId` | ObjectId (ref: User) | optional | Assigned therapist reference |
| `medicalInfo.conditions` | String[] | optional, max 200/item | Medical conditions |
| `medicalInfo.medications` | String[] | optional, max 200/item | Current medications |
| `medicalInfo.allergies` | String[] | optional, max 200/item | Known allergies |
| `medicalInfo.notes` | String | optional, max 2000 chars | Medical notes |
| `contactInfo.emergencyContact` | Object | optional | Emergency contact (name, phone, relationship) |
| `isActive` | Boolean | default: true | Soft delete flag |

**Constraints**: Child must be 18 years or younger (validated in `pre('save')`)

**Virtual**: `age` - computed from `dateOfBirth`

**Indexes**: `parentId`, `therapistId`, `isActive`, `createdAt`

**Static Methods**: `findByParent(parentId)`, `findByTherapist(therapistId)`, `findActiveChildren()`

---

### Family Model (`models/Family.ts`)

**Collection**: `families`

| Field | Type | Description |
|---|---|---|
| `familyName` | String | Family/household name |
| `primaryParents` | ObjectId[] (ref: User) | Primary parent accounts |
| `children` | ObjectId[] (ref: Child) | Children in this family |
| `extendedMembers` | FamilyMember[] | Extended family members |
| `familyTree` | FamilyTreeNode[] | Visual tree structure |
| `settings.visibility` | Enum | private/therapist-visible/public |
| `settings.allowMemberInvites` | Boolean | Can members invite others? |
| `settings.requireApproval` | Boolean | Require admin approval? |
| `settings.sharePhotos` | Boolean | Share photos with members? |
| `settings.shareDocuments` | Boolean | Share documents with members? |

**Extended Member Roles**: `caregiver`, `emergency-contact`, `family`, `support`

**Instance Methods**: `addMember()`, `removeMember()`, `updateMemberPermissions()`, `canUserAccess()`

**Static Methods**: `findByPrimaryParent()`, `findByMember()`, `findByChild()`

---

### Session Model (`models/Session.ts`)

**Collection**: `sessions`

| Field | Type | Description |
|---|---|---|
| `childId` | ObjectId (ref: Child) | Patient reference |
| `therapistId` | ObjectId (ref: User) | Therapist reference |
| `date` | Date | Session date |
| `time` | String | Session time |
| `duration` | Number | Duration in minutes |
| `type` | Enum | in-person/video/phone |
| `status` | Enum | completed/scheduled/cancelled/no-show |
| `rating` | Number | Session quality rating |
| `notes` | String | Therapist session notes |
| `goals` | String[] | Session goals |
| `nextSteps` | String | Follow-up actions |
| `location` | String | Physical location (if in-person) |
| `meetingUrl` | String | Video meeting link |

**Static Methods**: `findByChild()`, `findByTherapist()`, `findUpcomingSessions()`, `findCompletedSessions()`

---

### Conversation Model (`models/Conversation.ts`)

**Collection**: `conversations`

| Field | Type | Description |
|---|---|---|
| `participants` | ConversationParticipant[] | Users in this conversation |
| `childId` | ObjectId (ref: Child) | Related child (optional) |
| `type` | Enum | direct/group/support |
| `title` | String | Conversation title |
| `lastMessage` | Object | Last message preview |
| `settings.allowFileSharing` | Boolean | Allow file attachments |
| `settings.allowVideoCall` | Boolean | Allow video calls |
| `settings.messageRetention` | Number | Days to retain messages |
| `settings.notifications` | Boolean | Notifications enabled |

**Participant Fields**: `userId`, `role` (admin/therapist/parent), `joinedAt`, `lastReadAt`, `unreadCount`, `isActive`

**Instance Methods**: `addParticipant()`, `removeParticipant()`, `updateLastActivity()`, `markAsRead()`, `incrementUnreadCount()`

**Static Methods**: `findByUser()`, `findByChild()`, `findDirectConversation()`, `findActiveConversations()`

---

### Message Model (`models/Message.ts`)

**Collection**: `messages`

| Field | Type | Description |
|---|---|---|
| `conversationId` | ObjectId (ref: Conversation) | Parent conversation |
| `senderId` | ObjectId (ref: User) | Sender reference |
| `content` | String | Message text content |
| `messageType` | Enum | text/image/video/audio/document/system |
| `attachments` | Attachment[] | File attachments |
| `reactions` | MessageReaction[] | Emoji reactions |
| `readStatus` | MessageReadStatus[] | Per-user read tracking |
| `replyTo` | ObjectId (ref: Message) | Threaded reply reference |
| `editHistory` | String[] | Previous message versions |
| `isEdited` | Boolean | Has been edited |
| `isDeleted` | Boolean | Soft delete flag |

**Reaction Fields**: `userId`, `emoji`, `createdAt`

**Read Status Fields**: `userId`, `readAt`

**Instance Methods**: `addReaction()`, `removeReaction()`, `markAsRead()`, `isReadByUser()`, `getReadCount()`

**Static Methods**: `findByConversation()`, `findBySender()`, `findUnreadMessages()`, `searchMessages()`, `getConversationStats()`

---

### Document Model (`models/Document.ts`)

**Collection**: `documents`

| Field | Type | Description |
|---|---|---|
| `title` | String | Document display name |
| `type` | Enum | medical/educational/legal/other |
| `fileUrl` | String | File storage URL |
| `fileName` | String | Original filename |
| `fileSize` | Number | Size in bytes |
| `mimeType` | String | MIME type |
| `childId` | ObjectId (ref: Child) | Related child |
| `uploadedBy` | ObjectId (ref: User) | Uploader reference |
| `expiryDate` | Date | Document expiry (optional) |
| `isConfidential` | Boolean | Confidentiality flag |
| `accessLevel` | Enum | parent-only/therapist-only/shared |
| `tags` | String[] | Searchable tags |
| `checksum` | String | File integrity checksum |
| `encryptionStatus` | Boolean | Encryption flag |
| `ocrText` | String | Extracted text via OCR |
| `version` | Number | Document version number |

**Instance Methods**: `isExpiring()`, `getDaysUntilExpiry()`

**Static Methods**: `findByChild()`, `findByUploader()`, `findExpiringDocuments()`, `findByAccessLevel()`

---

### MediaFile Model (`models/MediaFile.ts`)

**Collection**: `media`

| Field | Type | Description |
|---|---|---|
| `fileName` | String | Stored filename |
| `originalName` | String | Original upload filename |
| `mimeType` | String | MIME type |
| `size` | Number | File size (max 100MB) |
| `url` | String | Access URL |
| `thumbnail` | String | Thumbnail URL |
| `type` | Enum | photo/video/audio |
| `childId` | ObjectId (ref: Child) | Related child |
| `uploadedBy` | ObjectId (ref: User) | Uploader reference |
| `metadata.width` | Number | Image width (px) |
| `metadata.height` | Number | Image height (px) |
| `metadata.duration` | Number | Video/audio duration (sec) |
| `metadata.location` | Object | GPS coordinates |
| `tags` | String[] | Tags for organization |
| `description` | String | Caption/description |
| `isPublic` | Boolean | Shared with all participants |

**Static Methods**: `findByChild()`, `findByUploader()`, `findPublicMedia()`

---

### Progress Model (`models/Progress.ts`)

Tracks developmental progress scores over time, linked to a `Session` and `Child`.

---

### Milestone Model (`models/Milestone.ts`)

Tracks specific developmental milestones achieved by a child, with date of achievement and therapist notes.

---

### SearchIndex Model (`models/SearchIndex.ts`)

Stores full-text search index entries for documents and media, enabling efficient global search across the platform.

---

## 7. API Reference

All endpoints return JSON in this format:
```json
{
  "success": true | false,
  "data": { ... } | [...],
  "message": "Human-readable message",
  "error": "Error message if applicable",
  "details": [ { "field": "...", "message": "..." } ]
}
```

### Authentication Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register a new user |
| `POST` | `/api/auth/login` | None | Login and receive JWT |
| `GET` | `/api/auth/me` | Any | Get current user profile |
| `PUT` | `/api/auth/me` | Any | Update current user profile |
| `POST` | `/api/auth/logout` | Any | Logout (invalidate session) |

**Register request body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "role": "parent | therapist",
  "phone": "string (optional)",
  "acceptTerms": true,
  "specialization": ["string"] (therapist only),
  "clinic": "string (therapist only)",
  "experience": 0 (therapist only)
}
```

**Login request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

---

### Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Server health check |

---

### Therapist Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/therapists` | Any | List all active therapists |
| `POST` | `/api/therapists` | Admin | Create a new therapist |

---

### Children / Patient Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/children` | Any | List children (filtered by role) |
| `POST` | `/api/children` | Parent/Admin | Create a new child profile |
| `GET` | `/api/children/[id]` | Any | Get individual child details |
| `PUT` | `/api/children/[id]` | Parent/Admin | Update child profile |
| `DELETE` | `/api/children/[id]` | Admin | Deactivate child |
| `POST` | `/api/children/[id]/assign-therapist` | Admin | Assign therapist to child |
| `GET` | `/api/children/[id]/progress` | Any | Get child progress records |
| `GET` | `/api/children/[id]/reports` | Any | Get child reports |
| `GET` | `/api/children/[id]/sessions` | Any | Get child session history |

---

### Conversation & Messaging Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/conversations` | Any | List user's conversations |
| `POST` | `/api/conversations` | Any | Create new conversation |
| `GET` | `/api/conversations/[id]` | Any | Get conversation details |
| `PUT` | `/api/conversations/[id]` | Any | Update conversation settings |
| `DELETE` | `/api/conversations/[id]` | Any | Archive conversation |
| `POST` | `/api/conversations/[id]/read` | Any | Mark conversation as read |
| `GET` | `/api/conversations/[id]/messages` | Any | List messages in conversation |
| `POST` | `/api/conversations/[id]/messages` | Any | Send a message |
| `GET` | `/api/conversations/[id]/messages/[messageId]` | Any | Get message details |
| `PUT` | `/api/conversations/[id]/messages/[messageId]` | Any | Edit a message |
| `DELETE` | `/api/conversations/[id]/messages/[messageId]` | Any | Delete a message |
| `POST` | `/api/conversations/[id]/messages/[messageId]/reactions` | Any | Add/remove reaction |

---

### Document Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/documents` | Any | List accessible documents |
| `POST` | `/api/documents` | Any | Upload a document |
| `GET` | `/api/documents/[id]` | Any | Get document metadata |
| `DELETE` | `/api/documents/[id]` | Any | Delete document |
| `GET` | `/api/documents/expiring` | Any | Get soon-to-expire documents |
| `GET` | `/api/documents/search` | Any | Search documents by title/tag |

---

### Media Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/media` | Any | List media files |
| `POST` | `/api/media` | Any | Upload media file |
| `GET` | `/api/media/[id]` | Any | Get media file details |
| `DELETE` | `/api/media/[id]` | Any | Delete media file |
| `POST` | `/api/media/bulk` | Any | Bulk media operations |
| `GET` | `/api/media/search` | Any | Search media by tag/type |

---

### Family Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/families` | Any | List user's families |
| `POST` | `/api/families` | Parent/Admin | Create family group |
| `GET` | `/api/families/[id]` | Any | Get family details |
| `PUT` | `/api/families/[id]` | Any | Update family settings |
| `DELETE` | `/api/families/[id]` | Admin | Deactivate family |
| `GET` | `/api/families/[id]/members` | Any | List family members |
| `POST` | `/api/families/[id]/members` | Any | Add family member |
| `GET` | `/api/families/[id]/members/[memberId]` | Any | Get member details |
| `PUT` | `/api/families/[id]/members/[memberId]` | Any | Update member permissions |
| `DELETE` | `/api/families/[id]/members/[memberId]` | Any | Remove family member |
| `GET` | `/api/families/[id]/tree` | Any | Get family tree structure |

---

### Search Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/search` | Any | Global search across all entities |
| `GET` | `/api/search/advanced` | Any | Advanced search with filters |
| `GET` | `/api/search/suggestions` | Any | Autocomplete suggestions |
| `POST` | `/api/search/index` | Admin | Re-index documents for search |

---

### Admin Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Platform statistics |
| `GET` | `/api/admin/activity` | Admin | Recent activity log |

---

### Google Integration Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/google/auth` | Any | Start Google OAuth flow |
| `GET` | `/api/google/auth/callback` | None | Handle OAuth callback |
| `GET` | `/api/google/calendar` | Any | List/manage calendar events |
| `POST` | `/api/google/calendar` | Any | Create calendar event |
| `GET` | `/api/google/drive` | Any | List Drive files |
| `POST` | `/api/google/drive` | Any | Upload to Drive |
| `GET` | `/api/google/drive/folders` | Any | List Drive folders |
| `GET` | `/api/google/meet` | Any | Get Meet room info |
| `POST` | `/api/google/meet` | Any | Create Meet room |
| `GET` | `/api/google/storage` | Any | List GCS files |
| `POST` | `/api/google/storage` | Any | Upload to GCS |
| `POST` | `/api/google/storage/signed-url` | Any | Generate signed download URL |

---

### Local Data Fallback Endpoints

These endpoints serve from JSON files when MongoDB is unavailable:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/local/children` | Local children data |
| `GET` | `/api/local/therapists` | Local therapist data |
| `GET` | `/api/local/schedules` | Local schedule data |
| `GET` | `/api/local/reports` | Local reports data |

---

## 8. Frontend Pages & Components

### Public Pages

| Route | Component | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page with hero, features, CTA |
| `/about` | `app/about/page.tsx` | About Hearty Bridge |
| `/services` | `app/services/page.tsx` | Services offered |
| `/contact` | `app/contact/page.tsx` | Contact information |

The home page (`/`) is i18n-enabled and uses translation keys from `messages/`. It includes:
- **Hero Section**: Gradient banner with CTA buttons
- **Features Section**: Three feature cards (Trusted, Network, Care)
- **How It Works Section**: Step-by-step guides for parents and therapists
- **CTA Section**: Registration/login call-to-action

### Auth Pages

| Route | Component | Description |
|---|---|---|
| `/auth/login` | `app/auth/login/page.tsx` | Login form |
| `/auth/register` | `app/auth/register/page.tsx` | Registration form (role-aware) |

The register form dynamically shows therapist-specific fields (`specialization`, `clinic`, `experience`) when the therapist role is selected.

### Dashboard Pages (Protected)

All dashboard routes are wrapped in `DashboardLayout` which enforces authentication.

| Route | Component | Description |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Role-specific dashboard overview |
| `/dashboard/patients` | `app/dashboard/patients/page.tsx` | Patient list and management |
| `/dashboard/therapists` | `app/dashboard/therapists/page.tsx` | Therapist list (admin view) |
| `/dashboard/schedules` | `app/dashboard/schedules/page.tsx` | Session scheduling |
| `/dashboard/messages` | `app/dashboard/messages/page.tsx` | Messaging interface |
| `/dashboard/reports` | `app/dashboard/reports/page.tsx` | Progress reports |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | User profile settings |

### Component Library

#### UI Base Components (`components/ui/`)

| Component | Description |
|---|---|
| `button.tsx` | Button with variant support (default, outline, ghost, link) |
| `card.tsx` | Card container with CardHeader, CardContent, CardTitle, CardDescription |
| `input.tsx` | Styled text input |
| `select.tsx` | Dropdown select |
| `dialog.tsx` | Modal dialog |
| `tabs.tsx` | Tab navigation |
| `badge.tsx` | Status/label badge |
| `avatar.tsx` | User avatar with fallback initials |
| `toast.tsx` | Toast notification |
| `loading.tsx` | Loading spinner |
| `error.tsx` | Error display component |
| `index.ts` | Re-exports all UI components |

#### Layout Components (`components/layout/`)

| Component | Description |
|---|---|
| `header.tsx` | Top navigation bar with user info and logout |
| `footer.tsx` | Application footer |
| `dashboard-sidebar.tsx` | Collapsible sidebar with role-based navigation |
| `dashboard-layout.tsx` | Full dashboard layout wrapper |

#### Auth Components (`components/auth/`)

| Component | Description |
|---|---|
| `auth-guard.tsx` | HOC to protect routes (requires auth or blocks auth) |
| `protected-route.tsx` | Role-specific route protection |

#### Feature Components

**Child Profile** (`components/child-profile/`):
- `child-profile-layout.tsx` - Full child profile view with tabs
- `media-gallery.tsx` - Photo/video gallery for child
- `milestone-tracker.tsx` - Developmental milestone visualization

**Documents** (`components/documents/`):
- `document-library.tsx` - Document list with search and filter
- `document-upload-dialog.tsx` - Upload form with metadata fields

**Family** (`components/family-tree/`):
- `family-tree-visualization.tsx` - Visual family tree with node connections

**Messaging** (`components/messaging/`):
- `conversation-list.tsx` - Sidebar list of conversations
- `chat-window.tsx` - Full chat interface with message input

**Schedule** (`components/schedule/`):
- `weekly-schedule-table.tsx` - Weekly calendar grid view
- `patient-assignment-modal.tsx` - Assign patient to session slot

**Admin** (`components/admin/`):
- `therapist-assignment-modal.tsx` - Admin tool to assign therapists to patients

**Search** (`components/search/`):
- `global-search-bar.tsx` - Top-bar search input with suggestions
- `search-results.tsx` - Search results display with category filtering

---

## 9. Google Services Integration

### Configuration (`lib/config/google.ts`)

Reads from environment variables and creates configured service clients.

Required environment variables:
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_CLOUD_PROJECT_ID
GOOGLE_CLOUD_STORAGE_BUCKET
GOOGLE_APPLICATION_CREDENTIALS  (path to service account JSON)
GOOGLE_SCOPES                   (comma-separated OAuth scopes)
GOOGLE_MEET_DOMAIN
```

### OAuth 2.0 Flow (`lib/services/google-auth.ts`)

1. User initiates login via `GET /api/google/auth`
2. Server generates authorization URL with scopes: Drive, Calendar, UserInfo, Email
3. User completes Google login, redirected to `/auth/google/callback`
4. Next.js rewrite maps this to `GET /api/google/auth/callback`
5. Server exchanges authorization code for access/refresh tokens
6. Tokens stored and associated with user session

**Methods:**
- `generateAuthUrl()` - Builds Google OAuth URL
- `getTokenFromCode(code)` - Exchanges code for tokens
- `getUserInfo(accessToken)` - Fetches Google profile
- `refreshAccessToken(refreshToken)` - Renews expired token
- `validateToken(token)` - Checks token validity
- `revokeToken(token)` - Revokes token on logout

### Google Drive (`lib/services/google-drive.ts`)

- Upload files from the platform to a user's Drive
- List files and folders
- Search for files by name or content
- Manage file permissions

### Google Calendar (`lib/services/google-calendar.ts`)

- Create therapy session events
- List upcoming appointments
- Check therapist availability
- Send calendar invites to participants

### Google Cloud Storage (`lib/services/google-cloud-storage.ts`)

- Upload documents and media files to GCS bucket
- Generate signed URLs for time-limited secure file access
- List and manage bucket contents

### Google Meet (`lib/services/google-meet.ts`)

- Generate Google Meet room URLs for video sessions
- Associate meeting URLs with Session records
- Room URLs are stored in `Session.meetingUrl`

### Next.js Configuration for Google

```typescript
// next.config.ts
images: {
  remotePatterns: [
    { hostname: 'lh3.googleusercontent.com' },  // Google profile photos
    { hostname: 'storage.googleapis.com' },       // GCS files
    { hostname: 'drive.google.com' },             // Drive files
  ]
}

headers: [
  // CORS headers for /api/google/* routes
  { key: 'Access-Control-Allow-Origin', value: NEXTAUTH_URL },
  { key: 'Access-Control-Allow-Headers', value: 'X-Google-Access-Token, ...' }
]

rewrites: [
  // Maps /auth/google/callback to API route
  { source: '/auth/google/callback', destination: '/api/google/auth/callback' }
]
```

---

## 10. Internationalization (i18n)

The application uses **next-intl** for internationalization.

### Configuration

- Config file: `i18n/request.ts`
- Translation files: `messages/` directory
- Plugin: `createNextIntlPlugin` in `next.config.ts`

### Language Support

- **Indonesian (id)** - Primary language
- **English (en)** - Secondary language

### Usage in Components

```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('home');
// Access: t('hero.title'), t('features.trusted.description'), etc.
```

### Translation Keys Structure (Home Page Example)

```
home.hero.title
home.hero.titleHighlight
home.hero.titleEnd
home.hero.subtitle
home.hero.cta
home.hero.learnMore
home.features.title
home.features.subtitle
home.features.trusted.title
home.features.trusted.description
home.features.network.title
home.features.network.description
home.features.care.title
home.features.care.description
home.howItWorks.title
home.howItWorks.forParents.title
home.howItWorks.forParents.step1 ... step5
home.howItWorks.forTherapists.title
home.howItWorks.forTherapists.step1 ... step5
home.cta.title
home.cta.subtitle
home.cta.createAccount
home.cta.signIn
```

---

## 11. Configuration & Environment Variables

### `.env.local` (required)

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/hearty-bridge
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hearty-bridge

# JWT Authentication
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Next.js
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_SCOPES=https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/calendar

# Google Meet
GOOGLE_MEET_DOMAIN=meet.google.com

# Optional: Medical Data Encryption
MEDICAL_DATA_ENCRYPTION_KEY=your-encryption-key

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Logging
LOG_LEVEL=info
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

The `@/*` path alias maps to the project root, so `@/components/ui/button` resolves to `nextjs-boilerplate/hearty-bridge/components/ui/button`.

---

## 12. Utilities & Services

### Error Handler (`lib/utils/error-handler.ts`)

Provides consistent error response formatting across all API routes.

**`ErrorCodes` enum** includes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`, etc.

**`ErrorResponse` class** - static factory methods:
```typescript
ErrorResponse.badRequest(message, details?)
ErrorResponse.unauthorized(message?)
ErrorResponse.forbidden(message?)
ErrorResponse.notFound(resource?)
ErrorResponse.conflict(message?)
ErrorResponse.methodNotAllowed(method, allowed[])
ErrorResponse.internal(message?)
```

**`SuccessResponse` class** - static factory methods:
```typescript
SuccessResponse.ok(data, message?)
SuccessResponse.created(data, message?)
SuccessResponse.noContent()
```

**`withErrorHandling(handler)`** - wraps API route handlers to catch unhandled exceptions and return proper error responses.

### JWT Utilities (`lib/utils/jwt.ts`)

- `generateToken(payload)` - Creates signed JWT
- `verifyToken(token)` - Verifies and decodes JWT
- Cookie management helpers for HTTP-only auth cookies

### Permissions (`lib/utils/permissions.ts`)

Implements the role-based permission system.

```typescript
// Role permission matrix
const permissions = {
  admin: ['read:all', 'write:all', 'delete:all', 'manage:users', ...],
  therapist: ['read:patients', 'write:sessions', 'read:documents', ...],
  parent: ['read:children', 'write:children', 'read:sessions', ...]
}

// usePermissions hook
const { can, role } = usePermissions();
can('read:patients') // returns boolean
```

### Assignment Engine (`lib/utils/assignment-engine.ts`)

Logic for matching therapists to patients based on:
- Therapist specialization vs. child's medical conditions
- Therapist current patient load vs. `maxPatients`
- Availability schedule
- Geographic proximity (if applicable)

### Child Utilities (`lib/utils/child.ts`)

- Data formatting helpers
- Access control verification for child records
- Search and sort query builder
- Pagination calculation
- Activity logging

### Zod Validation Schemas (`lib/validation/`)

| File | Schemas |
|---|---|
| `auth.ts` | `loginSchema`, `registerSchema` (with therapist conditional) |
| `child.ts` | `createChildSchema`, `updateChildSchema` |
| `document.ts` | `uploadDocumentSchema`, `searchDocumentSchema` |
| `family.ts` | `createFamilySchema`, `addMemberSchema` |
| `media.ts` | `uploadMediaSchema` (max 100MB) |
| `messaging.ts` | `createConversationSchema`, `sendMessageSchema` |
| `search.ts` | `searchQuerySchema`, `advancedSearchSchema` |

---

## 13. Mock & Local Data Layer

The application includes two fallback data systems for development/testing without a live database:

### Mock Data Service (`lib/services/mock-data-service.ts`)

An in-memory service that simulates full CRUD operations using the JSON files in `/data/`. Used by `lib/middleware/mock-fallback.ts` when MongoDB is unavailable.

### Local Data Service (`lib/services/local-data-service.ts`)

Reads directly from JSON files on disk. Serves the `/api/local/*` endpoints for simple local data access.

### Mock Data Files (`data/`)

**`therapists.json`** (4 entries):
```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  "phone": "...",
  "specializations": ["..."],
  "status": "active",
  "assignedPatients": 0,
  "maxPatients": 10,
  "rating": 4.5,
  "totalSessions": 0,
  "availability": ["..."],
  "credentials": ["..."]
}
```

**`children.json`** (5 entries):
```json
{
  "id": "...",
  "name": "...",
  "dateOfBirth": "...",
  "diagnosis": "...",
  "assignedTherapist": "...",
  "parentId": "...",
  "progressScore": 0,
  "sessions": 0
}
```

**`users.json`**: Sample user accounts across all roles

**`reports.json`**: Sample report templates

**`schedules.json`**: Sample session schedules

---

## 14. Scripts

All scripts are in `nextjs-boilerplate/hearty-bridge/scripts/` and run with Node.js.

### `create-admin-user.js`

Creates the initial admin user account in MongoDB. Run once during initial setup.

```bash
node scripts/create-admin-user.js
```

### `fix-admin-password.js`

Resets the admin user's password if locked out.

```bash
node scripts/fix-admin-password.js
```

### `seed-database.js`

Comprehensive database seeding script (~14KB). Populates:
- Multiple user accounts (admin, therapists, parents)
- Child profiles linked to parents
- Session records
- Sample documents and media references

```bash
node scripts/seed-database.js
```

### `populate-mongodb.js`

Alternative seeding script (~13KB) with slightly different data set.

```bash
node scripts/populate-mongodb.js
```

### `populate-simple.js`

Minimal population script for quick setup.

```bash
node scripts/populate-simple.js
```

### `test-api.js`

Runs automated API endpoint tests. Tests authentication, CRUD operations, and error cases.

```bash
node scripts/test-api.js
```

### `test-therapist-data.js`

Specifically tests therapist-related API endpoints and data integrity.

```bash
node scripts/test-therapist-data.js
```

---

## 15. Development Guide

### Prerequisites

- Node.js 18+
- MongoDB (local instance or Atlas connection string)
- Google Cloud project (optional, for Google services)

### Setup

```bash
# 1. Clone and navigate to app directory
cd nextjs-boilerplate/hearty-bridge

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your values

# 4. Seed the database (optional)
node scripts/seed-database.js

# 5. Start development server
npm run dev
```

The app runs on `http://localhost:3000` by default.

### Available npm Scripts

```bash
npm run dev     # Start Next.js development server with hot reload
npm run build   # Build production bundle
npm run start   # Start production server
npm run lint    # Run ESLint
```

### Development Without MongoDB

If `MONGODB_URI` is not set or connection fails, the `mock-fallback.ts` middleware activates automatically, serving mock data from the JSON files. The `/api/local/*` endpoints always use local data regardless.

### Adding a New API Route

1. Create file at `app/api/[route]/route.ts`
2. Import and use `withErrorHandling` and `withAnyAuth` from lib
3. Add Zod validation for request body
4. Use Mongoose models for database operations
5. Return `SuccessResponse` or `ErrorResponse`

Example pattern:
```typescript
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/utils/error-handler';
import { SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(
  withAnyAuth(async (req: NextRequest, { user }) => {
    // business logic
    return NextResponse.json(SuccessResponse.ok(data));
  })
);
```

### Adding a New Page

1. Create `app/[route]/page.tsx`
2. For protected pages, wrap with `AuthGuard` and place under `app/dashboard/`
3. Use the `DashboardLayout` component or create a new layout.tsx
4. Fetch data via the API routes using the auth token from `useAuth()`

---

## 16. Role-Based Access Control

### Permission Matrix

| Action | Admin | Therapist | Parent |
|---|---|---|---|
| View all users | Yes | No | No |
| Manage users | Yes | No | No |
| View platform stats | Yes | No | No |
| Create child profile | Yes | No | Yes (own) |
| View child profile | Yes | Yes (assigned) | Yes (own) |
| Update child profile | Yes | No | Yes (own) |
| Delete child | Yes | No | No |
| Assign therapist | Yes | No | No |
| View all sessions | Yes | Yes (own) | Yes (own children) |
| Create/update sessions | Yes | Yes (own) | No |
| Send messages | Yes | Yes | Yes |
| Upload documents | Yes | Yes | Yes |
| View documents | Yes | Yes (shared/therapist) | Yes (shared/parent) |
| View media | Yes | Yes (linked patients) | Yes (own children) |
| Manage families | Yes | No | Yes (own) |
| Google services | Yes | Yes | Yes |
| Search | Yes | Yes (scoped) | Yes (scoped) |

### Dashboard Navigation by Role

**Admin sidebar**:
- Dashboard (overview stats)
- Patients (all patients)
- Therapists (manage all)
- Schedules (all schedules)
- Messages
- Reports
- Settings

**Therapist sidebar**:
- Dashboard (my patients count, upcoming sessions)
- Patients (my assigned patients)
- Schedules (my sessions)
- Messages
- Reports
- Settings

**Parent sidebar**:
- Dashboard (my children's overview)
- Patients (my children)
- Schedules (my children's sessions)
- Messages
- Reports
- Settings

---

## 17. Security Considerations

### Authentication Security
- JWTs are signed with `JWT_SECRET` (minimum 32-character secret recommended)
- Passwords hashed with bcryptjs (12 salt rounds - computationally expensive)
- Token stored in `localStorage` (XSS risk - consider HTTP-only cookies for production)
- Auth middleware validates token on every protected API call

### Data Access Control
- All API routes check user role before returning data
- Parents can only access their own children's records
- Therapists can only access their assigned patients
- Admin has full access

### Input Validation
- All API inputs validated with Zod schemas before processing
- Mongoose schema-level validation as a second layer
- String length limits enforced at schema level

### File Security
- Documents have `accessLevel` (parent-only/therapist-only/shared)
- Confidential flag for sensitive documents
- GCS signed URLs for time-limited file access (no permanent public links)
- File size limit enforced (max 100MB for media)

### CORS & Headers
- CORS headers configured for Google API routes
- `X-Google-Access-Token` header support for Google service calls

### Known Security Considerations for Production
- Move JWT token from `localStorage` to HTTP-only cookies to prevent XSS token theft
- Implement CSRF protection if switching to cookie-based auth
- Add rate limiting to auth endpoints to prevent brute force
- Enable MongoDB field-level encryption for sensitive medical data (`MEDICAL_DATA_ENCRYPTION_KEY`)
- Audit log all access to child medical records

---

## 18. Feature Breakdown by Module

### Module 1: User Management
- User registration with role selection
- Email/password authentication with JWT
- Profile management (name, phone, avatar, specialization for therapists)
- Account activation/deactivation
- Last login tracking

### Module 2: Patient (Child) Management
- Create child profiles with medical information
- Link children to parent accounts
- Assign therapist to child (admin only)
- View child's complete history (sessions, progress, documents, media)
- Soft delete (isActive flag)
- Age validation (max 18 years)

### Module 3: Session Management
- Schedule therapy sessions (in-person, video, phone)
- Session status lifecycle: scheduled → completed / cancelled / no-show
- Session notes, goals, and next steps
- Session ratings
- Video meeting URL via Google Meet
- Calendar event creation via Google Calendar

### Module 4: Messaging System
- Direct messages between therapist and parent
- Group conversations
- Support conversations with admin
- Message types: text, images, video, audio, documents, system messages
- Emoji reactions
- Message threading (replies)
- Message editing with history
- Read receipts and unread counts
- Message search

### Module 5: Document Management
- Upload documents (medical, educational, legal, other)
- Access level control (parent-only, therapist-only, shared)
- Document expiry tracking and alerts
- Confidentiality flagging
- Document versioning
- OCR text extraction metadata
- Encryption status tracking
- Tag-based organization
- Search by title and tags

### Module 6: Media Gallery
- Upload photos, videos, and audio files
- File size validation (max 100MB)
- Metadata: dimensions, duration, GPS location
- Thumbnail generation references
- Tag-based organization
- Public/private sharing control
- Gallery view per child

### Module 7: Family Tree
- Create family groups
- Add extended family members with roles
- Visual tree representation
- Per-member permission management
- Visibility settings (private/therapist-visible/public)
- Member invitation workflow
- Approval-based access control

### Module 8: Progress & Milestones
- Record progress scores per session
- Track developmental milestones with dates
- Therapist notes on milestones
- Progress history visualization
- Report generation from progress data

### Module 9: Search
- Global full-text search across children, documents, media
- Advanced filtering by type, date range, access level
- Autocomplete suggestions
- Search index management (admin)
- Role-scoped results (users only see what they have access to)

### Module 10: Google Services
- Google OAuth for single sign-on (optional)
- Google Drive: upload/download case documents
- Google Calendar: schedule sessions with calendar invites
- Google Meet: automatic video room generation for video sessions
- Google Cloud Storage: scalable file storage backend
- Signed URLs for secure temporary file access

### Module 11: Admin Dashboard
- Platform statistics (total users, children, sessions)
- Recent activity log
- User management (activate/deactivate)
- Therapist assignment management
- System health monitoring

### Module 12: Internationalization
- Indonesian language (primary)
- English language (secondary)
- Translation keys for all user-facing strings on public pages
- Locale-aware routing via next-intl

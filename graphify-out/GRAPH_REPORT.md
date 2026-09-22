# Graph Report - HBridge  (2026-09-22)

## Corpus Check
- 299 files · ~235,788 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .toml 1, .css 1)

## Summary
- 1648 nodes · 3926 edges · 127 communities (105 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `830aa72c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- patients/page.tsx
- mongoose
- api/children/route.ts
- cn
- .badRequest
- search.ts
- badge.tsx
- media/route.ts
- schedules/page.tsx
- connectToDatabase
- reports/page.tsx
- react
- .forbidden
- models/index.ts
- dependencies
- app/page.tsx
- package.json
- diag-multi-package.js
- Request ke Client — Hearty Bridge (Landing Page)
- attendance/page.tsx
- dashboard/page.tsx
- messaging.ts
- middleware/auth.ts
- useAuth
- [id]/page.tsx
- AssignmentEngine
- validation/auth.ts
- compilerOptions
- .methodNotAllowed
- usePermissions
- Message.ts
- seed-patients.js
- error-handler.ts
- jwt.ts
- PermissionChecker
- reports/[id]/route.ts
- media.ts
- Conversation.ts
- Family.ts
- SearchIndex.ts
- populate-mongodb.js
- dashboard/stats/route.ts
- IMilestoneModel
- weekly-schedule/route.ts
- invoices/page.tsx
- auth-context.tsx
- reports/[id]/pdf/route.ts
- analytics/page.tsx
- devDependencies
- Document.ts
- seed-database.js
- dashboard/layout.tsx
- invoice-pdf-template.tsx
- dashboard-sidebar.tsx
- proxy.ts
- compress.ts
- bcryptjs
- document.ts
- Report.ts
- seed-parents-children.js
- .internalServerError
- MediaFile.ts
- populate-simple.js
- reset-staff-accounts.js
- logout/route.ts
- useConversations.ts
- Progress.ts
- cleanup-orphan-packages.js
- consolidate-packages.js
- create-super-admin.js
- diag-get-schedule.js
- diag-session-visibility.js
- fix-missing-sessions.js
- fix-unlinked-slots.js
- seed-packages.js
- types/index.ts
- family.ts
- ISessionModel
- scripts
- backfill-therapist-colors.js
- delete-duplicate-slots.js
- diag-aldi.js
- diag-aldi-kamis.js
- diag-aldi-slots-raw.js
- diag-kevin.js
- diag-laila-slots.js
- diag-notype-packages.js
- diag-packages.js
- diag-patient.js
- diag-recent.js
- diag-recent-tx.js
- diag-remaining.js
- diag-session-mismatch.js
- diag-slots.js
- fix-admin-password.js
- fix-aldi-duplicate-slots.js
- fix-kevin-tw-package-type.js
- fix-slot-effective-until.js
- messages/route.ts
- conversations/route.ts
- sync-sessions.js
- test-api.js
- test-therapist-data.js
- IUserModel
- eslint.config.mjs
- postcss.config.mjs
- mongodb.ts
- financial/page.tsx
- reset-user-password.js
- assessments/[id]/route.ts
- HBridge - Hearty Bridge Project
- login/route.ts
- handleError
- generate-password.ts
- IChildModel
- IChild
- IUser
- check-users.js
- clear-data.js
- delete-patients-and-parents.js
- fix-therapy-type.js
- migrate-to-atlas.js

## God Nodes (most connected - your core abstractions)
1. `connectToDatabase()` - 139 edges
2. `mongoose` - 107 edges
3. `react` - 73 edges
4. `cn()` - 59 edges
5. `ErrorResponse` - 54 edges
6. `withErrorHandling()` - 50 edges
7. `useAuth()` - 50 edges
8. `SuccessResponse` - 46 edges
9. `lucide-react` - 43 edges
10. `withAnyAuth()` - 39 edges

## Surprising Connections (you probably didn't know these)
- `ROUTE_PERMISSIONS` --calls--> `PermissionChecker`  [EXTRACTED]
  hearty-bridge/app/dashboard/layout.tsx → hearty-bridge/lib/utils/permissions.ts
- `DocumentLibrary()` --calls--> `useToast()`  [EXTRACTED]
  hearty-bridge/components/documents/document-library.tsx → hearty-bridge/components/ui/toast.tsx
- `MediaGallery()` --calls--> `useToast()`  [EXTRACTED]
  hearty-bridge/components/child-profile/media-gallery.tsx → hearty-bridge/components/ui/toast.tsx
- `MilestoneTracker()` --calls--> `useToast()`  [EXTRACTED]
  hearty-bridge/components/child-profile/milestone-tracker.tsx → hearty-bridge/components/ui/toast.tsx
- `UnifiedDashboard()` --calls--> `useAuth()`  [EXTRACTED]
  hearty-bridge/app/dashboard/page.tsx → hearty-bridge/lib/contexts/auth-context.tsx

## Import Cycles
- None detected.

## Communities (127 total, 22 thin omitted)

### Community 0 - "patients/page.tsx"
Cohesion: 0.07
Nodes (47): Patient, LeaveRecord, Therapist, ResetPasswordDialog(), ResetPasswordDialogProps, ResetPasswordTarget, IMediaFile, MediaGallery() (+39 more)

### Community 1 - "mongoose"
Cohesion: 0.12
Nodes (18): createSchema, DAY_NAMES, PACKAGE_PRICES, withAnyAuth(), ErrorResponse, withErrorHandling(), ChildSchema, InvoiceSchema (+10 more)

### Community 2 - "api/children/route.ts"
Cohesion: 0.12
Nodes (31): DELETE, GET, PUT, GET, POST, buildChildSearchQuery(), buildChildSortQuery(), calculateAge() (+23 more)

### Community 3 - "cn"
Cohesion: 0.06
Nodes (40): ChildProfileLayoutProps, IChild, AnimatedGradientText(), AnimatedGradientTextProps, AnimatedShinyText(), AnimatedShinyTextProps, MagicCard(), MagicCardProps (+32 more)

### Community 4 - ".badRequest"
Cohesion: 0.12
Nodes (31): POST, sanitizeFileName(), POST, POST, GET, getChildId(), POST, GET (+23 more)

### Community 5 - "search.ts"
Cohesion: 0.11
Nodes (18): AdvancedSearchInput, advancedSearchSchema, BulkIndexOperationInput, bulkIndexOperationSchema, EntitySearchInput, entitySearchSchema, GlobalSearchInput, globalSearchSchema (+10 more)

### Community 6 - "badge.tsx"
Cohesion: 0.08
Nodes (25): DocumentUploadDialog(), DocumentUploadDialogProps, IDocument, FamilyTreeVisualization(), FamilyTreeVisualizationProps, getRelationshipColor(), IFamily, IFamilyMember (+17 more)

### Community 7 - "media/route.ts"
Cohesion: 0.18
Nodes (18): ALLOWED_MIME_TYPES, ALLOWED_MIME_TYPES, injectSignedUrls(), ALLOWED, ALLOWED_MIME_TYPES, compressVideoInBackground(), DELETE, detectFileType() (+10 more)

### Community 8 - "schedules/page.tsx"
Cohesion: 0.09
Nodes (35): ActivePackageInfo, addDays(), addWeeks(), AssessmentSlot, dateStrToDayName(), dateUTCStr(), Day, DAY_LABELS (+27 more)

### Community 9 - "connectToDatabase"
Cohesion: 0.11
Nodes (33): GET, POST, DELETE, PATCH, GET, POST, DELETE, getAnnouncementId() (+25 more)

### Community 10 - "reports/page.tsx"
Cohesion: 0.13
Nodes (18): EMOJIS, formatSavedAt(), getStatusBadgeVariant(), getStatusLabel(), getTypeColor(), getTypeLabel(), PatientOption, PatientPickerDialog() (+10 more)

### Community 11 - "react"
Cohesion: 0.13
Nodes (22): BankAccount, EMPTY_FORM, PageCta(), PageCtaProps, PageHero(), PageHeroProps, BlurFade(), BlurFadeProps (+14 more)

### Community 12 - ".forbidden"
Cohesion: 0.11
Nodes (20): DELETE, GET, getAssessmentId(), PATCH, haversineMeters(), POST, toWIBISOString(), countWorkingDays() (+12 more)

### Community 13 - "models/index.ts"
Cohesion: 0.08
Nodes (27): AnnouncementAttachmentSchema, AnnouncementSchema, IAnnouncement, IAnnouncementAttachment, AttendanceSchema, IAttendance, IAttendanceModel, BankAccountSchema (+19 more)

### Community 14 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, class-variance-authority, clsx, ffmpeg-static, fluent-ffmpeg (+21 more)

### Community 15 - "app/page.tsx"
Cohesion: 0.06
Nodes (26): geistMono, geistSans, localBusinessSchema, metadata, features, services, AboutSection(), ContactSection() (+18 more)

### Community 16 - "package.json"
Cohesion: 0.07
Nodes (27): name, private, version, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, eslint (+19 more)

### Community 17 - "diag-multi-package.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 18 - "Request ke Client — Hearty Bridge (Landing Page)"
Cohesion: 0.08
Nodes (23): 10. Booking / CTA, 11. Brand & Visual — yang masih kosong, 12. Checklist Asset, 13. Versi Paling Singkat, 1. Informasi Dasar — yang masih kosong, 2. Tentang Terapi & Proses Layanan, 3. Detail per Layanan, 4. Target & Messaging (+15 more)

### Community 19 - "attendance/page.tsx"
Cohesion: 0.13
Nodes (16): AbsentEntry, AdminData, AttendancePage(), AttendanceRecord, CheckInResult, ChildAttendanceRecord, ChildAttendanceSection(), formatCheckInTime() (+8 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.10
Nodes (17): ActivityItem, AdminMainContent(), AdminStatsCards(), BirthdayItem, ChildInfo, DashboardData, DAY_LABELS, DAY_ORDER (+9 more)

### Community 21 - "messaging.ts"
Cohesion: 0.09
Nodes (22): AddParticipantInput, addParticipantSchema, AddReactionInput, addReactionSchema, BulkMessageOperationInput, bulkMessageOperationSchema, ConversationQueryInput, conversationQuerySchema (+14 more)

### Community 22 - "middleware/auth.ts"
Cohesion: 0.17
Nodes (15): AuthenticatedHandler, getClientIp(), IpRateLimitOptions, ipRateLimitStore, RateLimitOptions, rateLimitStore, UnauthenticatedHandler, withAuth() (+7 more)

### Community 23 - "useAuth"
Cohesion: 0.13
Nodes (19): ChangePasswordFormData, ChangePasswordPage(), changePasswordSchema, LoginPage(), AuthGuard(), AuthGuardProps, Header(), navigation (+11 more)

### Community 24 - "[id]/page.tsx"
Cohesion: 0.09
Nodes (22): AvailablePackage, ChildDetail, DAY_LABELS, DAY_ORDER, formatDate(), formatRupiah(), InvoiceRecord, PatientDetailPage() (+14 more)

### Community 25 - "AssignmentEngine"
Cohesion: 0.13
Nodes (7): ASSIGNMENT_RULES, AssignmentEngine, AssignmentResult, AssignmentRule, AssignmentScore, Patient, Therapist

### Community 26 - "validation/auth.ts"
Cohesion: 0.10
Nodes (18): AccountDeactivationData, accountDeactivationSchema, commonValidations, EmailVerificationData, emailVerificationSchema, LoginFormData, PasswordChangeData, passwordChangeSchema (+10 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 28 - ".methodNotAllowed"
Cohesion: 0.12
Nodes (16): GET(), GET(), DELETE(), POST(), DELETE(), GET(), POST(), PUT() (+8 more)

### Community 29 - "usePermissions"
Cohesion: 0.09
Nodes (27): UnifiedPatientsPage(), ChildOption, EditReportPage(), formatSavedAt(), FormState, MediaFile, ChildOption, EMPTY_FORM (+19 more)

### Community 30 - "Message.ts"
Cohesion: 0.11
Nodes (7): IMessage, IMessageModel, IMessageReaction, IMessageReadStatus, MessageReactionSchema, MessageReadStatusSchema, MessageSchema

### Community 31 - "seed-patients.js"
Cohesion: 0.12
Nodes (17): bcrypt, BOY_NAMES, DAY_HOURS, DAYS, DIAGNOSES, DOW_MAP, fs, GIRL_NAMES (+9 more)

### Community 32 - "error-handler.ts"
Cohesion: 0.11
Nodes (18): resetPasswordSchema, updateUserSchema, createUserSchema, changePasswordSchema, bankAccountSchema, bodySchema, updateSchema, packageSchema (+10 more)

### Community 33 - "jwt.ts"
Cohesion: 0.19
Nodes (15): decodeToken(), generateAccessToken(), generateRefreshToken(), getJWTConfig(), getTokenExpiration(), hasAnyRole(), hasRole(), isTokenNearExpiry() (+7 more)

### Community 35 - "reports/[id]/route.ts"
Cohesion: 0.22
Nodes (11): ALLOWED_EMOJIS, DELETE, GET, getReportId(), PUT, GET, injectSignedUrls(), POST (+3 more)

### Community 36 - "media.ts"
Cohesion: 0.13
Nodes (14): AUDIO_MIME_TYPES, BulkMediaOperationInput, bulkMediaOperationSchema, IMAGE_MIME_TYPES, MEDIA_CONSTANTS, MediaQueryInput, mediaQuerySchema, MediaSearchInput (+6 more)

### Community 37 - "Conversation.ts"
Cohesion: 0.13
Nodes (5): ConversationParticipantSchema, ConversationSchema, IConversation, IConversationModel, IConversationParticipant

### Community 38 - "Family.ts"
Cohesion: 0.13
Nodes (7): FamilyMemberSchema, FamilySchema, FamilyTreeNodeSchema, IFamily, IFamilyMember, IFamilyModel, IFamilyTreeNode

### Community 39 - "SearchIndex.ts"
Cohesion: 0.13
Nodes (6): ActivityLogSchema, IActivityLog, IActivityLogModel, ISearchIndex, ISearchIndexModel, SearchIndexSchema

### Community 40 - "populate-mongodb.js"
Cohesion: 0.18
Nodes (14): bcrypt, Child, connectToDatabase(), Conversation, createChildren(), createConversations(), createDocuments(), createUsers() (+6 more)

### Community 41 - "dashboard/stats/route.ts"
Cohesion: 0.35
Nodes (13): adminStats(), buildCompletedCountByPackage(), buildTodayAppointments(), DAY_ORDER, daysUntil(), DOW_OF_DAY, GET, getDateRanges() (+5 more)

### Community 42 - "IMilestoneModel"
Cohesion: 0.15
Nodes (3): IMilestone, IMilestoneModel, MilestoneSchema

### Community 43 - "weekly-schedule/route.ts"
Cohesion: 0.33
Nodes (9): dateToDayName(), DAY_NAMES, DAY_TO_IDX, deduplicateSlots(), GET, getMondayOfWeek(), nextOccurrenceOf(), regeneratePackageSchedule() (+1 more)

### Community 44 - "invoices/page.tsx"
Cohesion: 0.20
Nodes (9): BankAccount, formatDate(), formatRupiah(), Invoice, InvoicesPage(), PACKAGE_COLOR, PACKAGE_LABEL, THERAPY_COLOR (+1 more)

### Community 45 - "auth-context.tsx"
Cohesion: 0.24
Nodes (10): AuthContext, AuthProviderProps, AuthContextType, AuthResponse, LoginFormData, loginSchema, NavigationItem, RegisterFormData (+2 more)

### Community 46 - "reports/[id]/pdf/route.ts"
Cohesion: 0.39
Nodes (6): formatDate(), ReportPdfData, ReportPdfDocument(), styles, TYPE_LABELS, @react-pdf/renderer

### Community 47 - "analytics/page.tsx"
Cohesion: 0.21
Nodes (9): FinancialOutstanding, FinancialTrendPoint, formatMonth(), formatRupiah(), formatRupiahCompact(), MONTH_LABEL, PatientAnalyticsPage(), TrendPoint (+1 more)

### Community 48 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/fluent-ffmpeg, @types/node, @types/react (+3 more)

### Community 49 - "Document.ts"
Cohesion: 0.20
Nodes (3): DocumentSchema, IDocument, IDocumentModel

### Community 50 - "seed-database.js"
Cohesion: 0.24
Nodes (9): bcrypt, childSchema, connectToDatabase(), main(), mongoose, progressSchema, seedData(), sessionSchema (+1 more)

### Community 51 - "dashboard/layout.tsx"
Cohesion: 0.18
Nodes (13): ALL_ROLES, allowedRolesForPath(), Layout(), Props, ROUTE_PERMISSION_SOURCE, ROUTE_PERMISSIONS, ProtectedRoute(), ProtectedRouteProps (+5 more)

### Community 52 - "invoice-pdf-template.tsx"
Cohesion: 0.28
Nodes (8): formatDate(), formatRupiah(), InvoicePdfData, InvoicePdfDocument(), STATUS_LABEL, STATUS_STYLE, styles, THERAPY_LABEL

### Community 53 - "dashboard-sidebar.tsx"
Cohesion: 0.22
Nodes (10): DashboardSidebar(), DashboardSidebarProps, iconMap, NotificationBell(), NotificationItem, timeAgo(), fetchWithTimeout(), ref_next_image (+2 more)

### Community 54 - "proxy.ts"
Cohesion: 0.47
Nodes (5): config, getRouteType(), matchesPattern(), proxy(), routeConfig

### Community 55 - "compress.ts"
Cohesion: 0.28
Nodes (8): CompressResult, compressVideo(), loadFfmpeg(), loadSharp(), verifyFfmpegRuns(), ffmpeg-static, fluent-ffmpeg, sharp

### Community 56 - "bcryptjs"
Cohesion: 0.22
Nodes (5): bcrypt, bcrypt, KNOWN_STAFF, mongoose, bcryptjs

### Community 57 - "document.ts"
Cohesion: 0.12
Nodes (16): BulkDocumentOperationInput, bulkDocumentOperationSchema, CreateDocumentVersionInput, createDocumentVersionSchema, DOCUMENT_CONSTANTS, DOCUMENT_MIME_TYPES, DocumentQueryInput, documentQuerySchema (+8 more)

### Community 58 - "Report.ts"
Cohesion: 0.25
Nodes (7): IReport, IReportMediaFile, IReportModel, IReportReaction, IReportSeenBy, ReportMediaFileSchema, ReportSchema

### Community 59 - "seed-parents-children.js"
Cohesion: 0.25
Nodes (6): bcrypt, childSchema, mongoose, PARENTS_NO_CHILDREN, PARENTS_WITH_CHILDREN, userSchema

### Community 60 - ".internalServerError"
Cohesion: 0.17
Nodes (15): DELETE, extractR2Key(), getChildId(), POST, GET, getInvoiceId(), POST, DELETE (+7 more)

### Community 61 - "MediaFile.ts"
Cohesion: 0.29
Nodes (3): IMediaFile, IMediaFileModel, MediaFileSchema

### Community 62 - "populate-simple.js"
Cohesion: 0.29
Nodes (5): Child, childSchema, mongoose, User, userSchema

### Community 63 - "reset-staff-accounts.js"
Cohesion: 0.33
Nodes (6): bcrypt, crypto, mongoose, newStaff, randomPassword(), run()

### Community 64 - "logout/route.ts"
Cohesion: 0.28
Nodes (8): DELETE(), GET(), POST, PUT(), withOptionalAuth(), clearAuthCookies(), extractTokenFromRequest(), getUserFromRequest()

### Community 65 - "useConversations.ts"
Cohesion: 0.33
Nodes (4): Conversation, ConversationParticipant, Message, useConversations()

### Community 66 - "Progress.ts"
Cohesion: 0.33
Nodes (3): IProgress, IProgressModel, ProgressSchema

### Community 67 - "cleanup-orphan-packages.js"
Cohesion: 0.33
Nodes (4): fs, isDryRun, mongoose, path

### Community 68 - "consolidate-packages.js"
Cohesion: 0.33
Nodes (4): fs, isDryRun, mongoose, path

### Community 69 - "create-super-admin.js"
Cohesion: 0.33
Nodes (4): bcrypt, mongoose, SUPER_ADMIN, UserSchema

### Community 70 - "diag-get-schedule.js"
Cohesion: 0.33
Nodes (3): fs, mongoose, path

### Community 71 - "diag-session-visibility.js"
Cohesion: 0.33
Nodes (3): fs, mongoose, path

### Community 72 - "fix-missing-sessions.js"
Cohesion: 0.33
Nodes (4): fs, isDryRun, mongoose, path

### Community 73 - "fix-unlinked-slots.js"
Cohesion: 0.33
Nodes (3): fs, mongoose, path

### Community 74 - "seed-packages.js"
Cohesion: 0.33
Nodes (4): mongoose, PackageSchema, SEED_PACKAGES, UserSchema

### Community 75 - "types/index.ts"
Cohesion: 0.50
Nodes (4): ApiResponse, FormState, PaginatedResponse, PaginationMeta

### Community 76 - "family.ts"
Cohesion: 0.15
Nodes (12): AddFamilyMemberInput, addFamilyMemberSchema, CreateFamilyInput, createFamilySchema, FamilyTreeNodeInput, familyTreeNodeSchema, UpdateFamilyInput, UpdateFamilyMemberInput (+4 more)

### Community 78 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 79 - "backfill-therapist-colors.js"
Cohesion: 0.50
Nodes (4): mongoose, nextColor(), run(), THERAPIST_COLOR_PRESETS

### Community 80 - "delete-duplicate-slots.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 81 - "diag-aldi.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 82 - "diag-aldi-kamis.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 83 - "diag-aldi-slots-raw.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 84 - "diag-kevin.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 85 - "diag-laila-slots.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 86 - "diag-notype-packages.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 87 - "diag-packages.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 88 - "diag-patient.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 89 - "diag-recent.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 90 - "diag-recent-tx.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 91 - "diag-remaining.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 92 - "diag-session-mismatch.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 93 - "diag-slots.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 94 - "fix-admin-password.js"
Cohesion: 0.50
Nodes (4): bcrypt, connectToDatabase(), fixAdminPassword(), mongoose

### Community 95 - "fix-aldi-duplicate-slots.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 96 - "fix-kevin-tw-package-type.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 97 - "fix-slot-effective-until.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 101 - "test-api.js"
Cohesion: 0.67
Nodes (3): https, makeRequest(), testTherapistAPI()

### Community 111 - "mongodb.ts"
Cohesion: 0.25
Nodes (5): GET, disconnect(), isConnected(), MongooseCache, createHealthCheck()

### Community 112 - "financial/page.tsx"
Cohesion: 0.22
Nodes (8): formatDate(), formatRupiah(), InvoiceData, STATUS_COLOR, STATUS_LABEL, Summary, SuperAdminFinancialPage(), Transaction

### Community 113 - "reset-user-password.js"
Cohesion: 0.24
Nodes (10): bcrypt, fs, generateTempPassword(), mongoose, path, pick(), readMongoUri(), run() (+2 more)

### Community 114 - "assessments/[id]/route.ts"
Cohesion: 0.22
Nodes (6): patchSchema, resultSchema, AssessmentResultSchema, AssessmentSchema, IAssessment, IAssessmentResult

### Community 115 - "HBridge - Hearty Bridge Project"
Cohesion: 0.25
Nodes (7): Documentation, Environment: WSL2 on Windows, HBridge - Hearty Bridge Project, Main Application, Project Overview, Quick Commands, Repository Structure

### Community 116 - "login/route.ts"
Cohesion: 0.33
Nodes (5): DELETE(), GET(), loginRateLimit, PUT(), loginSchema

### Community 117 - "handleError"
Cohesion: 0.40
Nodes (4): GET, handleError(), handleJWTError(), handleMongoError()

### Community 118 - "generate-password.ts"
Cohesion: 0.67
Nodes (3): generateTempPassword(), pick(), ref_crypto

## Knowledge Gaps
- **662 isolated node(s):** `Project Overview`, `Repository Structure`, `Main Application`, `Quick Commands`, `Environment: WSL2 on Windows` (+657 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 864 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mongoose` connect `mongoose` to `api/children/route.ts`, `media/route.ts`, `models/index.ts`, `package.json`, `diag-multi-package.js`, `Message.ts`, `seed-patients.js`, `error-handler.ts`, `reports/[id]/route.ts`, `Conversation.ts`, `Family.ts`, `SearchIndex.ts`, `populate-mongodb.js`, `dashboard/stats/route.ts`, `IMilestoneModel`, `weekly-schedule/route.ts`, `reports/[id]/pdf/route.ts`, `Document.ts`, `seed-database.js`, `bcryptjs`, `Report.ts`, `seed-parents-children.js`, `MediaFile.ts`, `populate-simple.js`, `reset-staff-accounts.js`, `Progress.ts`, `cleanup-orphan-packages.js`, `consolidate-packages.js`, `create-super-admin.js`, `diag-get-schedule.js`, `diag-session-visibility.js`, `fix-missing-sessions.js`, `fix-unlinked-slots.js`, `seed-packages.js`, `backfill-therapist-colors.js`, `delete-duplicate-slots.js`, `diag-aldi.js`, `diag-aldi-kamis.js`, `diag-aldi-slots-raw.js`, `diag-kevin.js`, `diag-laila-slots.js`, `diag-notype-packages.js`, `diag-packages.js`, `diag-patient.js`, `diag-recent.js`, `diag-recent-tx.js`, `diag-remaining.js`, `diag-session-mismatch.js`, `diag-slots.js`, `fix-admin-password.js`, `fix-aldi-duplicate-slots.js`, `fix-kevin-tw-package-type.js`, `fix-slot-effective-until.js`, `sync-sessions.js`, `test-therapist-data.js`, `mongodb.ts`, `reset-user-password.js`, `assessments/[id]/route.ts`, `check-users.js`, `clear-data.js`, `delete-patients-and-parents.js`, `fix-therapy-type.js`, `migrate-to-atlas.js`?**
  _High betweenness centrality (0.400) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `patients/page.tsx`, `cn`, `badge.tsx`, `schedules/page.tsx`, `reports/page.tsx`, `app/page.tsx`, `package.json`, `attendance/page.tsx`, `dashboard/page.tsx`, `useAuth`, `[id]/page.tsx`, `usePermissions`, `invoices/page.tsx`, `auth-context.tsx`, `analytics/page.tsx`, `dashboard/layout.tsx`, `dashboard-sidebar.tsx`, `useConversations.ts`, `financial/page.tsx`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `zod` connect `error-handler.ts` to `mongoose`, `api/children/route.ts`, `media.ts`, `search.ts`, `family.ts`, `auth-context.tsx`, `package.json`, `assessments/[id]/route.ts`, `messaging.ts`, `useAuth`, `document.ts`, `validation/auth.ts`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **What connects `Project Overview`, `Repository Structure`, `Main Application` to the rest of the system?**
  _662 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `patients/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07043650793650794 - nodes in this community are weakly interconnected._
- **Should `mongoose` be split into smaller, more focused modules?**
  _Cohesion score 0.11515151515151516 - nodes in this community are weakly interconnected._
- **Should `api/children/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12233285917496443 - nodes in this community are weakly interconnected._
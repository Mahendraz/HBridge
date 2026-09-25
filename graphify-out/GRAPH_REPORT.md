# Graph Report - HBridge  (2026-09-25)

## Corpus Check
- 327 files · ~256,852 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .toml 1, .css 1)

## Summary
- 1821 nodes · 4269 edges · 128 communities (106 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `38fcda0a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- patients/page.tsx
- User.ts
- api/children/route.ts
- reports/page.tsx
- .internalServerError
- search.ts
- milestone-tracker.tsx
- financial/page.tsx
- schedules/page.tsx
- withErrorHandling
- card.tsx
- D. Admin
- media/route.ts
- models/index.ts
- dependencies
- app/layout.tsx
- package.json
- diag-multi-package.js
- Request ke Client — Hearty Bridge (Landing Page)
- attendance/page.tsx
- dashboard/page.tsx
- messaging.ts
- middleware/auth.ts
- react
- error-handler.ts
- AssignmentEngine
- validation/auth.ts
- compilerOptions
- Hearty Bridge - Next.js Application
- analytics/page.tsx
- Message.ts
- seed-patients.js
- jwt.ts
- weekly-schedule/route.ts
- permissions.ts
- mongoose
- media.ts
- Conversation.ts
- Family.ts
- SearchIndex.ts
- populate-mongodb.js
- dashboard/stats/route.ts
- IMilestoneModel
- POST
- invoices/page.tsx
- dashboard-sidebar.tsx
- family-tree-visualization.tsx
- connectToDatabase
- devDependencies
- Document.ts
- seed-database.js
- auth-context.tsx
- invoice-pdf-template.tsx
- .badRequest
- users/[id]/route.ts
- loadFfmpeg
- bcryptjs
- document.ts
- Report.ts
- seed-parents-children.js
- next.config.ts
- MediaFile.ts
- populate-simple.js
- reset-staff-accounts.js
- ReportsPage
- useAuth
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
- migrate-leave-cuti-to-sakit-izin.js
- reset-user-password.js
- HBridge - Hearty Bridge Project
- .forbidden
- heic-convert.d.ts
- handleValidationError
- IChildModel
- reports/[id]/pdf/route.ts
- mongodb.ts
- check-users.js
- clear-data.js
- delete-patients-and-parents.js
- fix-therapy-type.js
- migrate-to-atlas.js
- instagram-feed-section.tsx
- IChild
- IUser

## God Nodes (most connected - your core abstractions)
1. `connectToDatabase()` - 132 edges
2. `mongoose` - 112 edges
3. `react` - 75 edges
4. `cn()` - 59 edges
5. `ErrorResponse` - 54 edges
6. `useAuth()` - 50 edges
7. `withErrorHandling()` - 50 edges
8. `SuccessResponse` - 46 edges
9. `lucide-react` - 45 edges
10. `withAnyAuth()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `2A · Sisa sesi & profil anak` --references--> `buildTodayAppointments()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/app/api/dashboard/stats/route.ts
- `2A · Sisa sesi & profil anak` --references--> `parentStats()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/app/api/dashboard/stats/route.ts
- `1B · Data terapis: ulang tahun & status` --references--> `SlotCard()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/app/dashboard/schedules/page.tsx
- `1A · Media: video & pengumuman` --references--> `Lightbox()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/components/ui/lightbox.tsx
- `2A · Sisa sesi & profil anak` --references--> `formatChildForResponse()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/lib/utils/child.ts

## Import Cycles
- None detected.

## Communities (128 total, 22 thin omitted)

### Community 0 - "patients/page.tsx"
Cohesion: 0.06
Nodes (52): Patient, PROGRAM_BADGE, BankAccount, EMPTY_FORM, LeaveRecord, STATUS_OPTIONS, StatusOption, Therapist (+44 more)

### Community 1 - "User.ts"
Cohesion: 0.14
Nodes (16): resetPasswordSchema, createUserSchema, changePasswordSchema, updateSchema, createSchema, ErrorCodes, JWTPayload, getLeaveScheduleWarning() (+8 more)

### Community 2 - "api/children/route.ts"
Cohesion: 0.12
Nodes (31): DELETE, GET, PUT, GET, POST, buildChildSearchQuery(), buildChildSortQuery(), calculateAge() (+23 more)

### Community 3 - "reports/page.tsx"
Cohesion: 0.06
Nodes (45): EMOJIS, PatientOption, PatientPickerDialog(), Report, ReportComment, ReportMediaFile, ReportReaction, ReportSeenBy (+37 more)

### Community 4 - ".internalServerError"
Cohesion: 0.14
Nodes (19): DELETE, getAnnouncementId(), PUT, DELETE, extractR2Key(), getChildId(), POST, GET (+11 more)

### Community 5 - "search.ts"
Cohesion: 0.11
Nodes (18): AdvancedSearchInput, advancedSearchSchema, BulkIndexOperationInput, bulkIndexOperationSchema, EntitySearchInput, entitySearchSchema, GlobalSearchInput, globalSearchSchema (+10 more)

### Community 6 - "milestone-tracker.tsx"
Cohesion: 0.06
Nodes (31): IMediaFile, MediaGallery(), MediaGalleryProps, categoryColors, IMilestone, MilestoneTracker(), MilestoneTrackerProps, statusColors (+23 more)

### Community 7 - "financial/page.tsx"
Cohesion: 0.09
Nodes (21): InvoiceData, STATUS_COLOR, STATUS_LABEL, Summary, Transaction, EMPTY_FORM, PackageData, THERAPY_COLOR (+13 more)

### Community 8 - "schedules/page.tsx"
Cohesion: 0.09
Nodes (36): 1B · Data terapis: ulang tahun & status, 2B · Jadwal & drag-drop, addDays(), addWeeks(), AssessmentSlot, dateStrToDayName(), dateUTCStr(), Day (+28 more)

### Community 9 - "withErrorHandling"
Cohesion: 0.13
Nodes (16): createSchema, ALLOWED, DAY_NAMES, PACKAGE_PRICES, withAdminAuth(), SuccessResponse, withErrorHandling(), getInactiveTherapistError() (+8 more)

### Community 10 - "card.tsx"
Cohesion: 0.09
Nodes (28): AvailablePackage, ChildDetail, DAY_LABELS, DAY_ORDER, InvoiceRecord, TokenTransaction, ChildOption, EditReportPage() (+20 more)

### Community 11 - "D. Admin"
Cohesion: 0.07
Nodes (29): A. Orang Tua, ADM-1 · Pilihan ubah jadwal: minggu ini saja atau semua minggu ✅, ADM-2 · Edit invoice mengikuti jenis layanan/paket ✅, ADM-3 · Hapus akun ortu & anak (lewat persetujuan Super Admin) ✅, ADM-4 · Status terapis: Aktif / Sakit-Izin / Inaktif ✅, ADM-5 · Drag & drop jadwal ke minggu lain ✅, ADM-6 · Nama terapis di profil anak ✅, ADM-7 · Komentar terbaru di atas pada notifikasi lonceng ✅ (+21 more)

### Community 12 - "media/route.ts"
Cohesion: 0.06
Nodes (53): 1A · Media: video & pengumuman, 1C · Label menu, File yang disentuh lagi di step lain, Task 1 · Step 1: Media, Terapis, Label, DELETE, getReportId(), POST, sanitizeFileName() (+45 more)

### Community 13 - "models/index.ts"
Cohesion: 0.09
Nodes (25): AnnouncementAttachmentSchema, AnnouncementSchema, IAnnouncement, IAnnouncementAttachment, AttendanceSchema, IAttendance, IAttendanceModel, BankAccountSchema (+17 more)

### Community 14 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, class-variance-authority, clsx, ffmpeg-static, fluent-ffmpeg (+22 more)

### Community 15 - "app/layout.tsx"
Cohesion: 0.15
Nodes (7): geistMono, geistSans, localBusinessSchema, metadata, Header(), ErrorBoundary, AuthProvider()

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
Cohesion: 0.07
Nodes (26): 2A · Sisa sesi & profil anak, File yang disentuh lagi di Step 3, Pembagian file 2A vs 2B, Task 1 · Step 2: Sisa Sesi & Jadwal, ActivityItem, AdminMainContent(), AdminStatsCards(), BirthdayItem (+18 more)

### Community 21 - "messaging.ts"
Cohesion: 0.09
Nodes (22): AddParticipantInput, addParticipantSchema, AddReactionInput, addReactionSchema, BulkMessageOperationInput, bulkMessageOperationSchema, ConversationQueryInput, conversationQuerySchema (+14 more)

### Community 22 - "middleware/auth.ts"
Cohesion: 0.10
Nodes (21): loginRateLimit, bankAccountSchema, bodySchema, updateSchema, packageSchema, AuthenticatedHandler, getClientIp(), IpRateLimitOptions (+13 more)

### Community 23 - "react"
Cohesion: 0.08
Nodes (33): ChangePasswordFormData, changePasswordSchema, features, services, AuthGuard(), AuthGuardProps, AboutSection(), ContactSection() (+25 more)

### Community 24 - "error-handler.ts"
Cohesion: 0.18
Nodes (8): patchSchema, resultSchema, API Route Pattern, withAnyAuth(), ApiError, ErrorResponse, handleApiError, InvoiceSchema

### Community 25 - "AssignmentEngine"
Cohesion: 0.13
Nodes (7): ASSIGNMENT_RULES, AssignmentEngine, AssignmentResult, AssignmentRule, AssignmentScore, Patient, Therapist

### Community 26 - "validation/auth.ts"
Cohesion: 0.10
Nodes (19): AccountDeactivationData, accountDeactivationSchema, commonValidations, EmailVerificationData, emailVerificationSchema, LoginFormData, loginSchema, PasswordChangeData (+11 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 28 - "Hearty Bridge - Next.js Application"
Cohesion: 0.10
Nodes (19): Auth Context (Frontend), Common Commands, Database Connection, Directory Layout, Environment Variables Required, Error Responses, Hearty Bridge - Next.js Application, Important: Next.js Version Notice (+11 more)

### Community 29 - "analytics/page.tsx"
Cohesion: 0.21
Nodes (9): FinancialOutstanding, FinancialTrendPoint, formatMonth(), formatRupiah(), formatRupiahCompact(), MONTH_LABEL, PatientAnalyticsPage(), TrendPoint (+1 more)

### Community 30 - "Message.ts"
Cohesion: 0.11
Nodes (7): IMessage, IMessageModel, IMessageReaction, IMessageReadStatus, MessageReactionSchema, MessageReadStatusSchema, MessageSchema

### Community 31 - "seed-patients.js"
Cohesion: 0.12
Nodes (17): bcrypt, BOY_NAMES, DAY_HOURS, DAYS, DIAGNOSES, DOW_MAP, fs, GIRL_NAMES (+9 more)

### Community 32 - "jwt.ts"
Cohesion: 0.06
Nodes (46): GET(), GET(), DELETE(), GET(), PUT(), DELETE(), GET(), POST (+38 more)

### Community 33 - "weekly-schedule/route.ts"
Cohesion: 0.17
Nodes (11): withOptionalTransaction(), applyInvoicePackageChange(), hearty_bridge_lib_utils_package_schedule, hearty_bridge_lib_utils_package_schedule_datetodayname, hearty_bridge_lib_utils_package_schedule_day_to_idx, hearty_bridge_lib_utils_package_schedule_nextoccurrenceof, hearty_bridge_lib_utils_package_schedule_regeneratepackageschedule, IWeeklySchedule (+3 more)

### Community 34 - "permissions.ts"
Cohesion: 0.15
Nodes (6): Permission, PERMISSION_CATEGORIES, PermissionChecker, PermissionGuard(), ROLE_PERMISSIONS, withPermissions()

### Community 35 - "mongoose"
Cohesion: 0.15
Nodes (16): ALLOWED_EMOJIS, DELETE, GET, getReportId(), PUT, GET, injectSignedUrls(), POST (+8 more)

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
Cohesion: 0.10
Nodes (34): adminStats(), buildAppointments(), buildCompletedCountByPackage(), buildTodayAppointments(), DAY_NAME_BY_UTC_DOW, DAY_ORDER, GET, getDateRanges() (+26 more)

### Community 42 - "IMilestoneModel"
Cohesion: 0.15
Nodes (3): IMilestone, IMilestoneModel, MilestoneSchema

### Community 43 - "POST"
Cohesion: 0.47
Nodes (6): deduplicateSlots(), GET, getMondayOfWeek(), moveRecurringSeries(), POST, timeToHour()

### Community 44 - "invoices/page.tsx"
Cohesion: 0.20
Nodes (9): BankAccount, formatDate(), formatRupiah(), Invoice, InvoicesPage(), PACKAGE_COLOR, PACKAGE_LABEL, THERAPY_COLOR (+1 more)

### Community 45 - "dashboard-sidebar.tsx"
Cohesion: 0.23
Nodes (9): UnifiedPatientsPage(), DashboardSidebarProps, iconMap, NotificationBell(), NotificationItem, timeAgo(), fetchWithTimeout(), ref_next_image (+1 more)

### Community 46 - "family-tree-visualization.tsx"
Cohesion: 0.29
Nodes (7): FamilyTreeVisualization(), FamilyTreeVisualizationProps, getRelationshipColor(), IFamily, IFamilyMember, IFamilyTreeNode, MemberDialog()

### Community 47 - "connectToDatabase"
Cohesion: 0.12
Nodes (29): GET, DELETE, GET, GET, DELETE, GET, getAssessmentId(), PATCH (+21 more)

### Community 48 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/fluent-ffmpeg, @types/node, @types/react (+3 more)

### Community 49 - "Document.ts"
Cohesion: 0.20
Nodes (3): DocumentSchema, IDocument, IDocumentModel

### Community 50 - "seed-database.js"
Cohesion: 0.24
Nodes (9): bcrypt, childSchema, connectToDatabase(), main(), mongoose, progressSchema, seedData(), sessionSchema (+1 more)

### Community 51 - "auth-context.tsx"
Cohesion: 0.12
Nodes (23): ALL_ROLES, allowedRolesForPath(), Layout(), Props, ROUTE_PERMISSION_SOURCE, ROUTE_PERMISSIONS, ProtectedRoute(), ProtectedRouteProps (+15 more)

### Community 52 - "invoice-pdf-template.tsx"
Cohesion: 0.28
Nodes (8): formatDate(), formatRupiah(), InvoicePdfData, InvoicePdfDocument(), STATUS_LABEL, STATUS_STYLE, styles, THERAPY_LABEL

### Community 53 - ".badRequest"
Cohesion: 0.14
Nodes (26): POST, POST, POST, GET, getChildId(), POST, GET, getInvoiceId() (+18 more)

### Community 54 - "users/[id]/route.ts"
Cohesion: 0.43
Nodes (4): updateUserSchema, deactivateChildren(), deleteChildAccount(), deleteParentAccount()

### Community 55 - "loadFfmpeg"
Cohesion: 0.40
Nodes (5): loadFfmpeg(), resolveFfmpegPath(), verifyFfmpegRuns(), ffmpeg-static, fluent-ffmpeg

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

### Community 60 - "next.config.ts"
Cohesion: 0.40
Nodes (4): nextConfig, withNextIntl, next, ref_next_intl_plugin

### Community 61 - "MediaFile.ts"
Cohesion: 0.29
Nodes (3): IMediaFile, IMediaFileModel, MediaFileSchema

### Community 62 - "populate-simple.js"
Cohesion: 0.29
Nodes (5): Child, childSchema, mongoose, User, userSchema

### Community 63 - "reset-staff-accounts.js"
Cohesion: 0.33
Nodes (6): bcrypt, crypto, mongoose, newStaff, randomPassword(), run()

### Community 64 - "ReportsPage"
Cohesion: 0.31
Nodes (9): formatSavedAt(), getStatusBadgeVariant(), getStatusLabel(), getTypeColor(), getTypeLabel(), relativeTime(), ReportsPage(), ReportViewDialog() (+1 more)

### Community 65 - "useAuth"
Cohesion: 0.11
Nodes (22): ChangePasswordPage(), LoginPage(), UnifiedDashboard(), formatDate(), formatRupiah(), PatientDetailPage(), SuperAdminBankAccountsPage(), formatDate() (+14 more)

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

### Community 111 - "migrate-leave-cuti-to-sakit-izin.js"
Cohesion: 0.29
Nodes (7): fs, mongoose, path, readMongoUriFromEnvLocal(), run(), ref_fs, ref_path

### Community 113 - "reset-user-password.js"
Cohesion: 0.31
Nodes (8): bcrypt, fs, generateTempPassword(), mongoose, path, pick(), readMongoUri(), run()

### Community 115 - "HBridge - Hearty Bridge Project"
Cohesion: 0.25
Nodes (7): Documentation, Environment: WSL2 on Windows, HBridge - Hearty Bridge Project, Main Application, Project Overview, Quick Commands, Repository Structure

### Community 116 - ".forbidden"
Cohesion: 0.12
Nodes (18): haversineMeters(), POST, toWIBISOString(), countWorkingDays(), currentMonthRange(), GET, todayWIB(), GET (+10 more)

### Community 118 - "handleValidationError"
Cohesion: 0.21
Nodes (9): POST, PATCH, POST, POST, PUT, handleError(), handleJWTError(), handleMongoError() (+1 more)

### Community 120 - "reports/[id]/pdf/route.ts"
Cohesion: 0.17
Nodes (12): injectSignedUrls(), formatDate(), ReportPdfData, ReportPdfDocument(), styles, TYPE_LABELS, createR2Client(), existsInR2() (+4 more)

### Community 121 - "mongodb.ts"
Cohesion: 0.19
Nodes (8): GET, nextBirthday(), todayWib(), GET, disconnect(), isConnected(), MongooseCache, createHealthCheck()

### Community 127 - "instagram-feed-section.tsx"
Cohesion: 0.23
Nodes (8): InstagramIcon(), FEATURED_POSTS, InstagramFeedSection(), InstagramPostEmbed(), InstagramPostEmbedProps, loadInstagramEmbedScript(), Window, Footer()

## Knowledge Gaps
- **736 isolated node(s):** `updateUserSchema`, `DAY_NAMES`, `DAY_ORDER`, `DAY_NAME_BY_UTC_DOW`, `Patient` (+731 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 960 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mongoose` connect `mongoose` to `User.ts`, `api/children/route.ts`, `withErrorHandling`, `media/route.ts`, `models/index.ts`, `package.json`, `diag-multi-package.js`, `middleware/auth.ts`, `error-handler.ts`, `Message.ts`, `seed-patients.js`, `weekly-schedule/route.ts`, `Conversation.ts`, `Family.ts`, `SearchIndex.ts`, `populate-mongodb.js`, `dashboard/stats/route.ts`, `IMilestoneModel`, `Document.ts`, `seed-database.js`, `users/[id]/route.ts`, `bcryptjs`, `Report.ts`, `seed-parents-children.js`, `MediaFile.ts`, `populate-simple.js`, `reset-staff-accounts.js`, `Progress.ts`, `cleanup-orphan-packages.js`, `consolidate-packages.js`, `create-super-admin.js`, `diag-get-schedule.js`, `diag-session-visibility.js`, `fix-missing-sessions.js`, `fix-unlinked-slots.js`, `seed-packages.js`, `backfill-therapist-colors.js`, `delete-duplicate-slots.js`, `diag-aldi.js`, `diag-aldi-kamis.js`, `diag-aldi-slots-raw.js`, `diag-kevin.js`, `diag-laila-slots.js`, `diag-notype-packages.js`, `diag-packages.js`, `diag-patient.js`, `diag-recent.js`, `diag-recent-tx.js`, `diag-remaining.js`, `diag-session-mismatch.js`, `diag-slots.js`, `fix-admin-password.js`, `fix-aldi-duplicate-slots.js`, `fix-kevin-tw-package-type.js`, `fix-slot-effective-until.js`, `sync-sessions.js`, `test-therapist-data.js`, `migrate-leave-cuti-to-sakit-izin.js`, `reset-user-password.js`, `reports/[id]/pdf/route.ts`, `mongodb.ts`, `check-users.js`, `clear-data.js`, `delete-patients-and-parents.js`, `fix-therapy-type.js`, `migrate-to-atlas.js`?**
  _High betweenness centrality (0.386) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `patients/page.tsx`, `useAuth`, `permissions.ts`, `reports/page.tsx`, `milestone-tracker.tsx`, `financial/page.tsx`, `schedules/page.tsx`, `card.tsx`, `invoices/page.tsx`, `dashboard-sidebar.tsx`, `family-tree-visualization.tsx`, `media/route.ts`, `package.json`, `auth-context.tsx`, `attendance/page.tsx`, `dashboard/page.tsx`, `analytics/page.tsx`, `instagram-feed-section.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `zod` connect `User.ts` to `api/children/route.ts`, `media.ts`, `search.ts`, `withErrorHandling`, `family.ts`, `package.json`, `auth-context.tsx`, `messaging.ts`, `users/[id]/route.ts`, `react`, `error-handler.ts`, `middleware/auth.ts`, `validation/auth.ts`, `document.ts`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `updateUserSchema`, `DAY_NAMES`, `DAY_ORDER` to the rest of the system?**
  _736 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `patients/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06103286384976526 - nodes in this community are weakly interconnected._
- **Should `User.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14153846153846153 - nodes in this community are weakly interconnected._
- **Should `api/children/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12233285917496443 - nodes in this community are weakly interconnected._
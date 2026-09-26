# Graph Report - HBridge  (2026-09-26)

## Corpus Check
- 357 files · ~290,207 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 6, .toml 1, .css 1)

## Summary
- 2207 nodes · 5520 edges · 140 communities (118 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8c9a459`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- patients/page.tsx
- middleware/auth.ts
- utils/child.ts
- reports/page.tsx
- POST
- search.ts
- milestone-tracker.tsx
- financial/page.tsx
- schedules/page.tsx
- .forbidden
- button.tsx
- D. Admin
- media/route.ts
- models/index.ts
- dependencies
- footer.tsx
- package.json
- diag-multi-package.js
- Request ke Client — Hearty Bridge (Landing Page)
- lucide-react
- dashboard/page.tsx
- messaging.ts
- mongoose
- collaboration-section.tsx
- measure-db-latency.js
- AssignmentEngine
- validation/auth.ts
- compilerOptions
- Hearty Bridge - Next.js Application
- usePermissions
- Message.ts
- seed-patients.js
- login/route.ts
- audit-log.ts
- types/auth.ts
- cn
- media.ts
- Conversation.ts
- Family.ts
- SearchIndex.ts
- populate-mongodb.js
- dashboard/stats/route.ts
- IMilestoneModel
- contact-section.tsx
- journey-section.tsx
- services-explorer.tsx
- hero-section.tsx
- logActivity
- devDependencies
- Document.ts
- seed-database.js
- react
- invoice-pdf-template.tsx
- weekly-schedule/route.ts
- .notFound
- analytics/page.tsx
- bcryptjs
- document.ts
- landing.ts
- seed-parents-children.js
- jwt.ts
- MediaFile.ts
- populate-simple.js
- reset-staff-accounts.js
- inquiry-panel.tsx
- [id]/page.tsx
- Progress.ts
- cleanup-orphan-packages.js
- consolidate-packages.js
- create-super-admin.js
- diag-get-schedule.js
- diag-session-visibility.js
- fix-missing-sessions.js
- fix-unlinked-slots.js
- seed-packages.js
- health/route.ts
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
- sticky-cta.tsx
- LiveBridge
- api/children/route.ts
- eslint.config.mjs
- postcss.config.mjs
- SuccessResponse
- reports/[id]/pdf/route.ts
- migrate-login-users.js
- ramp
- HBridge - Hearty Bridge Project
- handleValidationError
- heic-convert.d.ts
- notify
- IChildModel
- POST
- connectToDatabase
- check-users.js
- clear-data.js
- delete-patients-and-parents.js
- fix-therapy-type.js
- migrate-to-atlas.js
- BankAccountSettings.ts
- GET
- birthdays/route.ts
- IChild
- IUser
- hearty-bridge/AGENTS.md
- engines
- Landing Page Plan — Hearty Bridge (`/`)
- pad
- graded
- ErrorBoundary
- app/page.tsx
- JourneyPinned

## God Nodes (most connected - your core abstractions)
1. `mongoose` - 121 edges
2. `cn()` - 121 edges
3. `connectToDatabase()` - 109 edges
4. `react` - 92 edges
5. `logActivity()` - 85 edges
6. `lucide-react` - 61 edges
7. `ErrorResponse` - 57 edges
8. `useAuth()` - 54 edges
9. `withErrorHandling()` - 53 edges
10. `SuccessResponse` - 49 edges

## Surprising Connections (you probably didn't know these)
- `2A · Sisa sesi & profil anak` --references--> `ParentMainContent()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/app/dashboard/page.tsx
- `2A · Sisa sesi & profil anak` --references--> `formatChildForResponse()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/lib/utils/child.ts
- `1A · Media: video & pengumuman` --references--> `Lightbox()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/components/ui/lightbox.tsx
- `1B · Data terapis: ulang tahun & status` --references--> `SlotCard()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/app/dashboard/schedules/page.tsx
- `2A · Sisa sesi & profil anak` --references--> `buildTodayAppointments()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/app/api/dashboard/stats/route.ts

## Import Cycles
- None detected.

## Communities (140 total, 22 thin omitted)

### Community 0 - "patients/page.tsx"
Cohesion: 0.07
Nodes (47): Patient, PROGRAM_BADGE, UnifiedPatientsPage(), DeletionRequestItem, DeletionRequestsPage(), fetchRequests(), formatDateTime(), STATUS_LABEL (+39 more)

### Community 1 - "middleware/auth.ts"
Cohesion: 0.12
Nodes (20): bankAccountSchema, bodySchema, AuthenticatedHandler, AuthMiddlewareOptions, getClientIp(), IpRateLimitOptions, ipRateLimitStore, PASSWORD_CHANGE_ALLOWED_PATHS (+12 more)

### Community 2 - "utils/child.ts"
Cohesion: 0.17
Nodes (22): POST, DELETE, GET, PUT, GET, POST, buildChildSearchQuery(), buildChildSortQuery() (+14 more)

### Community 3 - "reports/page.tsx"
Cohesion: 0.07
Nodes (34): EMOJIS, formatSavedAt(), getStatusBadgeVariant(), getStatusLabel(), getTypeColor(), getTypeLabel(), PatientOption, PatientPickerDialog() (+26 more)

### Community 4 - "POST"
Cohesion: 0.67
Nodes (4): DELETE, extractR2Key(), getChildId(), POST

### Community 5 - "search.ts"
Cohesion: 0.11
Nodes (18): AdvancedSearchInput, advancedSearchSchema, BulkIndexOperationInput, bulkIndexOperationSchema, EntitySearchInput, entitySearchSchema, GlobalSearchInput, globalSearchSchema (+10 more)

### Community 6 - "milestone-tracker.tsx"
Cohesion: 0.06
Nodes (34): IMediaFile, MediaGallery(), MediaGalleryProps, categoryColors, IMilestone, MilestoneTracker(), MilestoneTrackerProps, statusColors (+26 more)

### Community 7 - "financial/page.tsx"
Cohesion: 0.12
Nodes (16): downloadBlob(), ExportFormat, formatDate(), formatRupiah(), InvoiceData, STATUS_COLOR, STATUS_LABEL, Summary (+8 more)

### Community 8 - "schedules/page.tsx"
Cohesion: 0.08
Nodes (39): 1B · Data terapis: ulang tahun & status, 2B · Jadwal & drag-drop, File yang disentuh lagi di Step 3, Pembagian file 2A vs 2B, Task 1 · Step 2: Sisa Sesi & Jadwal, addDays(), addWeeks(), AssessmentSlot (+31 more)

### Community 9 - ".forbidden"
Cohesion: 0.12
Nodes (24): GET, todayWIB(), PUT, GET, getInvoiceId(), POST, DELETE, getCommentId() (+16 more)

### Community 10 - "button.tsx"
Cohesion: 0.06
Nodes (45): FamilyTreeVisualizationProps, getRelationshipColor(), IFamily, IFamilyMember, IFamilyTreeNode, MemberDialog(), ChatWindowProps, IConversation (+37 more)

### Community 11 - "D. Admin"
Cohesion: 0.07
Nodes (29): A. Orang Tua, ADM-1 · Pilihan ubah jadwal: minggu ini saja atau semua minggu ✅, ADM-2 · Edit invoice mengikuti jenis layanan/paket ✅, ADM-3 · Hapus akun ortu & anak (lewat persetujuan Super Admin) ✅, ADM-4 · Status terapis: Aktif / Sakit-Izin / Inaktif ✅, ADM-5 · Drag & drop jadwal ke minggu lain ✅, ADM-6 · Nama terapis di profil anak ✅, ADM-7 · Komentar terbaru di atas pada notifikasi lonceng ✅ (+21 more)

### Community 12 - "media/route.ts"
Cohesion: 0.05
Nodes (60): 1A · Media: video & pengumuman, 1C · Label menu, File yang disentuh lagi di step lain, Task 1 · Step 1: Media, Terapis, Label, DELETE, getReportId(), POST, sanitizeFileName() (+52 more)

### Community 13 - "models/index.ts"
Cohesion: 0.07
Nodes (31): AnnouncementAttachmentSchema, AnnouncementSchema, IAnnouncement, IAnnouncementAttachment, AttendanceSchema, IAttendance, IAttendanceModel, hearty_bridge_models_deletionrequest_ideletionrequest (+23 more)

### Community 14 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, class-variance-authority, clsx, ffmpeg-static, heic-convert (+18 more)

### Community 15 - "footer.tsx"
Cohesion: 0.06
Nodes (33): hearty_bridge_app_globals, geistMono, geistSans, jsonLd, localBusinessSchema, metadata, SCHEMA_DAYS, BrandMark() (+25 more)

### Community 16 - "package.json"
Cohesion: 0.08
Nodes (23): name, private, version, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, eslint (+15 more)

### Community 17 - "diag-multi-package.js"
Cohesion: 0.40
Nodes (3): fs, mongoose, path

### Community 18 - "Request ke Client — Hearty Bridge (Landing Page)"
Cohesion: 0.08
Nodes (23): 10. Booking / CTA, 11. Brand & Visual — yang masih kosong, 12. Checklist Asset, 13. Versi Paling Singkat, 1. Informasi Dasar — yang masih kosong, 2. Tentang Terapi & Proses Layanan, 3. Detail per Layanan, 4. Target & Messaging (+15 more)

### Community 19 - "lucide-react"
Cohesion: 0.09
Nodes (24): AbsentEntry, AdminData, AttendancePage(), AttendanceRecord, CheckInResult, ChildAttendanceRecord, ChildAttendanceSection(), formatCheckInTime() (+16 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.06
Nodes (43): AdminMainContent(), AdminStatsCards(), BirthdayItem, ChildInfo, DashboardData, DAY_LABELS, DAY_ORDER, formatRupiah() (+35 more)

### Community 21 - "messaging.ts"
Cohesion: 0.09
Nodes (22): AddParticipantInput, addParticipantSchema, AddReactionInput, addReactionSchema, BulkMessageOperationInput, bulkMessageOperationSchema, ConversationQueryInput, conversationQuerySchema (+14 more)

### Community 22 - "mongoose"
Cohesion: 0.12
Nodes (23): injectSignedUrls(), ALLOWED_EMOJIS, GET, injectSignedUrls(), MongooseCache, withOptionalTransaction(), withAnyAuth(), getR2SignedUrl() (+15 more)

### Community 23 - "collaboration-section.tsx"
Cohesion: 0.15
Nodes (14): AboutSection(), HugMotif(), Reveal(), BridgeOfHands(), COMMUNITY, QuoteRotator(), Reveal(), Reveal() (+6 more)

### Community 24 - "measure-db-latency.js"
Cohesion: 0.60
Nodes (4): main(), mongoose, stats(), time()

### Community 25 - "AssignmentEngine"
Cohesion: 0.13
Nodes (7): ASSIGNMENT_RULES, AssignmentEngine, AssignmentResult, AssignmentRule, AssignmentScore, Patient, Therapist

### Community 26 - "validation/auth.ts"
Cohesion: 0.10
Nodes (18): AccountDeactivationData, accountDeactivationSchema, commonValidations, EmailVerificationData, emailVerificationSchema, LoginFormData, PasswordChangeData, passwordChangeSchema (+10 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 28 - "Hearty Bridge - Next.js Application"
Cohesion: 0.10
Nodes (19): Auth Context (Frontend), Common Commands, Database Connection, Directory Layout, Environment Variables Required, Error Responses, Hearty Bridge - Next.js Application, Important: Next.js Version Notice (+11 more)

### Community 29 - "usePermissions"
Cohesion: 0.07
Nodes (33): BankAccount, formatDate(), formatRupiah(), Invoice, InvoicesPage(), PackageOption, THERAPY_COLOR, THERAPY_LABEL (+25 more)

### Community 30 - "Message.ts"
Cohesion: 0.11
Nodes (7): IMessage, IMessageModel, IMessageReaction, IMessageReadStatus, MessageReactionSchema, MessageReadStatusSchema, MessageSchema

### Community 31 - "seed-patients.js"
Cohesion: 0.12
Nodes (17): bcrypt, BOY_NAMES, DAY_HOURS, DAYS, DIAGNOSES, DOW_MAP, fs, GIRL_NAMES (+9 more)

### Community 32 - "login/route.ts"
Cohesion: 0.10
Nodes (21): accountFailures, DELETE(), GET(), loginRateLimit, PUT(), DELETE(), GET(), PUT() (+13 more)

### Community 33 - "audit-log.ts"
Cohesion: 0.10
Nodes (23): patchSchema, resultSchema, createSchema, ALLOWED, ADMIN_ONLY_TX_FIELDS, LEGACY_TIER_PRICES, updateSchema, packageSchema (+15 more)

### Community 34 - "types/auth.ts"
Cohesion: 0.07
Nodes (25): ALL_ROLES, allowedRolesForPath(), Layout(), Props, ROUTE_PERMISSION_SOURCE, ROUTE_PERMISSIONS, ProtectedRoute(), ProtectedRouteProps (+17 more)

### Community 35 - "cn"
Cohesion: 0.10
Nodes (21): CtaVisual(), WhyCardBody(), AnimatedGradientText(), AnimatedGradientTextProps, AnimatedShinyText(), AnimatedShinyTextProps, DotPattern(), DotPatternProps (+13 more)

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
Cohesion: 0.09
Nodes (35): 2A · Sisa sesi & profil anak, adminStats(), buildAppointments(), buildCompletedCountByPackage(), buildTodayAppointments(), DAY_NAME_BY_UTC_DOW, DAY_ORDER, GET (+27 more)

### Community 42 - "IMilestoneModel"
Cohesion: 0.15
Nodes (3): IMilestone, IMilestoneModel, MilestoneSchema

### Community 43 - "contact-section.tsx"
Cohesion: 0.10
Nodes (22): CLOSED_DAYS, computeStatus(), ContactCard(), ContactCardProps, DAY_NAMES, [emailUser, emailDomain], getMinuteSnapshot(), getServerMinuteSnapshot() (+14 more)

### Community 44 - "journey-section.tsx"
Cohesion: 0.06
Nodes (30): BLOB_TILT, CORAL_BLOOM, DECK, DECK_D, HEART_T, JourneySection(), JourneyStatic(), JourneyStep (+22 more)

### Community 45 - "services-explorer.tsx"
Cohesion: 0.12
Nodes (27): CollaborationSection(), NotSureCallout(), ContactSection(), FaqSection(), HeroSection(), useInquiry(), BUBBLES, EASE_OUT (+19 more)

### Community 46 - "hero-section.tsx"
Cohesion: 0.10
Nodes (21): chipLabel(), ChipTone, FLOATING_CHIPS, FloatingChip, HERO_IMAGE_ALT, HeroVisual(), ParallaxLayerProps, SERVICE_BY_ID (+13 more)

### Community 47 - "logActivity"
Cohesion: 0.14
Nodes (26): POST, DELETE, PATCH, POST, POST, POST, haversineMeters(), POST (+18 more)

### Community 48 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/jsonwebtoken, @types/node, @types/react (+2 more)

### Community 49 - "Document.ts"
Cohesion: 0.20
Nodes (3): DocumentSchema, IDocument, IDocumentModel

### Community 50 - "seed-database.js"
Cohesion: 0.24
Nodes (9): bcrypt, childSchema, connectToDatabase(), main(), mongoose, progressSchema, seedData(), sessionSchema (+1 more)

### Community 51 - "react"
Cohesion: 0.10
Nodes (29): ChangePasswordFormData, ChangePasswordPage(), changePasswordSchema, LoginPage(), AuthGuard(), AuthGuardProps, AnnouncementAttachment, AnnouncementData (+21 more)

### Community 52 - "invoice-pdf-template.tsx"
Cohesion: 0.28
Nodes (8): formatDate(), formatRupiah(), InvoicePdfData, InvoicePdfDocument(), STATUS_LABEL, STATUS_STYLE, styles, THERAPY_LABEL

### Community 53 - "weekly-schedule/route.ts"
Cohesion: 0.11
Nodes (20): updateSchema, createSchema, applyInvoicePackageChange(), hearty_bridge_lib_utils_package_schedule, hearty_bridge_lib_utils_package_schedule_datetodayname, hearty_bridge_lib_utils_package_schedule_day_to_idx, hearty_bridge_lib_utils_package_schedule_nextoccurrenceof, hearty_bridge_lib_utils_package_schedule_regeneratepackageschedule (+12 more)

### Community 54 - ".notFound"
Cohesion: 0.14
Nodes (17): DELETE, getAnnouncementId(), PUT, GET, getChildId(), GET, getInvoiceId(), DELETE (+9 more)

### Community 55 - "analytics/page.tsx"
Cohesion: 0.21
Nodes (9): FinancialOutstanding, FinancialTrendPoint, formatMonth(), formatRupiah(), formatRupiahCompact(), MONTH_LABEL, PatientAnalyticsPage(), TrendPoint (+1 more)

### Community 56 - "bcryptjs"
Cohesion: 0.22
Nodes (5): bcrypt, bcrypt, KNOWN_STAFF, mongoose, bcryptjs

### Community 57 - "document.ts"
Cohesion: 0.12
Nodes (16): BulkDocumentOperationInput, bulkDocumentOperationSchema, CreateDocumentVersionInput, createDocumentVersionSchema, DOCUMENT_CONSTANTS, DOCUMENT_MIME_TYPES, DocumentQueryInput, documentQuerySchema (+8 more)

### Community 58 - "landing.ts"
Cohesion: 0.12
Nodes (19): ROLE_ICONS, TeamRoleId, TeamSection(), InstagramIcon(), FALLBACK_TILE, InstagramFeedSection(), InstagramPostEmbed(), InstagramPostEmbedProps (+11 more)

### Community 59 - "seed-parents-children.js"
Cohesion: 0.25
Nodes (6): bcrypt, childSchema, mongoose, PARENTS_NO_CHILDREN, PARENTS_WITH_CHILDREN, userSchema

### Community 60 - "jwt.ts"
Cohesion: 0.13
Nodes (23): withOptionalAuth(), decodeToken(), extractTokenFromRequest(), generateAccessToken(), generateRefreshToken(), getJWTConfig(), getTokenExpiration(), getUserFromRequest() (+15 more)

### Community 61 - "MediaFile.ts"
Cohesion: 0.29
Nodes (3): IMediaFile, IMediaFileModel, MediaFileSchema

### Community 62 - "populate-simple.js"
Cohesion: 0.29
Nodes (5): Child, childSchema, mongoose, User, userSchema

### Community 63 - "reset-staff-accounts.js"
Cohesion: 0.33
Nodes (6): bcrypt, crypto, mongoose, newStaff, randomPassword(), run()

### Community 64 - "inquiry-panel.tsx"
Cohesion: 0.11
Nodes (21): RFC-6068, buildConsultMessage(), buildPartnerMessage(), ConsultErrors, ConsultValues, EMPTY_CONSULT, EMPTY_PARTNER, findService() (+13 more)

### Community 65 - "[id]/page.tsx"
Cohesion: 0.11
Nodes (13): AvailablePackage, ChildDetail, DAY_LABELS, DAY_ORDER, formatDate(), formatRupiah(), InvoiceRecord, PatientDetailPage() (+5 more)

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

### Community 75 - "health/route.ts"
Cohesion: 0.25
Nodes (4): GET, disconnect(), isConnected(), createHealthCheck()

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

### Community 104 - "sticky-cta.tsx"
Cohesion: 0.16
Nodes (14): InquiryTopic, INQUIRY_PANEL_ID, ASK_SERVICE, CONSULT, EASE, GENERAL, PARTNER, StickyCta() (+6 more)

### Community 106 - "LiveBridge"
Cohesion: 0.25
Nodes (11): deckPath(), deckX(), deckY(), fx(), heartX(), heartY(), hopAt(), LiveBridge() (+3 more)

### Community 107 - "api/children/route.ts"
Cohesion: 0.11
Nodes (18): DELETE(), PATCH(), PUT(), hearty_bridge_lib_utils_financial_query, hearty_bridge_lib_utils_financial_query_escaperegex, AssignTherapistData, assignTherapistSchema, ChildIdParams (+10 more)

### Community 111 - "SuccessResponse"
Cohesion: 0.12
Nodes (20): GET(), resetPasswordSchema, updateUserSchema, createUserSchema, changePasswordSchema, GET(), DELETE(), POST() (+12 more)

### Community 112 - "reports/[id]/pdf/route.ts"
Cohesion: 0.39
Nodes (6): formatDate(), ReportPdfData, ReportPdfDocument(), styles, TYPE_LABELS, @react-pdf/renderer

### Community 113 - "migrate-login-users.js"
Cohesion: 0.11
Nodes (25): fs, mongoose, path, readMongoUriFromEnvLocal(), run(), connect(), fs, list() (+17 more)

### Community 114 - "ramp"
Cohesion: 0.28
Nodes (9): clamp01(), easeInOut(), FinaleLayer(), LivePlank(), ramp(), Rise(), riseRange(), StepLayer() (+1 more)

### Community 115 - "HBridge - Hearty Bridge Project"
Cohesion: 0.25
Nodes (7): Documentation, Environment: WSL2 on Windows, HBridge - Hearty Bridge Project, Main Application, Project Overview, Quick Commands, Repository Structure

### Community 116 - "handleValidationError"
Cohesion: 0.43
Nodes (5): POST, POST, handleError(), handleJWTError(), handleValidationError()

### Community 118 - "notify"
Cohesion: 0.29
Nodes (7): getRequestId(), PATCH, GET, getReportId(), POST, POST, notify()

### Community 120 - "POST"
Cohesion: 0.47
Nodes (6): deduplicateSlots(), GET, getMondayOfWeek(), moveRecurringSeries(), POST, timeToHour()

### Community 121 - "connectToDatabase"
Cohesion: 0.11
Nodes (32): GET, GET, GET, DELETE, GET, getAssessmentId(), PATCH, GET (+24 more)

### Community 127 - "BankAccountSettings.ts"
Cohesion: 0.33
Nodes (5): BankAccountSchema, BankAccountSettingsSchema, IBankAccount, IBankAccountSettings, IBankAccountSettingsModel

### Community 128 - "GET"
Cohesion: 0.67
Nodes (4): countWorkingDays(), currentMonthRange(), GET, todayWIB()

### Community 129 - "birthdays/route.ts"
Cohesion: 0.83
Nodes (3): GET, nextBirthday(), todayWib()

### Community 134 - "Landing Page Plan — Hearty Bridge (`/`)"
Cohesion: 0.25
Nodes (7): 1. Web-business brief (5 questions), 2. Modules picked (and skipped), 3. Page map ← company profile, 4. Visitor scenarios, 5. Images to generate (optional — the page already looks finished without them), 6. Still open with the client (copy is drafted and marked in code), Landing Page Plan — Hearty Bridge (`/`)

### Community 135 - "pad"
Cohesion: 0.33
Nodes (6): Hud(), pad(), StaticStep(), stepImage(), StepRail(), StepVisual()

### Community 136 - "graded"
Cohesion: 0.40
Nodes (5): graded(), heartAt(), interpolate(), lerp(), StageBackdrop()

### Community 138 - "app/page.tsx"
Cohesion: 0.11
Nodes (28): FAQ_JSON_LD, metadata, CONDITION_ICONS, ConditionId, ConditionsSection(), REDUCED_REVEAL, FinalCtaSection(), HEARTS (+20 more)

### Community 139 - "JourneyPinned"
Cohesion: 0.67
Nodes (3): JourneyPinned(), layerAt(), useIsDesktop()

## Knowledge Gaps
- **841 isolated node(s):** `Next.js Version Notice`, `This is NOT the Next.js you know`, `Important: Next.js Version Notice`, `Project Purpose`, `Tech Stack` (+836 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1100 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mongoose` connect `mongoose` to `birthdays/route.ts`, `middleware/auth.ts`, `utils/child.ts`, `media/route.ts`, `models/index.ts`, `package.json`, `diag-multi-package.js`, `dashboard/page.tsx`, `measure-db-latency.js`, `Message.ts`, `seed-patients.js`, `login/route.ts`, `audit-log.ts`, `Conversation.ts`, `Family.ts`, `SearchIndex.ts`, `populate-mongodb.js`, `dashboard/stats/route.ts`, `IMilestoneModel`, `Document.ts`, `seed-database.js`, `weekly-schedule/route.ts`, `bcryptjs`, `seed-parents-children.js`, `MediaFile.ts`, `populate-simple.js`, `reset-staff-accounts.js`, `Progress.ts`, `cleanup-orphan-packages.js`, `consolidate-packages.js`, `create-super-admin.js`, `diag-get-schedule.js`, `diag-session-visibility.js`, `fix-missing-sessions.js`, `fix-unlinked-slots.js`, `seed-packages.js`, `backfill-therapist-colors.js`, `delete-duplicate-slots.js`, `diag-aldi.js`, `diag-aldi-kamis.js`, `diag-aldi-slots-raw.js`, `diag-kevin.js`, `diag-laila-slots.js`, `diag-notype-packages.js`, `diag-packages.js`, `diag-patient.js`, `diag-recent.js`, `diag-recent-tx.js`, `diag-remaining.js`, `diag-session-mismatch.js`, `diag-slots.js`, `fix-admin-password.js`, `fix-aldi-duplicate-slots.js`, `fix-kevin-tw-package-type.js`, `fix-slot-effective-until.js`, `sync-sessions.js`, `test-therapist-data.js`, `api/children/route.ts`, `SuccessResponse`, `reports/[id]/pdf/route.ts`, `migrate-login-users.js`, `check-users.js`, `clear-data.js`, `delete-patients-and-parents.js`, `fix-therapy-type.js`, `migrate-to-atlas.js`, `BankAccountSettings.ts`?**
  _High betweenness centrality (0.358) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `patients/page.tsx`, `reports/page.tsx`, `milestone-tracker.tsx`, `financial/page.tsx`, `schedules/page.tsx`, `button.tsx`, `app/page.tsx`, `media/route.ts`, `footer.tsx`, `package.json`, `lucide-react`, `dashboard/page.tsx`, `collaboration-section.tsx`, `usePermissions`, `types/auth.ts`, `cn`, `contact-section.tsx`, `journey-section.tsx`, `services-explorer.tsx`, `hero-section.tsx`, `analytics/page.tsx`, `landing.ts`, `inquiry-panel.tsx`, `[id]/page.tsx`, `sticky-cta.tsx`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `patients/page.tsx`, `reports/page.tsx`, `milestone-tracker.tsx`, `financial/page.tsx`, `schedules/page.tsx`, `button.tsx`, `app/page.tsx`, `media/route.ts`, `footer.tsx`, `package.json`, `dashboard/page.tsx`, `collaboration-section.tsx`, `usePermissions`, `contact-section.tsx`, `journey-section.tsx`, `services-explorer.tsx`, `hero-section.tsx`, `react`, `analytics/page.tsx`, `landing.ts`, `inquiry-panel.tsx`, `[id]/page.tsx`, `sticky-cta.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **What connects `Next.js Version Notice`, `This is NOT the Next.js you know`, `Important: Next.js Version Notice` to the rest of the system?**
  _841 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `patients/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07188778492109878 - nodes in this community are weakly interconnected._
- **Should `middleware/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Should `reports/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06868686868686869 - nodes in this community are weakly interconnected._
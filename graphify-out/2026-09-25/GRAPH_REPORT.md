# Graph Report - HBridge  (2026-09-25)

## Corpus Check
- 327 files · ~258,117 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .toml 1, .css 1)

## Summary
- 1845 nodes · 4373 edges · 134 communities (111 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47a94b29`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- patients/page.tsx
- error-handler.ts
- children/[id]/route.ts
- reports/page.tsx
- photo/route.ts
- search.ts
- milestone-tracker.tsx
- financial/page.tsx
- schedules/page.tsx
- assessments/[id]/route.ts
- button.tsx
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
- mongoose
- card.tsx
- checkin/route.ts
- AssignmentEngine
- validation/auth.ts
- compilerOptions
- Hearty Bridge - Next.js Application
- analytics/page.tsx
- Message.ts
- seed-patients.js
- jwt.ts
- weekly-schedule/route.ts
- PermissionChecker
- reports/[id]/route.ts
- media.ts
- Conversation.ts
- Family.ts
- SearchIndex.ts
- populate-mongodb.js
- session-balance.ts
- IMilestoneModel
- chat-window.tsx
- invoices/page.tsx
- dashboard-sidebar.tsx
- react
- connectToDatabase
- devDependencies
- Document.ts
- seed-database.js
- auth-context.tsx
- invoice-pdf-template.tsx
- ref_next_server
- users/[id]/route.ts
- compress.ts
- bcryptjs
- document.ts
- Report.ts
- seed-parents-children.js
- .methodNotAllowed
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
- r2-storage.ts
- reset-user-password.js
- dashboard/stats/route.ts
- HBridge - Hearty Bridge Project
- recap/route.ts
- heic-convert.d.ts
- report-media-uploader.tsx
- IChildModel
- reports/[id]/pdf/route.ts
- health/route.ts
- check-users.js
- clear-data.js
- delete-patients-and-parents.js
- fix-therapy-type.js
- migrate-to-atlas.js
- validation/child.ts
- api/children/route.ts
- new/page.tsx
- IChild
- IUser
- lucide-react
- Announcement.ts

## God Nodes (most connected - your core abstractions)
1. `connectToDatabase()` - 129 edges
2. `mongoose` - 113 edges
3. `react` - 78 edges
4. `cn()` - 59 edges
5. `ErrorResponse` - 54 edges
6. `useAuth()` - 52 edges
7. `withErrorHandling()` - 50 edges
8. `lucide-react` - 48 edges
9. `SuccessResponse` - 46 edges
10. `withAnyAuth()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `1B · Data terapis: ulang tahun & status` --references--> `SlotCard()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/app/dashboard/schedules/page.tsx
- `1A · Media: video & pengumuman` --references--> `Lightbox()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/components/ui/lightbox.tsx
- `2A · Sisa sesi & profil anak` --references--> `formatChildForResponse()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/lib/utils/child.ts
- `1A · Media: video & pengumuman` --references--> `compressImage()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/lib/utils/compress.ts
- `2A · Sisa sesi & profil anak` --references--> `buildTodayAppointments()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/app/api/dashboard/stats/route.ts

## Import Cycles
- None detected.

## Communities (134 total, 23 thin omitted)

### Community 0 - "patients/page.tsx"
Cohesion: 0.07
Nodes (44): Patient, PROGRAM_BADGE, DeletionRequestItem, STATUS_LABEL, Tab, EMPTY_FORM, PackageData, THERAPY_COLOR (+36 more)

### Community 1 - "error-handler.ts"
Cohesion: 0.11
Nodes (26): GET, resetPasswordSchema, createUserSchema, POST, GET, todayWIB(), changePasswordSchema, loginRateLimit (+18 more)

### Community 2 - "children/[id]/route.ts"
Cohesion: 0.26
Nodes (13): PUT, calculateAge(), canAccessChild(), canAssignTherapist(), canModifyChild(), formatChildForResponse(), formatChildrenForResponse(), generateChildActivityLog() (+5 more)

### Community 3 - "reports/page.tsx"
Cohesion: 0.06
Nodes (42): EMOJIS, PatientOption, PatientPickerDialog(), Report, ReportComment, ReportMediaFile, ReportReaction, ReportSeenBy (+34 more)

### Community 4 - "photo/route.ts"
Cohesion: 0.60
Nodes (5): ALLOWED, DELETE, extractR2Key(), getChildId(), POST

### Community 5 - "search.ts"
Cohesion: 0.11
Nodes (18): AdvancedSearchInput, advancedSearchSchema, BulkIndexOperationInput, bulkIndexOperationSchema, EntitySearchInput, entitySearchSchema, GlobalSearchInput, globalSearchSchema (+10 more)

### Community 6 - "milestone-tracker.tsx"
Cohesion: 0.06
Nodes (31): IMediaFile, MediaGallery(), MediaGalleryProps, categoryColors, IMilestone, MilestoneTracker(), MilestoneTrackerProps, statusColors (+23 more)

### Community 7 - "financial/page.tsx"
Cohesion: 0.09
Nodes (19): ExportFormat, InvoiceData, STATUS_COLOR, STATUS_LABEL, Summary, Transaction, Patient, TimeSlot (+11 more)

### Community 8 - "schedules/page.tsx"
Cohesion: 0.09
Nodes (37): 1B · Data terapis: ulang tahun & status, 1C · Label menu, File yang disentuh lagi di step lain, Task 1 · Step 1: Media, Terapis, Label, 2B · Jadwal & drag-drop, addDays(), addWeeks(), AssessmentSlot (+29 more)

### Community 9 - "assessments/[id]/route.ts"
Cohesion: 0.25
Nodes (6): patchSchema, resultSchema, AssessmentResultSchema, AssessmentSchema, IAssessment, IAssessmentResult

### Community 10 - "button.tsx"
Cohesion: 0.07
Nodes (29): AvailablePackage, ChildDetail, DAY_LABELS, DAY_ORDER, InvoiceRecord, ProgramBalance, ProgramTherapists, TokenTransaction (+21 more)

### Community 11 - "D. Admin"
Cohesion: 0.07
Nodes (29): A. Orang Tua, ADM-1 · Pilihan ubah jadwal: minggu ini saja atau semua minggu ✅, ADM-2 · Edit invoice mengikuti jenis layanan/paket ✅, ADM-3 · Hapus akun ortu & anak (lewat persetujuan Super Admin) ✅, ADM-4 · Status terapis: Aktif / Sakit-Izin / Inaktif ✅, ADM-5 · Drag & drop jadwal ke minggu lain ✅, ADM-6 · Nama terapis di profil anak ✅, ADM-7 · Komentar terbaru di atas pada notifikasi lonceng ✅ (+21 more)

### Community 12 - "media/route.ts"
Cohesion: 0.19
Nodes (19): DELETE, getReportId(), POST, sanitizeFileName(), sanitizeUploadId(), sanitizeFileName(), storeAnnouncementFile(), StoreAttachmentResult (+11 more)

### Community 13 - "models/index.ts"
Cohesion: 0.10
Nodes (22): AttendanceSchema, IAttendance, IAttendanceModel, BankAccountSchema, BankAccountSettingsSchema, IBankAccount, IBankAccountSettings, IBankAccountSettingsModel (+14 more)

### Community 14 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, class-variance-authority, clsx, ffmpeg-static, fluent-ffmpeg (+22 more)

### Community 15 - "app/layout.tsx"
Cohesion: 0.08
Nodes (19): geistMono, geistSans, localBusinessSchema, metadata, InstagramIcon(), FEATURED_POSTS, InstagramFeedSection(), InstagramPostEmbed() (+11 more)

### Community 16 - "package.json"
Cohesion: 0.08
Nodes (25): name, private, version, class-variance-authority, clsx, eslint, eslint-config-next, @hookform/resolvers (+17 more)

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
Nodes (24): 2A · Sisa sesi & profil anak, File yang disentuh lagi di Step 3, Pembagian file 2A vs 2B, Task 1 · Step 2: Sisa Sesi & Jadwal, ActivityItem, AdminMainContent(), AdminStatsCards(), BirthdayItem (+16 more)

### Community 21 - "messaging.ts"
Cohesion: 0.09
Nodes (22): AddParticipantInput, addParticipantSchema, AddReactionInput, addReactionSchema, BulkMessageOperationInput, bulkMessageOperationSchema, ConversationQueryInput, conversationQuerySchema (+14 more)

### Community 22 - "mongoose"
Cohesion: 0.07
Nodes (45): createSchema, GET, getChildId(), DAY_NAMES, GET, nextBirthday(), todayWib(), getInvoiceId() (+37 more)

### Community 23 - "card.tsx"
Cohesion: 0.13
Nodes (23): BankAccount, EMPTY_FORM, features, services, AboutSection(), ContactSection(), ServicesSection(), PageCta() (+15 more)

### Community 24 - "checkin/route.ts"
Cohesion: 0.83
Nodes (3): haversineMeters(), POST, toWIBISOString()

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
Cohesion: 0.10
Nodes (28): DELETE(), GET(), POST, PUT(), withOptionalAuth(), clearAuthCookies(), decodeToken(), extractTokenFromRequest() (+20 more)

### Community 33 - "weekly-schedule/route.ts"
Cohesion: 0.12
Nodes (22): getInvoiceId(), InvoiceGoneError, PATCH, deduplicateSlots(), GET, getMondayOfWeek(), moveRecurringSeries(), POST (+14 more)

### Community 35 - "reports/[id]/route.ts"
Cohesion: 0.26
Nodes (11): DELETE, GET, getReportId(), PUT, GET, injectSignedUrls(), POST, notify() (+3 more)

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

### Community 41 - "session-balance.ts"
Cohesion: 0.13
Nodes (20): GET, ChildSessionBalance, computePackageRemaining(), emptySessionBalance(), getSessionBalances(), getTherapistsByProgram(), InvoiceLean, Oid (+12 more)

### Community 42 - "IMilestoneModel"
Cohesion: 0.15
Nodes (3): IMilestone, IMilestoneModel, MilestoneSchema

### Community 43 - "chat-window.tsx"
Cohesion: 0.08
Nodes (20): DocumentUploadDialogProps, IDocument, ChatWindowProps, IConversation, IMessage, IUser, GlobalSearchBarProps, GlobalSearchQuery (+12 more)

### Community 44 - "invoices/page.tsx"
Cohesion: 0.22
Nodes (8): BankAccount, formatDate(), formatRupiah(), Invoice, InvoicesPage(), PackageOption, THERAPY_COLOR, THERAPY_LABEL

### Community 45 - "dashboard-sidebar.tsx"
Cohesion: 0.27
Nodes (8): DashboardSidebar(), DashboardSidebarProps, iconMap, NotificationBell(), NotificationItem, timeAgo(), fetchWithTimeout(), ref_next_image

### Community 46 - "react"
Cohesion: 0.14
Nodes (15): ChangePasswordFormData, changePasswordSchema, AuthGuard(), AuthGuardProps, navigation, BorderBeam(), BorderBeamProps, ShimmerButton (+7 more)

### Community 47 - "connectToDatabase"
Cohesion: 0.10
Nodes (62): POST, DELETE, PATCH, GET, DELETE, getAnnouncementId(), PUT, GET (+54 more)

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
Cohesion: 0.11
Nodes (23): ALL_ROLES, allowedRolesForPath(), Layout(), Props, ROUTE_PERMISSION_SOURCE, ROUTE_PERMISSIONS, ProtectedRoute(), ProtectedRouteProps (+15 more)

### Community 52 - "invoice-pdf-template.tsx"
Cohesion: 0.28
Nodes (8): formatDate(), formatRupiah(), InvoicePdfData, InvoicePdfDocument(), STATUS_LABEL, STATUS_STYLE, styles, THERAPY_LABEL

### Community 53 - "ref_next_server"
Cohesion: 0.15
Nodes (17): getSessionId(), PATCH, getLeaveId(), PATCH, updateSchema, createSchema, GET, getInactiveTherapistError() (+9 more)

### Community 54 - "users/[id]/route.ts"
Cohesion: 0.43
Nodes (4): updateUserSchema, deactivateChildren(), deleteChildAccount(), deleteParentAccount()

### Community 55 - "compress.ts"
Cohesion: 0.13
Nodes (16): CompressResult, heicToJpeg(), loadFfmpeg(), loadSharp(), resolveFfmpegPath(), verifyFfmpegRuns(), generateTempPassword(), pick() (+8 more)

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

### Community 60 - ".methodNotAllowed"
Cohesion: 0.12
Nodes (16): GET(), GET(), DELETE(), GET(), PUT(), DELETE(), POST(), DELETE() (+8 more)

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
Cohesion: 0.08
Nodes (31): ChangePasswordPage(), LoginPage(), UnifiedDashboard(), formatDate(), formatRupiah(), PatientDetailPage(), UnifiedPatientsPage(), EditReportPage() (+23 more)

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

### Community 112 - "r2-storage.ts"
Cohesion: 0.19
Nodes (14): 1A · Media: video & pengumuman, injectSignedUrls(), createR2Client(), deleteFromR2(), existsInR2(), getR2SignedUrl(), uploadToR2(), queue (+6 more)

### Community 113 - "reset-user-password.js"
Cohesion: 0.31
Nodes (8): bcrypt, fs, generateTempPassword(), mongoose, path, pick(), readMongoUri(), run()

### Community 114 - "dashboard/stats/route.ts"
Cohesion: 0.28
Nodes (15): adminStats(), buildAppointments(), buildCompletedCountByPackage(), buildTodayAppointments(), DAY_NAME_BY_UTC_DOW, DAY_ORDER, GET, getDateRanges() (+7 more)

### Community 115 - "HBridge - Hearty Bridge Project"
Cohesion: 0.25
Nodes (7): Documentation, Environment: WSL2 on Windows, HBridge - Hearty Bridge Project, Main Application, Project Overview, Quick Commands, Repository Structure

### Community 116 - "recap/route.ts"
Cohesion: 0.80
Nodes (4): countWorkingDays(), currentMonthRange(), GET, todayWIB()

### Community 118 - "report-media-uploader.tsx"
Cohesion: 0.18
Nodes (12): fromServer(), getToken(), ItemStatus, MediaItem, newUploadId(), ReportMediaField(), ReportMediaUploader, ServerMediaFile (+4 more)

### Community 120 - "reports/[id]/pdf/route.ts"
Cohesion: 0.31
Nodes (9): GET, getReportId(), toPngDataUri(), formatDate(), ReportPdfData, ReportPdfDocument(), styles, TYPE_LABELS (+1 more)

### Community 121 - "health/route.ts"
Cohesion: 0.25
Nodes (4): GET, disconnect(), isConnected(), createHealthCheck()

### Community 127 - "validation/child.ts"
Cohesion: 0.17
Nodes (11): AssignTherapistData, assignTherapistSchema, ChildIdParams, childIdSchema, ChildQueryParams, childRateLimitSchemas, childSanitizers, childValidations (+3 more)

### Community 128 - "api/children/route.ts"
Cohesion: 0.27
Nodes (9): DELETE(), GET, PATCH(), PUT(), buildChildSearchQuery(), buildChildSortQuery(), calculatePagination(), childQuerySchema (+1 more)

### Community 129 - "new/page.tsx"
Cohesion: 0.27
Nodes (7): ChildOption, EMPTY_FORM, formatDisplayDate(), FormState, NewReportPage(), ReportDraftData, useReportDraft()

### Community 132 - "lucide-react"
Cohesion: 0.29
Nodes (4): formatSize(), Lightbox(), LightboxItem, lucide-react

### Community 133 - "Announcement.ts"
Cohesion: 0.40
Nodes (4): AnnouncementAttachmentSchema, AnnouncementSchema, IAnnouncement, IAnnouncementAttachment

## Knowledge Gaps
- **742 isolated node(s):** `AbsentEntry`, `AdminData`, `RecapRow`, `RecapData`, `CheckInResult` (+737 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 966 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mongoose` connect `mongoose` to `api/children/route.ts`, `error-handler.ts`, `children/[id]/route.ts`, `photo/route.ts`, `Announcement.ts`, `assessments/[id]/route.ts`, `media/route.ts`, `models/index.ts`, `package.json`, `diag-multi-package.js`, `checkin/route.ts`, `Message.ts`, `seed-patients.js`, `weekly-schedule/route.ts`, `reports/[id]/route.ts`, `Conversation.ts`, `Family.ts`, `SearchIndex.ts`, `populate-mongodb.js`, `session-balance.ts`, `IMilestoneModel`, `connectToDatabase`, `Document.ts`, `seed-database.js`, `ref_next_server`, `users/[id]/route.ts`, `bcryptjs`, `Report.ts`, `seed-parents-children.js`, `MediaFile.ts`, `populate-simple.js`, `reset-staff-accounts.js`, `Progress.ts`, `cleanup-orphan-packages.js`, `consolidate-packages.js`, `create-super-admin.js`, `diag-get-schedule.js`, `diag-session-visibility.js`, `fix-missing-sessions.js`, `fix-unlinked-slots.js`, `seed-packages.js`, `backfill-therapist-colors.js`, `delete-duplicate-slots.js`, `diag-aldi.js`, `diag-aldi-kamis.js`, `diag-aldi-slots-raw.js`, `diag-kevin.js`, `diag-laila-slots.js`, `diag-notype-packages.js`, `diag-packages.js`, `diag-patient.js`, `diag-recent.js`, `diag-recent-tx.js`, `diag-remaining.js`, `diag-session-mismatch.js`, `diag-slots.js`, `fix-admin-password.js`, `fix-aldi-duplicate-slots.js`, `fix-kevin-tw-package-type.js`, `fix-slot-effective-until.js`, `sync-sessions.js`, `test-therapist-data.js`, `migrate-leave-cuti-to-sakit-izin.js`, `reset-user-password.js`, `dashboard/stats/route.ts`, `reports/[id]/pdf/route.ts`, `check-users.js`, `clear-data.js`, `delete-patients-and-parents.js`, `fix-therapy-type.js`, `migrate-to-atlas.js`?**
  _High betweenness centrality (0.334) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `patients/page.tsx`, `new/page.tsx`, `reports/page.tsx`, `lucide-react`, `milestone-tracker.tsx`, `financial/page.tsx`, `schedules/page.tsx`, `button.tsx`, `app/layout.tsx`, `package.json`, `attendance/page.tsx`, `dashboard/page.tsx`, `card.tsx`, `analytics/page.tsx`, `chat-window.tsx`, `invoices/page.tsx`, `dashboard-sidebar.tsx`, `auth-context.tsx`, `useAuth`, `report-media-uploader.tsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `zod` connect `error-handler.ts` to `media.ts`, `search.ts`, `assessments/[id]/route.ts`, `family.ts`, `react`, `package.json`, `auth-context.tsx`, `ref_next_server`, `users/[id]/route.ts`, `mongoose`, `messaging.ts`, `document.ts`, `validation/auth.ts`, `validation/child.ts`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **What connects `AbsentEntry`, `AdminData`, `RecapRow` to the rest of the system?**
  _742 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `patients/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07138535995160314 - nodes in this community are weakly interconnected._
- **Should `error-handler.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11184939091915837 - nodes in this community are weakly interconnected._
- **Should `reports/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.060451977401129946 - nodes in this community are weakly interconnected._
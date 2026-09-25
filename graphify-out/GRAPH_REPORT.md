# Graph Report - HBridge  (2026-09-25)

## Corpus Check
- 326 files · ~256,509 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .toml 1, .css 1)

## Summary
- 1785 nodes · 4166 edges · 124 communities (104 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c0b41fe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- button.tsx
- tokens/route.ts
- api/children/route.ts
- cn
- .ok
- search.ts
- milestone-tracker.tsx
- r2-storage.ts
- schedules/page.tsx
- connectToDatabase
- reports/page.tsx
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
- [id]/page.tsx
- AssignmentEngine
- validation/auth.ts
- compilerOptions
- Hearty Bridge - Next.js Application
- patients/page.tsx
- Message.ts
- seed-patients.js
- SuccessResponse
- jwt.ts
- PermissionChecker
- mongoose
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
- report-media-uploader.tsx
- therapist-leaves/route.ts
- devDependencies
- Document.ts
- seed-database.js
- dashboard/layout.tsx
- invoice-pdf-template.tsx
- dashboard-sidebar.tsx
- video-transcode.ts
- compress.ts
- bcryptjs
- document.ts
- Report.ts
- seed-parents-children.js
- announcements/[id]/route.ts
- MediaFile.ts
- populate-simple.js
- reset-staff-accounts.js
- reports/[id]/route.ts
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
- migrate-leave-cuti-to-sakit-izin.js
- financial/page.tsx
- reset-user-password.js
- [id]/assessments/route.ts
- HBridge - Hearty Bridge Project
- Announcement.ts
- heic-convert.d.ts
- IChildModel
- check-users.js
- clear-data.js
- delete-patients-and-parents.js
- fix-therapy-type.js
- migrate-to-atlas.js

## God Nodes (most connected - your core abstractions)
1. `connectToDatabase()` - 129 edges
2. `mongoose` - 108 edges
3. `react` - 75 edges
4. `cn()` - 59 edges
5. `ErrorResponse` - 54 edges
6. `withErrorHandling()` - 50 edges
7. `useAuth()` - 50 edges
8. `SuccessResponse` - 46 edges
9. `lucide-react` - 45 edges
10. `withAnyAuth()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `1A · Media: video & pengumuman` --references--> `compressImage()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/lib/utils/compress.ts
- `1A · Media: video & pengumuman` --references--> `Lightbox()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/components/ui/lightbox.tsx
- `1A · Media: video & pengumuman` --references--> `compressVideo()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/lib/utils/compress.ts
- `1B · Data terapis: ulang tahun & status` --references--> `SlotCard()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/app/dashboard/schedules/page.tsx
- `API Route Pattern` --references--> `withAnyAuth()`  [INFERRED]
  hearty-bridge/CLAUDE.md → hearty-bridge/lib/middleware/auth.ts

## Import Cycles
- None detected.

## Communities (124 total, 20 thin omitted)

### Community 0 - "button.tsx"
Cohesion: 0.05
Nodes (53): EMPTY_FORM, formatRupiah(), PackageData, SuperAdminPackagesPage(), THERAPY_COLOR, THERAPY_LABEL, ResetPasswordDialogProps, AnnouncementAttachment (+45 more)

### Community 1 - "tokens/route.ts"
Cohesion: 0.11
Nodes (19): DAY_NAMES, GET, GET, getChildId(), POST, GET, PACKAGE_PRICES, GET (+11 more)

### Community 2 - "api/children/route.ts"
Cohesion: 0.05
Nodes (53): GET(), GET(), DELETE(), GET(), PUT(), DELETE(), GET(), PUT() (+45 more)

### Community 3 - "cn"
Cohesion: 0.08
Nodes (33): ChildProfileLayoutProps, IChild, AnimatedShinyText(), AnimatedShinyTextProps, DotPattern(), DotPatternProps, MagicCard(), MagicCardProps (+25 more)

### Community 4 - ".ok"
Cohesion: 0.09
Nodes (42): DELETE, PATCH, updateUserSchema, POST, DELETE, GET, getAssessmentId(), PATCH (+34 more)

### Community 5 - "search.ts"
Cohesion: 0.11
Nodes (18): AdvancedSearchInput, advancedSearchSchema, BulkIndexOperationInput, bulkIndexOperationSchema, EntitySearchInput, entitySearchSchema, GlobalSearchInput, globalSearchSchema (+10 more)

### Community 6 - "milestone-tracker.tsx"
Cohesion: 0.05
Nodes (41): IMediaFile, MediaGallery(), MediaGalleryProps, categoryColors, IMilestone, MilestoneTracker(), MilestoneTrackerProps, statusColors (+33 more)

### Community 7 - "r2-storage.ts"
Cohesion: 0.35
Nodes (10): ALLOWED, DELETE, extractR2Key(), getChildId(), POST, createR2Client(), deleteFromR2(), existsInR2() (+2 more)

### Community 8 - "schedules/page.tsx"
Cohesion: 0.09
Nodes (36): 1B · Data terapis: ulang tahun & status, ActivePackageInfo, addDays(), addWeeks(), AssessmentSlot, dateStrToDayName(), dateUTCStr(), Day (+28 more)

### Community 9 - "connectToDatabase"
Cohesion: 0.09
Nodes (37): createSchema, GET, haversineMeters(), POST, toWIBISOString(), GET, GET, todayWIB() (+29 more)

### Community 10 - "reports/page.tsx"
Cohesion: 0.13
Nodes (17): EMOJIS, formatSavedAt(), getStatusBadgeVariant(), getStatusLabel(), getTypeColor(), getTypeLabel(), PatientOption, PatientPickerDialog() (+9 more)

### Community 11 - "D. Admin"
Cohesion: 0.07
Nodes (29): A. Orang Tua, ADM-1 · Pilihan ubah jadwal: minggu ini saja atau semua minggu ✅, ADM-2 · Edit invoice mengikuti jenis layanan/paket ✅, ADM-3 · Hapus akun ortu & anak (lewat persetujuan Super Admin) ✅, ADM-4 · Status terapis: Aktif / Sakit-Izin / Inaktif ✅, ADM-5 · Drag & drop jadwal ke minggu lain ✅, ADM-6 · Nama terapis di profil anak ✅, ADM-7 · Komentar terbaru di atas pada notifikasi lonceng ✅ (+21 more)

### Community 12 - "media/route.ts"
Cohesion: 0.19
Nodes (19): DELETE, getReportId(), POST, sanitizeFileName(), sanitizeUploadId(), sanitizeFileName(), storeAnnouncementFile(), StoreAttachmentResult (+11 more)

### Community 13 - "models/index.ts"
Cohesion: 0.09
Nodes (24): AttendanceSchema, IAttendance, IAttendanceModel, BankAccountSchema, BankAccountSettingsSchema, IBankAccount, IBankAccountSettings, IBankAccountSettingsModel (+16 more)

### Community 14 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, class-variance-authority, clsx, ffmpeg-static, fluent-ffmpeg (+22 more)

### Community 15 - "app/layout.tsx"
Cohesion: 0.08
Nodes (19): geistMono, geistSans, localBusinessSchema, metadata, InstagramIcon(), FEATURED_POSTS, InstagramFeedSection(), InstagramPostEmbed() (+11 more)

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
Cohesion: 0.08
Nodes (23): ActivityItem, AdminMainContent(), AdminStatsCards(), BirthdayItem, ChildInfo, DashboardData, DAY_LABELS, DAY_ORDER (+15 more)

### Community 21 - "messaging.ts"
Cohesion: 0.09
Nodes (22): AddParticipantInput, addParticipantSchema, AddReactionInput, addReactionSchema, BulkMessageOperationInput, bulkMessageOperationSchema, ConversationQueryInput, conversationQuerySchema (+14 more)

### Community 22 - "middleware/auth.ts"
Cohesion: 0.15
Nodes (17): countWorkingDays(), currentMonthRange(), GET, todayWIB(), AuthenticatedHandler, getClientIp(), IpRateLimitOptions, ipRateLimitStore (+9 more)

### Community 23 - "react"
Cohesion: 0.09
Nodes (33): ChangePasswordFormData, ChangePasswordPage(), changePasswordSchema, LoginPage(), features, services, AuthGuard(), AuthGuardProps (+25 more)

### Community 24 - "[id]/page.tsx"
Cohesion: 0.17
Nodes (13): AvailablePackage, ChildDetail, DAY_LABELS, DAY_ORDER, formatDate(), formatRupiah(), InvoiceRecord, PatientDetailPage() (+5 more)

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

### Community 29 - "patients/page.tsx"
Cohesion: 0.06
Nodes (51): Patient, UnifiedPatientsPage(), ChildOption, EditReportPage(), formatSavedAt(), FormState, ChildOption, EMPTY_FORM (+43 more)

### Community 30 - "Message.ts"
Cohesion: 0.11
Nodes (7): IMessage, IMessageModel, IMessageReaction, IMessageReadStatus, MessageReactionSchema, MessageReadStatusSchema, MessageSchema

### Community 31 - "seed-patients.js"
Cohesion: 0.12
Nodes (17): bcrypt, BOY_NAMES, DAY_HOURS, DAYS, DIAGNOSES, DOW_MAP, fs, GIRL_NAMES (+9 more)

### Community 32 - "SuccessResponse"
Cohesion: 0.10
Nodes (27): GET, POST, resetPasswordSchema, createUserSchema, GET, POST, changePasswordSchema, POST (+19 more)

### Community 33 - "jwt.ts"
Cohesion: 0.12
Nodes (24): disconnect(), withOptionalAuth(), decodeToken(), extractTokenFromRequest(), generateAccessToken(), generateRefreshToken(), getJWTConfig(), getTokenExpiration() (+16 more)

### Community 34 - "PermissionChecker"
Cohesion: 0.14
Nodes (5): 1C · Label menu, File yang disentuh lagi di step lain, Task 1 · Step 1: Media, Terapis, Label, PermissionChecker, withPermissions()

### Community 35 - "mongoose"
Cohesion: 0.13
Nodes (17): GET, getInvoiceId(), DELETE, GET, getInvoiceId(), PATCH, GET, injectSignedUrls() (+9 more)

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
Cohesion: 0.30
Nodes (11): dateToDayName(), DAY_NAMES, DAY_TO_IDX, deduplicateSlots(), DELETE, GET, getMondayOfWeek(), nextOccurrenceOf() (+3 more)

### Community 44 - "invoices/page.tsx"
Cohesion: 0.20
Nodes (9): BankAccount, formatDate(), formatRupiah(), Invoice, InvoicesPage(), PACKAGE_COLOR, PACKAGE_LABEL, THERAPY_COLOR (+1 more)

### Community 45 - "auth-context.tsx"
Cohesion: 0.24
Nodes (10): AuthContext, AuthProviderProps, AuthContextType, AuthResponse, LoginFormData, loginSchema, NavigationItem, RegisterFormData (+2 more)

### Community 46 - "report-media-uploader.tsx"
Cohesion: 0.20
Nodes (11): fromServer(), getToken(), ItemStatus, MediaItem, newUploadId(), ReportMediaUploader, ServerMediaFile, UploadJob (+3 more)

### Community 47 - "therapist-leaves/route.ts"
Cohesion: 0.24
Nodes (11): DELETE, getLeaveId(), PATCH, updateSchema, createSchema, GET, getLeaveScheduleWarning(), LEAVE_TYPE_LABELS (+3 more)

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
Cohesion: 0.15
Nodes (14): formatDate(), formatRupiah(), InvoicePdfData, InvoicePdfDocument(), STATUS_LABEL, STATUS_STYLE, styles, THERAPY_LABEL (+6 more)

### Community 53 - "dashboard-sidebar.tsx"
Cohesion: 0.24
Nodes (9): DashboardSidebar(), DashboardSidebarProps, iconMap, NotificationBell(), NotificationItem, timeAgo(), fetchWithTimeout(), ref_next_image (+1 more)

### Community 54 - "video-transcode.ts"
Cohesion: 0.28
Nodes (8): 1A · Media: video & pengumuman, formatSize(), Lightbox(), queue, transcode(), TranscodedVideo, transcodeVideoInBackground(), compressVideo()

### Community 55 - "compress.ts"
Cohesion: 0.10
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

### Community 60 - "announcements/[id]/route.ts"
Cohesion: 0.31
Nodes (7): DELETE, getAnnouncementId(), PUT, GET, injectSignedUrls(), hearty_bridge_models_index_announcement, hearty_bridge_models_index_iannouncementattachment

### Community 61 - "MediaFile.ts"
Cohesion: 0.29
Nodes (3): IMediaFile, IMediaFileModel, MediaFileSchema

### Community 62 - "populate-simple.js"
Cohesion: 0.29
Nodes (5): Child, childSchema, mongoose, User, userSchema

### Community 63 - "reset-staff-accounts.js"
Cohesion: 0.33
Nodes (6): bcrypt, crypto, mongoose, newStaff, randomPassword(), run()

### Community 64 - "reports/[id]/route.ts"
Cohesion: 0.54
Nodes (6): DELETE, GET, getReportId(), PUT, canActOnOwnRecord(), canAccessReport()

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

### Community 111 - "migrate-leave-cuti-to-sakit-izin.js"
Cohesion: 0.29
Nodes (7): fs, mongoose, path, readMongoUriFromEnvLocal(), run(), ref_fs, ref_path

### Community 112 - "financial/page.tsx"
Cohesion: 0.22
Nodes (8): formatDate(), formatRupiah(), InvoiceData, STATUS_COLOR, STATUS_LABEL, Summary, SuperAdminFinancialPage(), Transaction

### Community 113 - "reset-user-password.js"
Cohesion: 0.31
Nodes (8): bcrypt, fs, generateTempPassword(), mongoose, path, pick(), readMongoUri(), run()

### Community 114 - "[id]/assessments/route.ts"
Cohesion: 0.29
Nodes (6): GET, getChildId(), AssessmentResultSchema, AssessmentSchema, IAssessment, IAssessmentResult

### Community 115 - "HBridge - Hearty Bridge Project"
Cohesion: 0.25
Nodes (7): Documentation, Environment: WSL2 on Windows, HBridge - Hearty Bridge Project, Main Application, Project Overview, Quick Commands, Repository Structure

### Community 116 - "Announcement.ts"
Cohesion: 0.40
Nodes (4): AnnouncementAttachmentSchema, AnnouncementSchema, IAnnouncement, IAnnouncementAttachment

## Knowledge Gaps
- **726 isolated node(s):** `ORT-1 · Sisa terapi per program di dashboard ✅`, `ORT-2 · Nama terapi di jadwal hari ini & mendatang ✅`, `ORT-3 · Sesi minus untuk kasbon / utang paket ✅`, `ORT-4 · Foto di pengumuman tidak bisa diperbesar ✅`, `ORT-5 · Jam janji temu tidak bisa di-scroll di HP ✅` (+721 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 948 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mongoose` connect `mongoose` to `tokens/route.ts`, `api/children/route.ts`, `.ok`, `r2-storage.ts`, `connectToDatabase`, `media/route.ts`, `models/index.ts`, `package.json`, `diag-multi-package.js`, `Message.ts`, `seed-patients.js`, `SuccessResponse`, `Conversation.ts`, `Family.ts`, `SearchIndex.ts`, `populate-mongodb.js`, `dashboard/stats/route.ts`, `IMilestoneModel`, `weekly-schedule/route.ts`, `therapist-leaves/route.ts`, `Document.ts`, `seed-database.js`, `bcryptjs`, `Report.ts`, `seed-parents-children.js`, `announcements/[id]/route.ts`, `MediaFile.ts`, `populate-simple.js`, `reset-staff-accounts.js`, `reports/[id]/route.ts`, `Progress.ts`, `cleanup-orphan-packages.js`, `consolidate-packages.js`, `create-super-admin.js`, `diag-get-schedule.js`, `diag-session-visibility.js`, `fix-missing-sessions.js`, `fix-unlinked-slots.js`, `seed-packages.js`, `backfill-therapist-colors.js`, `delete-duplicate-slots.js`, `diag-aldi.js`, `diag-aldi-kamis.js`, `diag-aldi-slots-raw.js`, `diag-kevin.js`, `diag-laila-slots.js`, `diag-notype-packages.js`, `diag-packages.js`, `diag-patient.js`, `diag-recent.js`, `diag-recent-tx.js`, `diag-remaining.js`, `diag-session-mismatch.js`, `diag-slots.js`, `fix-admin-password.js`, `fix-aldi-duplicate-slots.js`, `fix-kevin-tw-package-type.js`, `fix-slot-effective-until.js`, `sync-sessions.js`, `test-therapist-data.js`, `migrate-leave-cuti-to-sakit-izin.js`, `reset-user-password.js`, `[id]/assessments/route.ts`, `Announcement.ts`, `check-users.js`, `clear-data.js`, `delete-patients-and-parents.js`, `fix-therapy-type.js`, `migrate-to-atlas.js`?**
  _High betweenness centrality (0.328) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `button.tsx`, `useConversations.ts`, `cn`, `milestone-tracker.tsx`, `schedules/page.tsx`, `reports/page.tsx`, `invoices/page.tsx`, `auth-context.tsx`, `report-media-uploader.tsx`, `app/layout.tsx`, `financial/page.tsx`, `package.json`, `dashboard/layout.tsx`, `attendance/page.tsx`, `dashboard/page.tsx`, `dashboard-sidebar.tsx`, `[id]/page.tsx`, `patients/page.tsx`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `zod` connect `connectToDatabase` to `SuccessResponse`, `api/children/route.ts`, `.ok`, `media.ts`, `search.ts`, `family.ts`, `auth-context.tsx`, `therapist-leaves/route.ts`, `package.json`, `messaging.ts`, `react`, `document.ts`, `validation/auth.ts`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **What connects `ORT-1 · Sisa terapi per program di dashboard ✅`, `ORT-2 · Nama terapi di jadwal hari ini & mendatang ✅`, `ORT-3 · Sesi minus untuk kasbon / utang paket ✅` to the rest of the system?**
  _726 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.053208137715179966 - nodes in this community are weakly interconnected._
- **Should `tokens/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10826210826210826 - nodes in this community are weakly interconnected._
- **Should `api/children/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052214452214452214 - nodes in this community are weakly interconnected._
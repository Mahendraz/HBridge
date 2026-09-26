# Graph Report - HBridge  (2026-09-26)

## Corpus Check
- 350 files · ~283,529 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 5, .toml 1, .css 1)

## Summary
- 2132 nodes · 5136 edges · 140 communities (119 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72e40145`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- patients/page.tsx
- middleware/auth.ts
- api/children/route.ts
- reports/page.tsx
- r2-storage.ts
- search.ts
- document-upload-dialog.tsx
- financial/page.tsx
- schedules/page.tsx
- assessments/[id]/route.ts
- react
- D. Admin
- announcement-media.ts
- models/index.ts
- dependencies
- landing.ts
- package.json
- diag-multi-package.js
- Request ke Client — Hearty Bridge (Landing Page)
- attendance/page.tsx
- dashboard/page.tsx
- messaging.ts
- mongoose
- cn
- dashboard/stats/route.ts
- AssignmentEngine
- validation/auth.ts
- compilerOptions
- Hearty Bridge - Next.js Application
- usePermissions
- Message.ts
- seed-patients.js
- jwt.ts
- weekly-schedule/route.ts
- PermissionChecker
- why-section.tsx
- media.ts
- Conversation.ts
- Family.ts
- SearchIndex.ts
- populate-mongodb.js
- session-balance.ts
- IMilestoneModel
- contact-section.tsx
- journey-section.tsx
- services-explorer.tsx
- hero-section.tsx
- connectToDatabase
- devDependencies
- Document.ts
- seed-database.js
- useAuth
- invoice-pdf-template.tsx
- therapist-leaves/route.ts
- children/[id]/route.ts
- compress.ts
- bcryptjs
- document.ts
- app/page.tsx
- seed-parents-children.js
- .methodNotAllowed
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
- sticky-cta.tsx
- LiveBridge
- getUserFromRequest
- eslint.config.mjs
- postcss.config.mjs
- migrate-leave-cuti-to-sakit-izin.js
- login/route.ts
- reset-user-password.js
- ramp
- HBridge - Hearty Bridge Project
- recap/route.ts
- heic-convert.d.ts
- Report.ts
- IChildModel
- reports/[id]/pdf/route.ts
- health/route.ts
- check-users.js
- clear-data.js
- delete-patients-and-parents.js
- fix-therapy-type.js
- migrate-to-atlas.js
- validation/child.ts
- Task 1 · Step 1: Media, Terapis, Label
- new/page.tsx
- IChild
- IUser
- lucide-react
- disconnect
- Landing Page Plan — Hearty Bridge (`/`)
- pad
- graded
- ErrorBoundary
- next.config.ts
- JourneyPinned

## God Nodes (most connected - your core abstractions)
1. `connectToDatabase()` - 127 edges
2. `cn()` - 121 edges
3. `mongoose` - 113 edges
4. `react` - 91 edges
5. `lucide-react` - 59 edges
6. `ErrorResponse` - 54 edges
7. `useAuth()` - 52 edges
8. `withErrorHandling()` - 50 edges
9. `SuccessResponse` - 46 edges
10. `withAnyAuth()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `1A · Media: video & pengumuman` --references--> `compressVideo()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/lib/utils/compress.ts
- `1A · Media: video & pengumuman` --references--> `compressImage()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/lib/utils/compress.ts
- `1A · Media: video & pengumuman` --references--> `Lightbox()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/components/ui/lightbox.tsx
- `2A · Sisa sesi & profil anak` --references--> `ParentMainContent()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/app/dashboard/page.tsx
- `2A · Sisa sesi & profil anak` --references--> `formatChildForResponse()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/lib/utils/child.ts

## Import Cycles
- None detected.

## Communities (140 total, 21 thin omitted)

### Community 0 - "patients/page.tsx"
Cohesion: 0.08
Nodes (39): Patient, PROGRAM_BADGE, UnifiedPatientsPage(), LeaveRecord, STATUS_OPTIONS, StatusOption, Therapist, TherapistsPage() (+31 more)

### Community 1 - "middleware/auth.ts"
Cohesion: 0.07
Nodes (36): resetPasswordSchema, updateUserSchema, createUserSchema, POST, createSchema, GET, changePasswordSchema, bankAccountSchema (+28 more)

### Community 2 - "api/children/route.ts"
Cohesion: 0.23
Nodes (14): GET, buildChildSearchQuery(), buildChildSortQuery(), calculateAge(), calculatePagination(), canAccessChild(), canAssignTherapist(), canModifyChild() (+6 more)

### Community 3 - "reports/page.tsx"
Cohesion: 0.08
Nodes (30): EMOJIS, formatSavedAt(), getStatusBadgeVariant(), getStatusLabel(), getTypeColor(), getTypeLabel(), PatientOption, PatientPickerDialog() (+22 more)

### Community 4 - "r2-storage.ts"
Cohesion: 0.17
Nodes (18): GET, injectSignedUrls(), ALLOWED, DELETE, extractR2Key(), getChildId(), POST, GET (+10 more)

### Community 5 - "search.ts"
Cohesion: 0.11
Nodes (18): AdvancedSearchInput, advancedSearchSchema, BulkIndexOperationInput, bulkIndexOperationSchema, EntitySearchInput, entitySearchSchema, GlobalSearchInput, globalSearchSchema (+10 more)

### Community 6 - "document-upload-dialog.tsx"
Cohesion: 0.12
Nodes (15): MediaGallery(), MilestoneTracker(), DocumentLibrary(), DocumentUploadDialog(), DocumentUploadDialogProps, IDocument, FamilyTreeVisualization(), ChatWindow() (+7 more)

### Community 7 - "financial/page.tsx"
Cohesion: 0.12
Nodes (16): downloadBlob(), ExportFormat, formatDate(), formatRupiah(), InvoiceData, STATUS_COLOR, STATUS_LABEL, Summary (+8 more)

### Community 8 - "schedules/page.tsx"
Cohesion: 0.08
Nodes (39): 1B · Data terapis: ulang tahun & status, 2B · Jadwal & drag-drop, File yang disentuh lagi di Step 3, Pembagian file 2A vs 2B, Task 1 · Step 2: Sisa Sesi & Jadwal, addDays(), addWeeks(), AssessmentSlot (+31 more)

### Community 9 - "assessments/[id]/route.ts"
Cohesion: 0.25
Nodes (6): patchSchema, resultSchema, AssessmentResultSchema, AssessmentSchema, IAssessment, IAssessmentResult

### Community 10 - "react"
Cohesion: 0.05
Nodes (70): EMPTY_FORM, formatRupiah(), PackageData, SuperAdminPackagesPage(), THERAPY_COLOR, THERAPY_LABEL, IMediaFile, MediaGalleryProps (+62 more)

### Community 11 - "D. Admin"
Cohesion: 0.07
Nodes (29): A. Orang Tua, ADM-1 · Pilihan ubah jadwal: minggu ini saja atau semua minggu ✅, ADM-2 · Edit invoice mengikuti jenis layanan/paket ✅, ADM-3 · Hapus akun ortu & anak (lewat persetujuan Super Admin) ✅, ADM-4 · Status terapis: Aktif / Sakit-Izin / Inaktif ✅, ADM-5 · Drag & drop jadwal ke minggu lain ✅, ADM-6 · Nama terapis di profil anak ✅, ADM-7 · Komentar terbaru di atas pada notifikasi lonceng ✅ (+21 more)

### Community 12 - "announcement-media.ts"
Cohesion: 0.18
Nodes (18): POST, sanitizeFileName(), sanitizeUploadId(), sanitizeFileName(), storeAnnouncementFile(), StoreAttachmentResult, transcodeVideoInBackground(), compressImage() (+10 more)

### Community 13 - "models/index.ts"
Cohesion: 0.09
Nodes (24): AnnouncementAttachmentSchema, AnnouncementSchema, IAnnouncement, IAnnouncementAttachment, IAttendance, IAttendanceModel, BankAccountSchema, BankAccountSettingsSchema (+16 more)

### Community 14 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, class-variance-authority, clsx, ffmpeg-static, fluent-ffmpeg (+22 more)

### Community 15 - "landing.ts"
Cohesion: 0.05
Nodes (42): hearty_bridge_app_globals, geistMono, geistSans, jsonLd, localBusinessSchema, metadata, SCHEMA_DAYS, FACT_ICONS (+34 more)

### Community 16 - "package.json"
Cohesion: 0.07
Nodes (26): name, private, version, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, eslint (+18 more)

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

### Community 22 - "mongoose"
Cohesion: 0.10
Nodes (32): DAY_NAMES, GET, nextBirthday(), todayWib(), PACKAGE_PRICES, DELETE, getReportId(), ALLOWED_EMOJIS (+24 more)

### Community 23 - "cn"
Cohesion: 0.08
Nodes (32): AboutSection(), HugMotif(), Reveal(), BridgeOfHands(), QuoteRotator(), Reveal(), CtaVisual(), Reveal() (+24 more)

### Community 24 - "dashboard/stats/route.ts"
Cohesion: 0.26
Nodes (16): 2A · Sisa sesi & profil anak, adminStats(), buildAppointments(), buildCompletedCountByPackage(), buildTodayAppointments(), DAY_NAME_BY_UTC_DOW, DAY_ORDER, GET (+8 more)

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
Cohesion: 0.08
Nodes (31): BankAccount, formatDate(), formatRupiah(), Invoice, InvoicesPage(), PackageOption, THERAPY_COLOR, THERAPY_LABEL (+23 more)

### Community 30 - "Message.ts"
Cohesion: 0.11
Nodes (7): IMessage, IMessageModel, IMessageReaction, IMessageReadStatus, MessageReactionSchema, MessageReadStatusSchema, MessageSchema

### Community 31 - "seed-patients.js"
Cohesion: 0.12
Nodes (17): bcrypt, BOY_NAMES, DAY_HOURS, DAYS, DIAGNOSES, DOW_MAP, fs, GIRL_NAMES (+9 more)

### Community 32 - "jwt.ts"
Cohesion: 0.20
Nodes (14): decodeToken(), generateAccessToken(), generateRefreshToken(), getJWTConfig(), getTokenExpiration(), hasAnyRole(), hasRole(), isTokenNearExpiry() (+6 more)

### Community 33 - "weekly-schedule/route.ts"
Cohesion: 0.10
Nodes (25): getInvoiceId(), InvoiceGoneError, PATCH, getSessionId(), PATCH, deduplicateSlots(), GET, getMondayOfWeek() (+17 more)

### Community 34 - "PermissionChecker"
Cohesion: 0.09
Nodes (15): ALL_ROLES, allowedRolesForPath(), Layout(), Props, ROUTE_PERMISSION_SOURCE, ROUTE_PERMISSIONS, ProtectedRoute(), ProtectedRouteProps (+7 more)

### Community 35 - "why-section.tsx"
Cohesion: 0.15
Nodes (13): REDUCED_REVEAL, WHY_ICONS, WhyCardBody(), WhyItem, WhySection(), DotPattern(), DotPatternProps, MagicCard() (+5 more)

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
Nodes (19): GET, ChildSessionBalance, computePackageRemaining(), emptySessionBalance(), getSessionBalances(), InvoiceLean, Oid, PackageBalance (+11 more)

### Community 42 - "IMilestoneModel"
Cohesion: 0.15
Nodes (3): IMilestone, IMilestoneModel, MilestoneSchema

### Community 43 - "contact-section.tsx"
Cohesion: 0.10
Nodes (23): CLOSED_DAYS, computeStatus(), ContactCard(), ContactCardProps, ContactSection(), DAY_NAMES, [emailUser, emailDomain], getMinuteSnapshot() (+15 more)

### Community 44 - "journey-section.tsx"
Cohesion: 0.06
Nodes (30): BLOB_TILT, CORAL_BLOOM, DECK, DECK_D, HEART_T, JourneySection(), JourneyStatic(), JourneyStep (+22 more)

### Community 45 - "services-explorer.tsx"
Cohesion: 0.12
Nodes (35): CollaborationSection(), COMMUNITY, CONDITION_ICONS, ConditionId, ConditionsSection(), NotSureCallout(), REDUCED_REVEAL, FaqSection() (+27 more)

### Community 46 - "hero-section.tsx"
Cohesion: 0.10
Nodes (21): chipLabel(), ChipTone, FLOATING_CHIPS, FloatingChip, HERO_IMAGE_ALT, HeroVisual(), ParallaxLayerProps, SERVICE_BY_ID (+13 more)

### Community 47 - "connectToDatabase"
Cohesion: 0.07
Nodes (74): GET, POST, DELETE, PATCH, GET, DELETE, getAnnouncementId(), PUT (+66 more)

### Community 48 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/fluent-ffmpeg, @types/node, @types/react (+3 more)

### Community 49 - "Document.ts"
Cohesion: 0.20
Nodes (3): DocumentSchema, IDocument, IDocumentModel

### Community 50 - "seed-database.js"
Cohesion: 0.24
Nodes (9): bcrypt, childSchema, connectToDatabase(), main(), mongoose, progressSchema, seedData(), sessionSchema (+1 more)

### Community 51 - "useAuth"
Cohesion: 0.08
Nodes (35): ChangePasswordFormData, ChangePasswordPage(), changePasswordSchema, LoginPage(), AuthGuard(), AuthGuardProps, DashboardSidebar(), DashboardSidebarProps (+27 more)

### Community 52 - "invoice-pdf-template.tsx"
Cohesion: 0.28
Nodes (8): formatDate(), formatRupiah(), InvoicePdfData, InvoicePdfDocument(), STATUS_LABEL, STATUS_STYLE, styles, THERAPY_LABEL

### Community 53 - "therapist-leaves/route.ts"
Cohesion: 0.23
Nodes (11): getLeaveId(), PATCH, updateSchema, createSchema, GET, getLeaveScheduleWarning(), LEAVE_TYPE_LABELS, LeaveScheduleWarning (+3 more)

### Community 54 - "children/[id]/route.ts"
Cohesion: 0.29
Nodes (12): DELETE, POST(), PUT, POST, deleteChildAccount(), generateChildActivityLog(), prepareChildDataForStorage(), logRequest() (+4 more)

### Community 55 - "compress.ts"
Cohesion: 0.13
Nodes (16): CompressResult, heicToJpeg(), loadFfmpeg(), loadSharp(), resolveFfmpegPath(), verifyFfmpegRuns(), generateTempPassword(), pick() (+8 more)

### Community 56 - "bcryptjs"
Cohesion: 0.22
Nodes (5): bcrypt, bcrypt, KNOWN_STAFF, mongoose, bcryptjs

### Community 57 - "document.ts"
Cohesion: 0.12
Nodes (16): BulkDocumentOperationInput, bulkDocumentOperationSchema, CreateDocumentVersionInput, createDocumentVersionSchema, DOCUMENT_CONSTANTS, DOCUMENT_MIME_TYPES, DocumentQueryInput, documentQuerySchema (+8 more)

### Community 58 - "app/page.tsx"
Cohesion: 0.16
Nodes (11): FAQ_JSON_LD, metadata, InstagramIcon(), FALLBACK_TILE, InstagramFeedSection(), InstagramPostEmbed(), InstagramPostEmbedProps, loadInstagramEmbedScript() (+3 more)

### Community 59 - "seed-parents-children.js"
Cohesion: 0.25
Nodes (6): bcrypt, childSchema, mongoose, PARENTS_NO_CHILDREN, PARENTS_WITH_CHILDREN, userSchema

### Community 60 - ".methodNotAllowed"
Cohesion: 0.11
Nodes (20): GET(), GET(), DELETE(), GET(), POST, PUT(), DELETE(), POST() (+12 more)

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
Cohesion: 0.10
Nodes (23): RFC-6068, buildConsultMessage(), buildPartnerMessage(), ConsultErrors, ConsultValues, EMPTY_CONSULT, EMPTY_PARTNER, findService() (+15 more)

### Community 65 - "[id]/page.tsx"
Cohesion: 0.14
Nodes (16): AvailablePackage, ChildDetail, DAY_LABELS, DAY_ORDER, formatDate(), formatRupiah(), InvoiceRecord, PatientDetailPage() (+8 more)

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

### Community 104 - "sticky-cta.tsx"
Cohesion: 0.15
Nodes (15): InquiryTopic, INQUIRY_PANEL_ID, ASK_SERVICE, CONSULT, EASE, GENERAL, PARTNER, StickyCta() (+7 more)

### Community 106 - "LiveBridge"
Cohesion: 0.25
Nodes (11): deckPath(), deckX(), deckY(), fx(), heartX(), heartY(), hopAt(), LiveBridge() (+3 more)

### Community 107 - "getUserFromRequest"
Cohesion: 0.27
Nodes (9): withOptionalAuth(), extractTokenFromRequest(), getUserFromRequest(), verifyAccessToken(), config, getRouteType(), matchesPattern(), proxy() (+1 more)

### Community 111 - "migrate-leave-cuti-to-sakit-izin.js"
Cohesion: 0.29
Nodes (7): fs, mongoose, path, readMongoUriFromEnvLocal(), run(), ref_fs, ref_path

### Community 112 - "login/route.ts"
Cohesion: 0.25
Nodes (7): DELETE(), GET(), loginRateLimit, PUT(), getClientIp(), withIpRateLimit(), loginSchema

### Community 113 - "reset-user-password.js"
Cohesion: 0.31
Nodes (8): bcrypt, fs, generateTempPassword(), mongoose, path, pick(), readMongoUri(), run()

### Community 114 - "ramp"
Cohesion: 0.28
Nodes (9): clamp01(), easeInOut(), FinaleLayer(), LivePlank(), ramp(), Rise(), riseRange(), StepLayer() (+1 more)

### Community 115 - "HBridge - Hearty Bridge Project"
Cohesion: 0.25
Nodes (7): Documentation, Environment: WSL2 on Windows, HBridge - Hearty Bridge Project, Main Application, Project Overview, Quick Commands, Repository Structure

### Community 116 - "recap/route.ts"
Cohesion: 0.29
Nodes (8): haversineMeters(), POST, toWIBISOString(), countWorkingDays(), currentMonthRange(), GET, todayWIB(), AttendanceSchema

### Community 118 - "Report.ts"
Cohesion: 0.25
Nodes (7): IReport, IReportMediaFile, IReportModel, IReportReaction, IReportSeenBy, ReportMediaFileSchema, ReportSchema

### Community 120 - "reports/[id]/pdf/route.ts"
Cohesion: 0.31
Nodes (9): GET, getReportId(), toPngDataUri(), formatDate(), ReportPdfData, ReportPdfDocument(), styles, TYPE_LABELS (+1 more)

### Community 121 - "health/route.ts"
Cohesion: 0.33
Nodes (3): GET, isConnected(), createHealthCheck()

### Community 127 - "validation/child.ts"
Cohesion: 0.15
Nodes (12): AssignTherapistData, assignTherapistSchema, ChildIdParams, childIdSchema, ChildQueryParams, childQuerySchema, childRateLimitSchemas, childSanitizers (+4 more)

### Community 128 - "Task 1 · Step 1: Media, Terapis, Label"
Cohesion: 0.40
Nodes (4): 1A · Media: video & pengumuman, 1C · Label menu, File yang disentuh lagi di step lain, Task 1 · Step 1: Media, Terapis, Label

### Community 129 - "new/page.tsx"
Cohesion: 0.08
Nodes (24): ChildOption, EditReportPage(), formatSavedAt(), FormState, ChildOption, EMPTY_FORM, formatDisplayDate(), FormState (+16 more)

### Community 132 - "lucide-react"
Cohesion: 0.17
Nodes (11): AnnouncementAttachment, AnnouncementData, AnnouncementWall(), EMPTY_FORM, formatDate(), toLightboxItems(), formatSize(), Lightbox() (+3 more)

### Community 134 - "Landing Page Plan — Hearty Bridge (`/`)"
Cohesion: 0.25
Nodes (7): 1. Web-business brief (5 questions), 2. Modules picked (and skipped), 3. Page map ← company profile, 4. Visitor scenarios, 5. Images to generate (optional — the page already looks finished without them), 6. Still open with the client (copy is drafted and marked in code), Landing Page Plan — Hearty Bridge (`/`)

### Community 135 - "pad"
Cohesion: 0.33
Nodes (6): Hud(), pad(), StaticStep(), stepImage(), StepRail(), StepVisual()

### Community 136 - "graded"
Cohesion: 0.40
Nodes (5): graded(), heartAt(), interpolate(), lerp(), StageBackdrop()

### Community 138 - "next.config.ts"
Cohesion: 0.50
Nodes (3): nextConfig, withNextIntl, ref_next_intl_plugin

### Community 139 - "JourneyPinned"
Cohesion: 0.67
Nodes (3): JourneyPinned(), layerAt(), useIsDesktop()

## Knowledge Gaps
- **832 isolated node(s):** `ALLOWED_EMOJIS`, `PatientOption`, `ReportMediaFile`, `ReportSeenBy`, `ReportReaction` (+827 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1084 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mongoose` connect `mongoose` to `middleware/auth.ts`, `api/children/route.ts`, `r2-storage.ts`, `assessments/[id]/route.ts`, `models/index.ts`, `package.json`, `diag-multi-package.js`, `dashboard/stats/route.ts`, `Message.ts`, `seed-patients.js`, `weekly-schedule/route.ts`, `Conversation.ts`, `Family.ts`, `SearchIndex.ts`, `populate-mongodb.js`, `session-balance.ts`, `IMilestoneModel`, `Document.ts`, `seed-database.js`, `therapist-leaves/route.ts`, `children/[id]/route.ts`, `bcryptjs`, `seed-parents-children.js`, `MediaFile.ts`, `populate-simple.js`, `reset-staff-accounts.js`, `Progress.ts`, `cleanup-orphan-packages.js`, `consolidate-packages.js`, `create-super-admin.js`, `diag-get-schedule.js`, `diag-session-visibility.js`, `fix-missing-sessions.js`, `fix-unlinked-slots.js`, `seed-packages.js`, `backfill-therapist-colors.js`, `delete-duplicate-slots.js`, `diag-aldi.js`, `diag-aldi-kamis.js`, `diag-aldi-slots-raw.js`, `diag-kevin.js`, `diag-laila-slots.js`, `diag-notype-packages.js`, `diag-packages.js`, `diag-patient.js`, `diag-recent.js`, `diag-recent-tx.js`, `diag-remaining.js`, `diag-session-mismatch.js`, `diag-slots.js`, `fix-admin-password.js`, `fix-aldi-duplicate-slots.js`, `fix-kevin-tw-package-type.js`, `fix-slot-effective-until.js`, `sync-sessions.js`, `test-therapist-data.js`, `migrate-leave-cuti-to-sakit-izin.js`, `reset-user-password.js`, `recap/route.ts`, `Report.ts`, `reports/[id]/pdf/route.ts`, `check-users.js`, `clear-data.js`, `delete-patients-and-parents.js`, `fix-therapy-type.js`, `migrate-to-atlas.js`?**
  _High betweenness centrality (0.334) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `patients/page.tsx`, `new/page.tsx`, `reports/page.tsx`, `lucide-react`, `document-upload-dialog.tsx`, `financial/page.tsx`, `schedules/page.tsx`, `landing.ts`, `package.json`, `attendance/page.tsx`, `dashboard/page.tsx`, `cn`, `usePermissions`, `PermissionChecker`, `why-section.tsx`, `contact-section.tsx`, `journey-section.tsx`, `services-explorer.tsx`, `hero-section.tsx`, `useAuth`, `app/page.tsx`, `inquiry-panel.tsx`, `[id]/page.tsx`, `sticky-cta.tsx`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `patients/page.tsx`, `new/page.tsx`, `reports/page.tsx`, `document-upload-dialog.tsx`, `financial/page.tsx`, `schedules/page.tsx`, `react`, `landing.ts`, `package.json`, `attendance/page.tsx`, `dashboard/page.tsx`, `cn`, `usePermissions`, `why-section.tsx`, `contact-section.tsx`, `journey-section.tsx`, `services-explorer.tsx`, `hero-section.tsx`, `useAuth`, `inquiry-panel.tsx`, `[id]/page.tsx`, `sticky-cta.tsx`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **What connects `ALLOWED_EMOJIS`, `PatientOption`, `ReportMediaFile` to the rest of the system?**
  _832 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `patients/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `middleware/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07205387205387205 - nodes in this community are weakly interconnected._
- **Should `reports/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0796221322537112 - nodes in this community are weakly interconnected._
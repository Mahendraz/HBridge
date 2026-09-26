# Graph Report - HBridge  (2026-09-26)

## Corpus Check
- 351 files · ~284,093 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 5, .toml 1, .css 1)

## Summary
- 2148 nodes · 5165 edges · 137 communities (116 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e4e86bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- patients/page.tsx
- middleware/auth.ts
- .forbidden
- reports/page.tsx
- announcements/[id]/route.ts
- search.ts
- milestone-tracker.tsx
- financial/page.tsx
- schedules/page.tsx
- media/route.ts
- card.tsx
- D. Admin
- report-media-uploader.tsx
- models/index.ts
- dependencies
- footer.tsx
- package.json
- diag-multi-package.js
- Request ke Client — Hearty Bridge (Landing Page)
- attendance/page.tsx
- dashboard/page.tsx
- messaging.ts
- mongoose
- collaboration-section.tsx
- measure-db-latency.js
- AssignmentEngine
- validation/auth.ts
- compilerOptions
- Hearty Bridge - Next.js Application
- useAuth
- Message.ts
- seed-patients.js
- compress.ts
- weekly-schedule/route.ts
- PermissionChecker
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
- app/page.tsx
- hero-section.tsx
- ErrorResponse
- devDependencies
- Document.ts
- seed-database.js
- auth-context.tsx
- invoice-pdf-template.tsx
- therapist-leaves/route.ts
- dashboard/layout.tsx
- lucide-react
- bcryptjs
- document.ts
- instagram-post-embed.tsx
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
- validation/child.ts
- eslint.config.mjs
- postcss.config.mjs
- users/[id]/route.ts
- useConversations.ts
- migrate-login-users.js
- ramp
- HBridge - Hearty Bridge Project
- r2-storage.ts
- heic-convert.d.ts
- Report.ts
- IChildModel
- Task 1 · Step 1: Media, Terapis, Label
- connectToDatabase
- check-users.js
- clear-data.js
- delete-patients-and-parents.js
- fix-therapy-type.js
- migrate-to-atlas.js
- next.config.ts
- react
- IChild
- IUser
- Landing Page Plan — Hearty Bridge (`/`)
- pad
- graded
- ErrorBoundary
- landing.ts
- JourneyPinned

## God Nodes (most connected - your core abstractions)
1. `connectToDatabase()` - 127 edges
2. `cn()` - 121 edges
3. `mongoose` - 115 edges
4. `react` - 91 edges
5. `lucide-react` - 59 edges
6. `ErrorResponse` - 54 edges
7. `useAuth()` - 52 edges
8. `withErrorHandling()` - 50 edges
9. `SuccessResponse` - 46 edges
10. `withAnyAuth()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `1A · Media: video & pengumuman` --references--> `Lightbox()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/components/ui/lightbox.tsx
- `1A · Media: video & pengumuman` --references--> `compressImage()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/lib/utils/compress.ts
- `1A · Media: video & pengumuman` --references--> `compressVideo()`  [INFERRED]
  docs/testing/task1-plan-step1.md → hearty-bridge/lib/utils/compress.ts
- `2A · Sisa sesi & profil anak` --references--> `formatChildForResponse()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/lib/utils/child.ts
- `2A · Sisa sesi & profil anak` --references--> `ParentMainContent()`  [INFERRED]
  docs/testing/task1-plan-step2.md → hearty-bridge/app/dashboard/page.tsx

## Import Cycles
- None detected.

## Communities (137 total, 21 thin omitted)

### Community 0 - "patients/page.tsx"
Cohesion: 0.07
Nodes (44): Patient, PROGRAM_BADGE, LeaveRecord, STATUS_OPTIONS, StatusOption, Therapist, DeletionTarget, fetchPendingDeletionIds() (+36 more)

### Community 1 - "middleware/auth.ts"
Cohesion: 0.06
Nodes (46): POST, resetPasswordSchema, createUserSchema, GET, haversineMeters(), POST, toWIBISOString(), countWorkingDays() (+38 more)

### Community 2 - ".forbidden"
Cohesion: 0.18
Nodes (25): GET, DELETE, GET, PUT, GET, POST, buildChildSearchQuery(), buildChildSortQuery() (+17 more)

### Community 3 - "reports/page.tsx"
Cohesion: 0.09
Nodes (28): EMOJIS, formatSavedAt(), getStatusBadgeVariant(), getStatusLabel(), getTypeColor(), getTypeLabel(), PatientOption, PatientPickerDialog() (+20 more)

### Community 4 - "announcements/[id]/route.ts"
Cohesion: 0.32
Nodes (10): DELETE, getAnnouncementId(), PUT, ALLOWED, DELETE, extractR2Key(), getChildId(), POST (+2 more)

### Community 5 - "search.ts"
Cohesion: 0.11
Nodes (18): AdvancedSearchInput, advancedSearchSchema, BulkIndexOperationInput, bulkIndexOperationSchema, EntitySearchInput, entitySearchSchema, GlobalSearchInput, globalSearchSchema (+10 more)

### Community 6 - "milestone-tracker.tsx"
Cohesion: 0.08
Nodes (24): IMediaFile, MediaGallery(), MediaGalleryProps, categoryColors, IMilestone, MilestoneTracker(), MilestoneTrackerProps, statusColors (+16 more)

### Community 7 - "financial/page.tsx"
Cohesion: 0.12
Nodes (16): downloadBlob(), ExportFormat, formatDate(), formatRupiah(), InvoiceData, STATUS_COLOR, STATUS_LABEL, Summary (+8 more)

### Community 8 - "schedules/page.tsx"
Cohesion: 0.09
Nodes (35): 1B · Data terapis: ulang tahun & status, 2B · Jadwal & drag-drop, addDays(), addWeeks(), AssessmentSlot, dateStrToDayName(), dateUTCStr(), Day (+27 more)

### Community 9 - "media/route.ts"
Cohesion: 0.23
Nodes (18): DELETE, getReportId(), POST, sanitizeFileName(), sanitizeUploadId(), sanitizeFileName(), storeAnnouncementFile(), StoreAttachmentResult (+10 more)

### Community 10 - "card.tsx"
Cohesion: 0.06
Nodes (49): ChildProfileLayoutProps, IChild, FamilyTreeVisualizationProps, getRelationshipColor(), IFamily, IFamilyMember, IFamilyTreeNode, MemberDialog() (+41 more)

### Community 11 - "D. Admin"
Cohesion: 0.07
Nodes (29): A. Orang Tua, ADM-1 · Pilihan ubah jadwal: minggu ini saja atau semua minggu ✅, ADM-2 · Edit invoice mengikuti jenis layanan/paket ✅, ADM-3 · Hapus akun ortu & anak (lewat persetujuan Super Admin) ✅, ADM-4 · Status terapis: Aktif / Sakit-Izin / Inaktif ✅, ADM-5 · Drag & drop jadwal ke minggu lain ✅, ADM-6 · Nama terapis di profil anak ✅, ADM-7 · Komentar terbaru di atas pada notifikasi lonceng ✅ (+21 more)

### Community 12 - "report-media-uploader.tsx"
Cohesion: 0.12
Nodes (18): fromServer(), getToken(), ItemStatus, MediaItem, newUploadId(), ReportMediaUploader, ServerMediaFile, UploadJob (+10 more)

### Community 13 - "models/index.ts"
Cohesion: 0.08
Nodes (28): AnnouncementAttachmentSchema, AnnouncementSchema, IAnnouncement, IAnnouncementAttachment, AttendanceSchema, IAttendance, IAttendanceModel, BankAccountSchema (+20 more)

### Community 14 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, class-variance-authority, clsx, ffmpeg-static, fluent-ffmpeg (+22 more)

### Community 15 - "footer.tsx"
Cohesion: 0.06
Nodes (37): hearty_bridge_app_globals, geistMono, geistSans, jsonLd, localBusinessSchema, metadata, SCHEMA_DAYS, CtaVisual() (+29 more)

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
Cohesion: 0.08
Nodes (23): ActivityItem, AdminMainContent(), AdminStatsCards(), BirthdayItem, ChildInfo, DashboardData, DAY_LABELS, DAY_ORDER (+15 more)

### Community 21 - "messaging.ts"
Cohesion: 0.09
Nodes (22): AddParticipantInput, addParticipantSchema, AddReactionInput, addReactionSchema, BulkMessageOperationInput, bulkMessageOperationSchema, ConversationQueryInput, conversationQuerySchema (+14 more)

### Community 22 - "mongoose"
Cohesion: 0.11
Nodes (31): GET, injectSignedUrls(), GET, getReportId(), POST, GET, getReportId(), toPngDataUri() (+23 more)

### Community 23 - "collaboration-section.tsx"
Cohesion: 0.12
Nodes (23): AboutSection(), HugMotif(), Reveal(), BridgeOfHands(), COMMUNITY, QuoteRotator(), Reveal(), SectionHeading() (+15 more)

### Community 24 - "measure-db-latency.js"
Cohesion: 0.60
Nodes (4): main(), mongoose, stats(), time()

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

### Community 29 - "useAuth"
Cohesion: 0.06
Nodes (45): BankAccount, formatDate(), formatRupiah(), Invoice, InvoicesPage(), PackageOption, THERAPY_COLOR, THERAPY_LABEL (+37 more)

### Community 30 - "Message.ts"
Cohesion: 0.11
Nodes (7): IMessage, IMessageModel, IMessageReaction, IMessageReadStatus, MessageReactionSchema, MessageReadStatusSchema, MessageSchema

### Community 31 - "seed-patients.js"
Cohesion: 0.12
Nodes (17): bcrypt, BOY_NAMES, DAY_HOURS, DAYS, DIAGNOSES, DOW_MAP, fs, GIRL_NAMES (+9 more)

### Community 32 - "compress.ts"
Cohesion: 0.13
Nodes (16): CompressResult, heicToJpeg(), loadFfmpeg(), loadSharp(), resolveFfmpegPath(), verifyFfmpegRuns(), generateTempPassword(), pick() (+8 more)

### Community 33 - "weekly-schedule/route.ts"
Cohesion: 0.07
Nodes (38): createSchema, GET, DAY_NAMES, GET, GET, getChildId(), POST, GET (+30 more)

### Community 35 - "cn"
Cohesion: 0.09
Nodes (28): noopSubscribe(), NOTE: this module is a client module — import SERVICE_ICONS only from other, SERVICE_ICONS, ServiceBadge(), ServicesMarquee(), useHydrated(), REDUCED_REVEAL, WHY_ICONS (+20 more)

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
Cohesion: 0.08
Nodes (37): 2A · Sisa sesi & profil anak, File yang disentuh lagi di Step 3, Pembagian file 2A vs 2B, Task 1 · Step 2: Sisa Sesi & Jadwal, adminStats(), buildAppointments(), buildCompletedCountByPackage(), buildTodayAppointments() (+29 more)

### Community 42 - "IMilestoneModel"
Cohesion: 0.15
Nodes (3): IMilestone, IMilestoneModel, MilestoneSchema

### Community 43 - "contact-section.tsx"
Cohesion: 0.08
Nodes (27): CLOSED_DAYS, computeStatus(), ContactCard(), ContactCardProps, DAY_NAMES, [emailUser, emailDomain], getMinuteSnapshot(), getServerMinuteSnapshot() (+19 more)

### Community 44 - "journey-section.tsx"
Cohesion: 0.06
Nodes (30): BLOB_TILT, CORAL_BLOOM, DECK, DECK_D, HEART_T, JourneySection(), JourneyStatic(), JourneyStep (+22 more)

### Community 45 - "app/page.tsx"
Cohesion: 0.12
Nodes (30): FAQ_JSON_LD, metadata, CollaborationSection(), ConditionsSection(), NotSureCallout(), ContactSection(), FaqSection(), FinalCtaSection() (+22 more)

### Community 46 - "hero-section.tsx"
Cohesion: 0.15
Nodes (12): chipLabel(), ChipTone, FLOATING_CHIPS, HERO_IMAGE_ALT, HeroVisual(), ParallaxLayerProps, SERVICE_BY_ID, ServiceChip() (+4 more)

### Community 47 - "ErrorResponse"
Cohesion: 0.11
Nodes (31): PATCH, POST, POST, DELETE, GET, getAssessmentId(), PATCH, patchSchema (+23 more)

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
Nodes (23): ChangePasswordFormData, ChangePasswordPage(), changePasswordSchema, LoginPage(), AuthGuard(), AuthGuardProps, BorderBeam(), BorderBeamProps (+15 more)

### Community 52 - "invoice-pdf-template.tsx"
Cohesion: 0.15
Nodes (14): formatDate(), formatRupiah(), InvoicePdfData, InvoicePdfDocument(), STATUS_LABEL, STATUS_STYLE, styles, THERAPY_LABEL (+6 more)

### Community 53 - "therapist-leaves/route.ts"
Cohesion: 0.21
Nodes (13): DELETE, getLeaveId(), PATCH, updateSchema, createSchema, GET, POST, GET (+5 more)

### Community 54 - "dashboard/layout.tsx"
Cohesion: 0.17
Nodes (13): ALL_ROLES, allowedRolesForPath(), Layout(), Props, ROUTE_PERMISSION_SOURCE, ROUTE_PERMISSIONS, ProtectedRoute(), ProtectedRouteProps (+5 more)

### Community 55 - "lucide-react"
Cohesion: 0.19
Nodes (10): AnnouncementAttachment, AnnouncementData, AnnouncementWall(), EMPTY_FORM, formatDate(), toLightboxItems(), formatSize(), Lightbox() (+2 more)

### Community 56 - "bcryptjs"
Cohesion: 0.22
Nodes (5): bcrypt, bcrypt, KNOWN_STAFF, mongoose, bcryptjs

### Community 57 - "document.ts"
Cohesion: 0.12
Nodes (16): BulkDocumentOperationInput, bulkDocumentOperationSchema, CreateDocumentVersionInput, createDocumentVersionSchema, DOCUMENT_CONSTANTS, DOCUMENT_MIME_TYPES, DocumentQueryInput, documentQuerySchema (+8 more)

### Community 58 - "instagram-post-embed.tsx"
Cohesion: 0.50
Nodes (4): InstagramPostEmbed(), InstagramPostEmbedProps, loadInstagramEmbedScript(), Window

### Community 59 - "seed-parents-children.js"
Cohesion: 0.25
Nodes (6): bcrypt, childSchema, mongoose, PARENTS_NO_CHILDREN, PARENTS_WITH_CHILDREN, userSchema

### Community 60 - "jwt.ts"
Cohesion: 0.05
Nodes (48): GET(), GET(), DELETE(), GET(), PUT(), DELETE(), GET(), POST (+40 more)

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
Cohesion: 0.17
Nodes (12): InquiryTopic, INQUIRY_PANEL_ID, ASK_SERVICE, CONSULT, EASE, GENERAL, PARTNER, ZONE_CTA (+4 more)

### Community 106 - "LiveBridge"
Cohesion: 0.25
Nodes (11): deckPath(), deckX(), deckY(), fx(), heartX(), heartY(), hopAt(), LiveBridge() (+3 more)

### Community 107 - "validation/child.ts"
Cohesion: 0.14
Nodes (13): AssignTherapistData, assignTherapistSchema, ChildIdParams, childIdSchema, ChildQueryParams, childQuerySchema, childRateLimitSchemas, childSanitizers (+5 more)

### Community 111 - "users/[id]/route.ts"
Cohesion: 0.39
Nodes (5): DELETE, updateUserSchema, deactivateChildren(), deleteChildAccount(), deleteParentAccount()

### Community 112 - "useConversations.ts"
Cohesion: 0.33
Nodes (4): Conversation, ConversationParticipant, Message, useConversations()

### Community 113 - "migrate-login-users.js"
Cohesion: 0.11
Nodes (25): fs, mongoose, path, readMongoUriFromEnvLocal(), run(), connect(), fs, list() (+17 more)

### Community 114 - "ramp"
Cohesion: 0.28
Nodes (9): clamp01(), easeInOut(), FinaleLayer(), LivePlank(), ramp(), Rise(), riseRange(), StepLayer() (+1 more)

### Community 115 - "HBridge - Hearty Bridge Project"
Cohesion: 0.25
Nodes (7): Documentation, Environment: WSL2 on Windows, HBridge - Hearty Bridge Project, Main Application, Project Overview, Quick Commands, Repository Structure

### Community 116 - "r2-storage.ts"
Cohesion: 0.40
Nodes (4): createR2Client(), existsInR2(), @aws-sdk/client-s3, @aws-sdk/s3-request-presigner

### Community 118 - "Report.ts"
Cohesion: 0.25
Nodes (7): IReport, IReportMediaFile, IReportModel, IReportReaction, IReportSeenBy, ReportMediaFileSchema, ReportSchema

### Community 120 - "Task 1 · Step 1: Media, Terapis, Label"
Cohesion: 0.40
Nodes (4): 1A · Media: video & pengumuman, 1C · Label menu, File yang disentuh lagi di step lain, Task 1 · Step 1: Media, Terapis, Label

### Community 121 - "connectToDatabase"
Cohesion: 0.09
Nodes (33): GET, GET, getChildId(), GET, nextBirthday(), todayWib(), GET, getNotificationId() (+25 more)

### Community 127 - "next.config.ts"
Cohesion: 0.50
Nodes (3): nextConfig, withNextIntl, ref_next_intl_plugin

### Community 129 - "react"
Cohesion: 0.09
Nodes (17): ChildOption, EditReportPage(), formatSavedAt(), FormState, ChildOption, EMPTY_FORM, formatDisplayDate(), FormState (+9 more)

### Community 134 - "Landing Page Plan — Hearty Bridge (`/`)"
Cohesion: 0.25
Nodes (7): 1. Web-business brief (5 questions), 2. Modules picked (and skipped), 3. Page map ← company profile, 4. Visitor scenarios, 5. Images to generate (optional — the page already looks finished without them), 6. Still open with the client (copy is drafted and marked in code), Landing Page Plan — Hearty Bridge (`/`)

### Community 135 - "pad"
Cohesion: 0.33
Nodes (6): Hud(), pad(), StaticStep(), stepImage(), StepRail(), StepVisual()

### Community 136 - "graded"
Cohesion: 0.40
Nodes (5): graded(), heartAt(), interpolate(), lerp(), StageBackdrop()

### Community 138 - "landing.ts"
Cohesion: 0.13
Nodes (18): CONDITION_ICONS, ConditionId, REDUCED_REVEAL, FloatingChip, InquiryContext, InquiryContextValue, InquiryProvider(), FACT_ICONS (+10 more)

### Community 139 - "JourneyPinned"
Cohesion: 0.67
Nodes (3): JourneyPinned(), layerAt(), useIsDesktop()

## Knowledge Gaps
- **837 isolated node(s):** `fs`, `path`, `mongoose`, `LOGIN_ROLES`, `Patient` (+832 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1089 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mongoose` connect `mongoose` to `middleware/auth.ts`, `.forbidden`, `announcements/[id]/route.ts`, `media/route.ts`, `models/index.ts`, `package.json`, `diag-multi-package.js`, `measure-db-latency.js`, `Message.ts`, `seed-patients.js`, `weekly-schedule/route.ts`, `Conversation.ts`, `Family.ts`, `SearchIndex.ts`, `populate-mongodb.js`, `dashboard/stats/route.ts`, `IMilestoneModel`, `ErrorResponse`, `Document.ts`, `seed-database.js`, `therapist-leaves/route.ts`, `bcryptjs`, `seed-parents-children.js`, `MediaFile.ts`, `populate-simple.js`, `reset-staff-accounts.js`, `Progress.ts`, `cleanup-orphan-packages.js`, `consolidate-packages.js`, `create-super-admin.js`, `diag-get-schedule.js`, `diag-session-visibility.js`, `fix-missing-sessions.js`, `fix-unlinked-slots.js`, `seed-packages.js`, `backfill-therapist-colors.js`, `delete-duplicate-slots.js`, `diag-aldi.js`, `diag-aldi-kamis.js`, `diag-aldi-slots-raw.js`, `diag-kevin.js`, `diag-laila-slots.js`, `diag-notype-packages.js`, `diag-packages.js`, `diag-patient.js`, `diag-recent.js`, `diag-recent-tx.js`, `diag-remaining.js`, `diag-session-mismatch.js`, `diag-slots.js`, `fix-admin-password.js`, `fix-aldi-duplicate-slots.js`, `fix-kevin-tw-package-type.js`, `fix-slot-effective-until.js`, `sync-sessions.js`, `test-therapist-data.js`, `users/[id]/route.ts`, `migrate-login-users.js`, `Report.ts`, `connectToDatabase`, `check-users.js`, `clear-data.js`, `delete-patients-and-parents.js`, `fix-therapy-type.js`, `migrate-to-atlas.js`?**
  _High betweenness centrality (0.314) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `patients/page.tsx`, `reports/page.tsx`, `milestone-tracker.tsx`, `financial/page.tsx`, `schedules/page.tsx`, `card.tsx`, `landing.ts`, `report-media-uploader.tsx`, `footer.tsx`, `package.json`, `attendance/page.tsx`, `dashboard/page.tsx`, `collaboration-section.tsx`, `useAuth`, `cn`, `contact-section.tsx`, `journey-section.tsx`, `app/page.tsx`, `hero-section.tsx`, `auth-context.tsx`, `dashboard/layout.tsx`, `lucide-react`, `instagram-post-embed.tsx`, `inquiry-panel.tsx`, `[id]/page.tsx`, `sticky-cta.tsx`, `useConversations.ts`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `patients/page.tsx`, `react`, `reports/page.tsx`, `milestone-tracker.tsx`, `financial/page.tsx`, `schedules/page.tsx`, `card.tsx`, `landing.ts`, `report-media-uploader.tsx`, `footer.tsx`, `package.json`, `attendance/page.tsx`, `dashboard/page.tsx`, `collaboration-section.tsx`, `useAuth`, `cn`, `contact-section.tsx`, `journey-section.tsx`, `app/page.tsx`, `hero-section.tsx`, `auth-context.tsx`, `inquiry-panel.tsx`, `[id]/page.tsx`, `sticky-cta.tsx`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `mongoose` to the rest of the system?**
  _837 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `patients/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0701344243132671 - nodes in this community are weakly interconnected._
- **Should `middleware/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06398809523809523 - nodes in this community are weakly interconnected._
- **Should `reports/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0873440285204991 - nodes in this community are weakly interconnected._
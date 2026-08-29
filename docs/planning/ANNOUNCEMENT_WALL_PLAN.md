# Plan: Announcement Wall on the Dashboard

> Status: implemented, type-checked clean. Not yet verified in-browser — see
> Verification below.

## Context

`super_admin`/`admin` need to post announcements (title + content + optional
image/file attachment) that every role (`super_admin`, `admin`, `therapist`,
`parent`) can see, read-only, on the main dashboard. No separate page —
everything (viewing + admin create/edit/delete) lives in one section on
`/dashboard`.

This is a new feature, built from day one on the permission system finished
earlier this session (`lib/utils/permissions.ts`) — using
`Permission`/`hasPermission()` as the real gate, not an ad-hoc
`role === 'admin'` check.

**Existing patterns being reused, not reinvented:**
- Media upload pipeline from `app/api/reports/[id]/media/route.ts`
  (`uploadToR2`/`deleteFromR2`, `compressImage`/`compressVideo`, MIME/size
  validation, `getR2SignedUrl`).
- Attachment shape from `models/Report.ts`'s `IReportMediaFile`
  (`fileName, fileType, gcsPath, url, mimeType, size, uploadedAt`).
- Soft delete (`isActive: boolean`) — every model in this repo does this.
- API route pattern (`withAdminAuth`/`withAnyAuth` + `withErrorHandling` +
  `SuccessResponse`/`ErrorResponse`) per `hearty-bridge/CLAUDE.md`.
- Create/edit Dialog UI shape from `app/dashboard/super-admin/packages/page.tsx`.

---

## Part A — Data model

- [x] **New file `models/Announcement.ts`** — `title`, `content`,
  `attachments: IAnnouncementAttachment[]` (same shape as `Report`'s
  `mediaFiles`), `authorId` (ref `User`), `authorName` (denormalized),
  `isActive` (soft delete), timestamps.
- [x] **Register in `models/index.ts`** — one-line export, same pattern as the
  existing 16 model exports there.

## Part B — Permissions (use the system just built, correctly)

- [x] Add 2 new `Permission` keys to `lib/utils/permissions.ts`:
  `announcements:view` (all 4 roles) and `announcements:manage`
  (`admin`/`super_admin` only). No new helper function needed —
  `hasPermission()` covers both the wall's visibility and the admin controls.

## Part C — API routes

- [x] **New file `app/api/announcements/route.ts`**
  - `GET` — `withAnyAuth`. Active announcements, newest first, fresh signed
    URLs for image attachments (same pattern as `app/api/reports/route.ts`'s
    `injectSignedUrls`). No extra role check — `withAnyAuth` already means
    "any authenticated role," which is exactly what `announcements:view` is.
  - `POST` — `withAdminAuth` (maps 1:1 to `announcements:manage` — use the
    role middleware directly here rather than importing `permissions.ts`,
    since that file pulls in `react` and shouldn't be imported into a
    server-only route). `multipart/form-data`: `title`, `content`, optional
    `file` → compress → upload → attach, same flow as
    `reports/[id]/media/route.ts`.
- [x] **New file `app/api/announcements/[id]/route.ts`**
  - `PUT` — `withAdminAuth`. Update `title`/`content`; optional new `file`
    replaces the attachment (old R2 object cleaned up via `deleteFromR2`).
  - `DELETE` — `withAdminAuth`. Soft delete + best-effort R2 cleanup, same
    shape as `reports/[id]/route.ts`'s `DELETE`.

## Part D — Frontend

- [x] **New file `components/dashboard/announcement-wall.tsx`** —
  `"use client"`, `useAuth()` + `usePermissions()`. Fetches the list for every
  role. Cards match existing dashboard widget styling
  (`rounded-2xl border bg-white shadow-sm` + `BorderBeam`). Since there's no
  separate page, the component owns its own "show 5 / show all" toggle
  in-place rather than linking elsewhere.
  `permissions.hasPermission('announcements:manage')` gates: "+ Buat
  Pengumuman" button → create Dialog (title, content, single optional file
  input, form pattern copied from `super-admin/packages/page.tsx`), plus
  per-card edit/delete icons (delete via `confirm()`, same as that page).
  `therapist`/`parent` see the identical list, no buttons at all.
- [x] **Modify `app/dashboard/page.tsx`** — render `<AnnouncementWall />`
  once, right after the Welcome header and before the role-specific
  Birthday/Stats/MainContent sections, since it's the one section genuinely
  shared by all four roles.

---

## Deviations from the plan above

- Skipped a separate `IAnnouncementModel extends Model<IAnnouncement> {}`
  interface (unlike `Report.ts`'s `IReportModel`) — it would've been empty and
  triggered the same `@typescript-eslint/no-empty-object-type` lint error
  `Report.ts`'s copy of that pattern already has. Used `Model<IAnnouncement>`
  directly instead; behaviorally identical, one less lint warning in new code.

## Verification

- `npx tsc --noEmit` after each part.
- Manual in-browser QA: post an announcement with an image as `admin`,
  confirm read-only visibility for `therapist`/`parent`, confirm
  edit/delete works for `super_admin`, and confirm a `therapist` hitting
  `POST /api/announcements` directly (curl/devtools, bypassing the hidden
  button) still gets `403` from the backend.

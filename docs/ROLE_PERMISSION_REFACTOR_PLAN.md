# Plan: Make `PermissionChecker` the Real Source of Truth

> Status: Parts A, B, and C all implemented and type-checked clean
> (`npx tsc --noEmit` — only 2 pre-existing, unrelated `react-hook-form` errors
> remain). **Not yet verified in-browser** — every checkbox below reflects a
> code change confirmed by type-check only; the schedules/patients pages in
> particular need real manual QA per role before this is fully done (see
> Verification). Companion to `docs/ROLE_ARCHITECTURE.md` (how the current
> system works, corrected post-refactor) and `docs/DASHBOARD_VIEWS_BY_ROLE.md`
> (per-page role behavior — now stale for the pages touched here, not yet
> updated).

## Why

A proper declarative RBAC system already exists in `lib/utils/permissions.ts`
(`Permission` union, `ROLE_PERMISSIONS` map, `PermissionChecker` class,
`usePermissions()` hook, `PermissionGuard` component, `withPermissions()` HOC) but
only 2 places in the app use it (`components/layout/dashboard-sidebar.tsx`,
`app/dashboard/layout.tsx`). Everywhere else re-implements the same role rules as
raw `user.role === '...'` checks, independently, per file.

This has already caused real bugs from that exact duplication pattern: `super_admin`
missing from a dashboard switch-case, from `canResolve`, from `isAdmin`, from a
sidebar badge (see "Bugs — Sudah Difix" in `DASHBOARD_VIEWS_BY_ROLE.md`). A fresh
scan of all 35+ API routes found the same bug class still live today:
`app/api/reports/[id]/media/route.ts` omits `super_admin` from its ownership check,
unlike its three sibling routes on the same resource.

**Goal:** finish `permissions.ts` so it covers what the app actually needs, then
migrate pages onto it safest-first, so future role logic has one place to change
instead of N copies.

---

## Part A — Fix and extend `permissions.ts` (must happen before Part B)

**File touched:** `lib/utils/permissions.ts` only.

- [x] **A1. Add missing `Permission` keys** found in real code but absent from the
  union (and add them to `ROLE_PERMISSIONS` for the right roles):
  - `dashboard:activity` — RecentActivityWidget (super_admin only)
  - `assessments:view`, `assessments:view_own`, `assessments:create`,
    `assessments:edit`, `assessments:edit_own`, `assessments:delete`,
    `assessments:manage`
  - `leaves:view_all`, `leaves:view_own`, `leaves:manage`
  - `therapists:view_own`, `therapists:manage_leave`
  - `reports:edit`, `reports:edit_own`, `reports:delete`,
    `reports:resolve_comment`, `reports:view_seen_by`
  - `sessions:bulk_schedule`
  - `tokens:manage` (or fold into existing `billing:manage` — pick one)
  - `patients:edit_medical_only`

- [x] **A2. Reconcile `patients:delete`** — currently granted to admin/super_admin
  in `ROLE_PERMISSIONS`, but the only real `DELETE /api/children/[id]` route is
  parent-only (removing their own child). Split into `patients:delete`
  (admin/super_admin, currently unused, keep for future) and new
  `patients:delete_own` (parent) mapped to the actual route.

- [x] **A3. Fix the broken `canView`/`canEdit`/`canCreate`/`canDelete` maps** on
  `PermissionChecker` — they're inconsistent with the `Permission` union today:
  - `canEdit("reports")` maps to `"reports:create"` (no `reports:edit` exists yet —
    fixed by A1; point it at the new key).
  - `canView("invoices")` / `canDelete("invoices")` have no entry at all despite
    invoices being gated in 2 real pages.
  Audit and correct all four maps against the full union.

- [x] **A4. Add an ownership-check helper** — the biggest structural gap.
  `PermissionChecker` only knows "can this *role* ever do X," not "can *this user*
  act on *this record*." Every own-record check today (`canResolve`,
  `canFillResult`, `isOwn` in schedules, and 3 independently-duplicated
  `canAccessReport`-style functions in `reports/[id]/route.ts`,
  `reports/[id]/comments/route.ts`, `reports/[id]/media/route.ts` — the last one
  missing `super_admin`) is hand-rolled because there's nowhere shared to put it.
  Add one small exported function (plain function, so API routes can import it too):
  ```ts
  export function canActOnOwnRecord(
    userRole: UserRole,
    userId: string,
    ownerId: string | null | undefined,
    elevatedRoles: UserRole[] = ['admin', 'super_admin']
  ): boolean {
    if (elevatedRoles.includes(userRole)) return true;
    return !!ownerId && ownerId === userId;
  }
  ```
  This replaces all of the above with one call each, and fixes the `super_admin`
  omission bug in `reports/media/route.ts` by construction, not a special patch.

- [x] **A5. Confirm `withPermissions()`/`PermissionGuard` fit** the two whole-page
  gates (`super-admin/packages`, `super-admin/financial`) that currently hand-roll
  `if (role !== "super_admin") return <AccessDenied/>`. No new code expected —
  just confirm during A5 implementation.

- [x] **A6. Wire real per-route gating into `ProtectedRoute`** — implemented as
  an explicit `ROUTE_PERMISSIONS` map in `app/dashboard/layout.tsx`, but scoped
  conservatively: only the 3 routes where the *page itself* already has a
  verified single-permission whole-page gate (`super-admin/packages` →
  `packages:view`, `super-admin/financial` → `financial:view_all`,
  `therapists` → `therapists:view`) got a matching layout-level entry — computed
  via `new PermissionChecker(role).hasPermission(...)` so it mirrors the page's
  own check and can't drift from it. Every other route keeps today's permissive
  behavior (any authenticated role reaches the layout; the page/API enforces
  the rest), because most pages gate specific content, not the whole page, and
  a page-by-page audit of which ones intend a full-page block vs partial-content
  gating is a separate investigation this pass didn't have verified answers
  for — inventing a stricter rule there risked locking out a legitimate view
  (e.g. `/dashboard/settings` isn't in any role's `getNavigationItems()` list
  despite `settings:view` being universal — a nav-item-derived gate would have
  silently locked everyone out of it).

---

## Part B — Migrate pages, safest → riskiest

Each step: swap inline `user.role === '...'` checks for `usePermissions(user.role)`
+ `hasPermission`/`PermissionGuard`/`withPermissions`, or (for ownership checks)
`canActOnOwnRecord()` from A4. Manually verify in-browser per affected role after
each step — see Verification.

1. [x] `app/dashboard/super-admin/packages/page.tsx`,
   `app/dashboard/super-admin/financial/page.tsx` — replace manual
   `if (role !== "super_admin")` with `withPermissions()`
   (`packages:view` / `financial:view_all`). Zero interactivity risk.
   *(Implemented as an inline `permissions.hasPermission()` check rather than
   the `withPermissions()` HOC — the HOC needs `userRole` injected as an
   external prop, which doesn't fit a Next.js page component with no injectable
   props. Same source of truth, same result.)*

2. [x] `app/dashboard/reports/new/page.tsx`,
   `app/dashboard/reports/[id]/edit/page.tsx` — swap parent-redirect +
   return-null pair for `reports:create` check. Identical pattern in both.

3. [x] `app/dashboard/invoices/page.tsx` — swap the single `isAdmin` flag for
   `hasPermission('invoices:manage')` (or `billing:manage`, per A1's decision).

4. [x] `app/dashboard/therapists/page.tsx` — already mostly migrated; close the
   remaining gap (super_admin-only leave button → `therapists:manage_leave`).

5. [x] `app/dashboard/attendance/page.tsx` — swap the 3 checks to
   `attendance:view`/permission-based; fix the semantic bug where
   `role !== 'admin'` incorrectly shows super_admin a "personal history" section
   it doesn't have. *(Also fixed: the same bug accidentally exposed the section
   to `parent`, who has no attendance record at all — now `therapist`-only.)*

6. [x] `components/layout/dashboard-sidebar.tsx` — migrate the one leftover raw
   `role !== 'admin' && role !== 'therapist' && role !== 'super_admin'` fetch-gate
   check; the rest of this file is already the reference implementation.
   *(Migrated to `reports:resolve_comment`.)*

7. [x] `app/dashboard/reports/page.tsx` (`canResolve`/`seenBy` in its
   `ReportViewDialog` sub-component, lines ~531/707) — migrated to
   `canActOnOwnRecord()` and `reports:view_seen_by`.
   *(Correction: earlier drafts of this plan and `docs/ROLE_ARCHITECTURE.md`
   mis-cited this logic as living in `components/schedule/session-report-modal.tsx`
   — that component has no role/comment logic at all. Fixed in both docs.)*

8. [x] `app/dashboard/page.tsx` — migrated financial cards → `financial:view_all`,
   `RecentActivityWidget` → `dashboard:activity`. *(Left the birthdays-widget
   check as an explicit role check — no existing `Permission` key fits "admin/
   super_admin/therapist, not parent" and borrowing an unrelated one just
   because the role set happens to match would be a worse fit, not a cleanup.)*
   Leave the top-level admin/therapist/parent → different-component
   routing as an explicit role switch (matches `dashboard/stats/route.ts`'s
   existing pattern) — that's a "which UI shape" dispatch, not a permission
   yes/no, so forcing it into `hasPermission()` would be a worse fit.

9. [x] `app/dashboard/patients/[id]/page.tsx` — migrated 6 admin/super_admin
   checks to `patients:edit`/`patients:assign`. *(`canFillResult` deliberately
   left as a direct role+ownership check — it requires exactly
   `role === 'therapist'` with no admin bypass, which doesn't fit
   `canActOnOwnRecord()`'s "elevated roles always pass" shape.)*

10. [x] `app/dashboard/patients/page.tsx` — migrated 6 of 12 checks to
    `users:view` (parent-roster fetch/display/empty-state — discovered these were
    really gated by "can see the admin user roster," not a patients:* permission),
    `users:create` ("Tambah Orang Tua"), `patients:edit` (list-view edit button).
    *(Left 6 as explicit role checks, consistent with the B8 precedent:
    `getPageTitle`/`getPageDescription` switches are copy dispatch, not
    permission gates — did not fold them into `PermissionChecker` since that
    would mix page-specific content strings into an authorization utility; the
    parent-vs-staff top-level render-tree split is UI-shape dispatch like
    `dashboard/page.tsx`'s; button label and search-placeholder text are
    cosmetic; the admin-exclusion around the "Tambah Pasien/Anak" button is a
    UI-flow choice — admin creates patients via a different flow — already
    safety-netted by the nested `PermissionGuard`.)*

11. [x] `app/dashboard/schedules/page.tsx` — migrated 8 of 13 checks:
    `fetchLeaves` and dropdown-data fetch, "Tambah Slot"/"add slot in cell"
    buttons, edit-on-click, `showTabs`, therapist legend →
    `schedules:manage_all`/`schedules:view_own`; assessment-click →
    `assessments:manage`; `isParentView` → capability-based
    (`!hasAnyPermission(['schedules:edit','schedules:manage_all'])`, a genuine
    permission equivalent — parent is read-only precisely because it lacks any
    schedule-edit capability, not by arbitrary role literal).
    *(Left 3 unmigrated: the `fetchSlots` therapist-own-reports fetch shape
    and the header subtitle are copy/data-shape dispatch, not permission gates;
    `isOwn` is a strict `role === 'therapist'` + ownership check with no
    admin/super_admin bypass — same reasoning as B9's `canFillResult`, doesn't
    fit `canActOnOwnRecord()`'s "elevated roles always pass" shape.)*
    **Still needs manual in-browser QA** (this doc doesn't run the app): create/
    edit/delete slot as admin, own-slot report flow as therapist, read-only view
    as parent, assessment scheduling as admin.

---

## Part C — API route follow-on (smaller, separable, fixes a live bug)

- [x] Replaced the 3 duplicated report-ownership functions with a single shared
  `canAccessReport()` in new file `lib/utils/report-access.ts` (server-only —
  it needs Mongoose/the `Child` model, which can't live in `permissions.ts`
  since that file is imported by `"use client"` pages and would leak
  server-only code into the client bundle). `reports/[id]/route.ts`,
  `reports/[id]/comments/route.ts`, and `reports/[id]/media/route.ts` all now
  import it. This fixed the `super_admin` omission bug in
  `reports/media/route.ts` POST/DELETE as a side effect of deduplication —
  `canActOnOwnRecord()`'s `elevatedRoles` bypass covers both `admin` and
  `super_admin` uniformly.
- [x] Added the missing access-scope check to
  `app/api/reports/[id]/reactions/route.ts` (extended its `.select()` to
  include `childId`/`therapistId`, added the `canAccessReport()` check) and
  `app/api/reports/[id]/seen/route.ts` (this one fetched no report document at
  all before mutating — now fetches, 404s if missing, 403s if inaccessible,
  before writing).
- [ ] Left the remaining ~12 files with retyped admin-or-super_admin triads
  (could use `withAdminAuth` instead) as later cleanup — style duplication, not
  a bug, lower priority than the two items above. Not done in this pass.

---

## Verification

- After Part A: `npx tsc --noEmit` (from `hearty-bridge/`) — confirms the extended
  `Permission` union and new helper compile cleanly with no broken callers.
- After each Part B step: start the dev server per this repo's WSL convention and
  manually click through the migrated page as each affected role — confirm no
  visible behavior change. Type-checking will not catch a permission regression on
  a live app with real accounts; only in-browser testing will.
- After Part C: re-verify `reports/media` upload/delete as `super_admin`
  (previously broken) and `reactions`/`seen` as an unrelated `parent`/`therapist`
  (previously unchecked) to confirm both are now correctly blocked/allowed.

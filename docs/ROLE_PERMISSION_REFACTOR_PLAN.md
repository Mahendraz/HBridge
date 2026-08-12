# Plan: Make `PermissionChecker` the Real Source of Truth

> Status: proposed, not yet implemented. Companion to `docs/ROLE_ARCHITECTURE.md`
> (how the current system works) and `docs/DASHBOARD_VIEWS_BY_ROLE.md` (per-page
> role behavior today).

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

- [ ] **A1. Add missing `Permission` keys** found in real code but absent from the
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

- [ ] **A2. Reconcile `patients:delete`** — currently granted to admin/super_admin
  in `ROLE_PERMISSIONS`, but the only real `DELETE /api/children/[id]` route is
  parent-only (removing their own child). Split into `patients:delete`
  (admin/super_admin, currently unused, keep for future) and new
  `patients:delete_own` (parent) mapped to the actual route.

- [ ] **A3. Fix the broken `canView`/`canEdit`/`canCreate`/`canDelete` maps** on
  `PermissionChecker` — they're inconsistent with the `Permission` union today:
  - `canEdit("reports")` maps to `"reports:create"` (no `reports:edit` exists yet —
    fixed by A1; point it at the new key).
  - `canView("invoices")` / `canDelete("invoices")` have no entry at all despite
    invoices being gated in 2 real pages.
  Audit and correct all four maps against the full union.

- [ ] **A4. Add an ownership-check helper** — the biggest structural gap.
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

- [ ] **A5. Confirm `withPermissions()`/`PermissionGuard` fit** the two whole-page
  gates (`super-admin/packages`, `super-admin/financial`) that currently hand-roll
  `if (role !== "super_admin") return <AccessDenied/>`. No new code expected —
  just confirm during A5 implementation.

- [ ] **A6. Wire real per-route gating into `ProtectedRoute`** — today
  `app/dashboard/layout.tsx:26` passes all 4 roles, making the redirect gate a
  no-op beyond "must be logged in." Once pages declare their real required
  role/permission (Part B), thread it through so this becomes a real first line of
  defense instead of dead code.

---

## Part B — Migrate pages, safest → riskiest

Each step: swap inline `user.role === '...'` checks for `usePermissions(user.role)`
+ `hasPermission`/`PermissionGuard`/`withPermissions`, or (for ownership checks)
`canActOnOwnRecord()` from A4. Manually verify in-browser per affected role after
each step — see Verification.

1. [ ] `app/dashboard/super-admin/packages/page.tsx`,
   `app/dashboard/super-admin/financial/page.tsx` — replace manual
   `if (role !== "super_admin")` with `withPermissions()`
   (`packages:view` / `financial:view_all`). Zero interactivity risk.

2. [ ] `app/dashboard/reports/new/page.tsx`,
   `app/dashboard/reports/[id]/edit/page.tsx` — swap parent-redirect +
   return-null pair for `reports:create` check. Identical pattern in both.

3. [ ] `app/dashboard/invoices/page.tsx` — swap the single `isAdmin` flag for
   `hasPermission('invoices:manage')` (or `billing:manage`, per A1's decision).

4. [ ] `app/dashboard/therapists/page.tsx` — already mostly migrated; close the
   remaining gap (super_admin-only leave button → `therapists:manage_leave`).

5. [ ] `app/dashboard/attendance/page.tsx` — swap the 3 checks to
   `attendance:view`/permission-based; fix the semantic bug where
   `role !== 'admin'` incorrectly shows super_admin a "personal history" section
   it doesn't have.

6. [ ] `components/layout/dashboard-sidebar.tsx` — migrate the one leftover raw
   `role !== 'admin' && role !== 'therapist' && role !== 'super_admin'` fetch-gate
   check; the rest of this file is already the reference implementation.

7. [ ] `app/dashboard/reports/page.tsx` + `components/schedule/session-report-modal.tsx`
   (together — share `canResolve` ownership logic and `reports:view_seen_by` gate).
   Requires A4.

8. [ ] `app/dashboard/page.tsx` — migrate true permission gates (financial cards →
   `financial:view_all`, `RecentActivityWidget` → `dashboard:activity`, birthdays
   widget). Leave the top-level admin/therapist/parent → different-component
   routing as an explicit role switch (matches `dashboard/stats/route.ts`'s
   existing pattern) — that's a "which UI shape" dispatch, not a permission
   yes/no, so forcing it into `hasPermission()` would be a worse fit.

9. [ ] `app/dashboard/patients/[id]/page.tsx` — migrate admin/super_admin edit
   controls to `patients:edit`/`patients:assign`; migrate `canFillResult` to
   `canActOnOwnRecord()`.

10. [ ] `app/dashboard/patients/page.tsx` — highest raw check count (~13), two
    fully-duplicated render trees (parent child-cards vs admin/therapist list).
    Migrate individual checks (`patients:create`, `patients:view_own` vs
    `patients:view`/`patients:view_assigned`); collapse the duplicated
    `getPageTitle`/`getPageDescription` switches to reuse the
    `getDashboardTitle()`-style pattern instead of a third reimplementation.
    Budget extra review time.

11. [ ] `app/dashboard/schedules/page.tsx` — do last. Role logic reaches into
    conditional data-fetching (`fetchLeaves`, dropdown data, reports fetch),
    child-component props (`isOwn`/`isParentView` into `SlotCard`), and modal tab
    visibility (`showTabs`). Migrate incrementally within the file, not as one
    sweep. Budget the most manual QA: create/edit/delete slot as admin, own-slot
    report flow as therapist, read-only view as parent, assessment scheduling as
    admin.

---

## Part C — API route follow-on (smaller, separable, fixes a live bug)

- [ ] Replace the 3 duplicated report-ownership functions
  (`reports/[id]/route.ts`, `reports/[id]/comments/route.ts`,
  `reports/[id]/media/route.ts`) with `canActOnOwnRecord()` from A4 — fixes the
  `super_admin` omission bug in `reports/media/route.ts` as a side effect of
  deduplication.
- [ ] Add the missing access-scope check to
  `app/api/reports/[id]/reactions/route.ts` and `app/api/reports/[id]/seen/route.ts`,
  which currently let any authenticated user react to / mark-seen an arbitrary
  report ID with no ownership check at all.
- [ ] Leave the remaining ~12 files with retyped admin-or-super_admin triads
  (could use `withAdminAuth` instead) as later cleanup — style duplication, not a
  bug, lower priority than the two items above.

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

# Role & Access Control Architecture — Hearty Bridge

> How `super_admin` / `admin` / `therapist` / `parent` are defined, propagated, and enforced
> across the DB, API, and frontend layers. Complements `DASHBOARD_VIEWS_BY_ROLE.md`, which
> documents the resulting per-page UI differences — this file documents the *mechanism*.

---

## 1. Where the role lives

The role is a plain string field on the `User` document — there is no separate
Role/Permission collection.

| Layer | File | Notes |
|---|---|---|
| DB schema | `models/User.ts:9` | `role: 'admin' \| 'therapist' \| 'parent' \| 'super_admin'`, enum-validated by Mongoose |
| Frontend type | `lib/types/auth.ts:4` | `export type UserRole = "admin" \| "therapist" \| "parent" \| "super_admin"` |
| JWT payload | `lib/utils/jwt.ts:9` | `JWTPayload { userId, email, role, name }` |

`super_admin` and `admin` are treated identically almost everywhere. `super_admin`
only gets a small set of exclusive things: packages management, system-wide
financial reports, and the "recent activity" dashboard widget.

---

## 2. How role reaches every request — the JWT, not a DB lookup

1. On login/register (`app/api/auth/*`), the server signs a JWT
   (`lib/utils/jwt.ts:38`, `generateAccessToken`) embedding `role`.
2. The frontend stores the token in `localStorage["token"]`
   (`lib/contexts/auth-context.tsx:75`) and sends it as
   `Authorization: Bearer <token>` on every fetch.
3. On the backend, `getUserFromRequest()` (`lib/utils/jwt.ts:135`) verifies and
   decodes the JWT, handing back `{ userId, role, ... }` — **no DB read** unless
   the route explicitly asks for one.

**Consequence:** a role change (or account deactivation) doesn't take effect for
an already-logged-in user until either they log in again, or the route opts into
`requireActive` / `checkDatabase` (see below), which re-reads `role`/`isActive`
from Mongo on every request.

---

## 3. Backend enforcement — two layers, used inconsistently

### Layer A — role-gated middleware wrappers

`lib/middleware/auth.ts` exports pre-built wrappers around a core `withAuth()`:

```ts
withAnyAuth(handler)        // any of admin / therapist / parent / super_admin
withAdminAuth(handler)      // admin, super_admin
withSuperAdminAuth(handler) // super_admin only
withTherapistAuth(handler)  // therapist only
withParentAuth(handler)     // parent only
```

Each is `withAuth(handler, { allowedRoles, requireActive: true, checkDatabase: true })`.
When `checkDatabase`/`requireActive` is set, the middleware queries Mongo to confirm
`isActive` and refresh `role` — this is the mechanism that catches a stale JWT after
a role change or account deactivation (`lib/middleware/auth.ts:66-96`).

### Layer B — inline role checks inside the handler

Several routes use the permissive `withAnyAuth` and then hand-roll per-role query
scoping *inside* the handler, because the access rule isn't "allow/deny" but
"which subset of the collection can this role see":

**`app/api/reports/route.ts`**
- `GET` (line 36): no role restriction on who can call it, but the Mongo query is
  scoped per role —
  - `parent` (line 56): looks up the caller's own `Child` docs, then filters
    `Report.find({ childId: { $in: childIds } })`.
  - `therapist` (line 64): `query.therapistId = user.userId`.
  - `admin` / `super_admin`: no filter, sees everything.
- `POST` (line 110): explicitly 403s `parent` (line 112). For `therapist`
  (line 147), it cross-checks the target child actually appears on that
  therapist's `WeeklySchedule` before allowing report creation — a therapist
  cannot write a report for a patient they aren't assigned to.

**`app/api/weekly-schedule/route.ts`**
- `GET` (line 61): same pattern — `parent` (line 90) is scoped to their own
  children's slots; therapist/admin/super_admin see everything unfiltered.
- `POST` (line 308) / `DELETE` (line 495): hard role check
  `user.role !== 'admin' && user.role !== 'super_admin'` → 403. Only admins
  (and super_admins) may create/edit/delete schedule template slots.

This hand-rolled-per-route scoping is more fragile than a declarative permission
check (easy to forget a role branch on a new endpoint) but is how ownership-based
filtering is implemented today, since the *shape* of the Mongo query differs per
role, not just whether the call is allowed.

---

## 4. Frontend — three concentric gates

1. **`AuthProvider` / `useAuth`** (`lib/contexts/auth-context.tsx`) — holds
   `user` (incl. `role`) in React state, hydrated from `GET /api/auth/me` using
   the stored token on app load.
2. **`ProtectedRoute`** (`components/auth/protected-route.tsx:31`) — wraps every
   dashboard page via `DashboardLayout` → `ProtectedRoute`. Redirects to
   `/auth/login` if unauthenticated, or to `/dashboard` if `user.role` isn't in
   `allowedRoles`. In practice `app/dashboard/layout.tsx:26` passes all four
   roles, so today this gate only enforces "must be logged in," not per-page
   role restriction.
3. **Per-page / per-component conditionals** — where the actual role branching
   happens, all hand-written `user.role === '...'` checks:
   - `app/dashboard/page.tsx:194` — `const role = user?.role ?? "parent"`, then
     renders `AdminMainContent` / `TherapistMainContent` / `ParentMainContent`;
     further branches super_admin-only widgets (`RecentActivityWidget`, line 518;
     financial stat cards, line 343).
   - `app/dashboard/schedules/page.tsx` — admins/super_admins get
     create/edit/delete controls and full dropdown data (lines 1798, 1934, 1956,
     1975); therapists get a read/leave-request view (line 1838); parents get
     `isParentView` (line 1950), which strips all interactive controls.
   - `app/dashboard/reports/page.tsx:531` (inside the `ReportViewDialog`
     sub-component) —
     `canResolve = admin || super_admin || (therapist && report.therapistId === user._id)`,
     mirroring the backend ownership rule in the UI. As of the permissions
     refactor this is now `canActOnOwnRecord()` from `lib/utils/permissions.ts`
     — see `docs/ROLE_PERMISSION_REFACTOR_PLAN.md`.
   - `app/dashboard/reports/page.tsx:707` — hides the "seen by" read-receipt
     row from parents (now `reports:view_seen_by`).

> Correction (post-refactor): an earlier version of this doc mis-cited the
> `canResolve`/`seenBy` logic above as living in
> `components/schedule/session-report-modal.tsx`. That component has no
> role/comment logic at all — the checks are in `app/dashboard/reports/page.tsx`.
> Fixed here.

---

## 5. Two parallel authorization systems coexist

`lib/utils/permissions.ts` defines a fully declarative RBAC layer: a `Permission`
string-union type, a `ROLE_PERMISSIONS` map per role, and a `PermissionChecker`
class (`hasPermission`, `canView`, `canEdit`, `filterData`, `getNavigationItems`,
`getDashboardWidgets`), plus a `PermissionGuard` component and `withPermissions`
HOC.

In practice, only two call sites consume it:
- `components/layout/dashboard-sidebar.tsx:75` —
  `usePermissions(user.role).getNavigationItems()` drives the sidebar menu.
- `app/dashboard/layout.tsx:16` — `getDashboardTitle()` / `getDashboardDescription()`.

Every other role-dependent UI decision (dashboard widgets, reports, schedules,
patients, therapists, invoices) uses raw `user.role === '...'` string comparisons
instead. **Adding a new permission to `permissions.ts` alone will not gate
anything outside the sidebar/page title** — it has to be threaded through the
individual page/component by hand, same as everywhere else.

---

## 6. Capability matrix

| Capability | super_admin | admin | therapist | parent |
|---|---|---|---|---|
| See all patients / reports / schedules | ✅ | ✅ | ❌ assigned only | ❌ own children only |
| Create / edit weekly schedule slots | ✅ | ✅ | ❌ view own only | ❌ view own only |
| Create reports | ✅ | ✅ | ✅ assigned patients only | ❌ 403'd server-side |
| Resolve report comments | ✅ | ✅ | own reports only | ❌ |
| Packages / system financial reports | ✅ exclusive nav | ❌ | ❌ | ❌ |
| Recent activity widget | ✅ | ❌ | n/a | ❌ |

---

## 7. Practical implications when adding a new role-gated feature

- **New API route:** wrap with the narrowest `lib/middleware/auth.ts` helper
  that fits (`withAdminAuth`, `withTherapistAuth`, etc.) rather than
  `withAnyAuth` + a manual check, unless the route genuinely needs per-role
  query scoping (in which case follow the `reports`/`weekly-schedule` pattern
  above).
- **New dashboard page/widget:** there is no page-level role guard by default
  (`ProtectedRoute` currently allows all four roles into `/dashboard/*`) — the
  page itself must check `user.role` and branch/redirect.
- **New permission concept:** decide whether it belongs in `permissions.ts`
  (only wired into sidebar nav + dashboard title today) or as an inline
  `user.role === '...'` check (the pattern used by every actual feature page) —
  mixing the two without wiring `permissions.ts` into the page will silently do
  nothing.

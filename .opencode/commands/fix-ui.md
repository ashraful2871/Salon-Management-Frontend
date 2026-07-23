# /fix-ui — Skeleton Loading, Instant Navigation & Real-Time Data Sync

## Role

You are an AI coding agent working inside **Salon-Management-Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui (New York style) + Radix UI primitives, consuming an external REST API at `NEXT_PUBLIC_API_URL`. **Read `AGENTS.md` before starting** — it holds the project's standing AI-agent guidelines; this command adds to it, it does not override it.

## Project Context

- Framework: Next.js 16 App Router · React 19 · TypeScript 5
- Styling: Tailwind CSS v4 — config lives in `src/app/globals.css` (no `tailwind.config.ts` in v4 style), plus `tw-animate-css`
- UI: shadcn/ui (New York) in `src/components/ui/` (19 primitives), Radix UI, Lucide icons, Framer Motion for animation
- Forms: React Hook Form + Zod
- Toasts: `sonner`, currently surfaced through wrapper components in `src/components/Shared/` (e.g. the Login/Logout success toast pattern)
- Auth: JWT in httpOnly cookies; `src/lib/server-fetch.ts` is the server-side fetch wrapper that attaches the cookie
- API layer: `src/services/<domain>/` — **one exported async function per file**, every function returns `{ success, message, data }`, error messages gated by `NODE_ENV`
- Types: `src/lib/api-types.ts` (Salon, Appointment, User, etc.)
- Path alias: `@/*` → `./src/*`
- Package manager: Bun (`bun dev`, uses `--webpack`, **not** Turbopack)
- No test framework configured — do not add one as part of this task
- `next.config.ts` allows all image `remotePatterns` already — no change needed there

### Route Groups

| Group                     | Layout                        | Access                                                                    |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `(auth)`                  | none                          | Public — login/register                                                   |
| `(commonLayout)`          | Navbar + Footer               | Public — home, about, contact, salons, ai-suggestions, become-salon-owner |
| `(dashboardLayout)`       | Sidebar + role-based redirect | Authenticated                                                             |
| `(commonProtectedLayout)` | nested inside dashboard       | Authenticated                                                             |

### Data-fetching routes in scope

- `(commonLayout)/salons` and `salons/detail/[id]`
- `(commonLayout)/ai-suggestions`
- `(dashboardLayout)/dashboard` (analytics overview)
- `(dashboardLayout)/dashboard/appointments`
- `(dashboardLayout)/dashboard/approval-salon`
- `(dashboardLayout)/dashboard/applications-status`
- `(dashboardLayout)/dashboard/become-a-salon-owner-request`
- `(dashboardLayout)/dashboard/customers`
- `(dashboardLayout)/dashboard/services`
- `(dashboardLayout)/dashboard/store` and `store/[detail]`
- `(dashboardLayout)/dashboard/admin/agents`
- `(dashboardLayout)/my-profile`

## Hard Rules (non-negotiable)

1. **Additive only.** Never remove or break a currently working feature.
2. **No `any`.** Keep TypeScript strict; use the interfaces already defined in `src/lib/api-types.ts` — extend them rather than redefining shapes.
3. **Mobile-first.** Verify every change at 375px, 768px, and 1440px.
4. **Reuse before creating.** Extend `SkeletonCard`/`SkeletonHero` into a family instead of duplicating patterns.
5. **No new dependencies.** Everything in this task is achievable with what's already installed (native Next.js fetch/caching, React 19, sonner). Do not add a data-fetching library.
6. **Match existing design tokens.** Use the Tailwind v4 tokens already defined in `globals.css` (`gold`, `gold-light`, `gold-dark`, `cream`, `cream-dark`, `charcoal`, `charcoal-light`, `rose`, `rose-light`, `sage`, `sage-light`) and the Playfair Display font — no ad-hoc colors/fonts.
7. **Respect the service layer contract.** Every service/action must still return `{ success, message, data }`. Don't change that shape.
8. **Server Components by default.** Only add `"use client"` where interactivity genuinely requires it. Never import `jsonwebtoken` in a client component.
9. **Leave auth alone.** Don't modify `login.ts`, `cookiesHandler.ts`, or the existing auth flow — it's out of scope for this task.
10. **Ship complete code.** No `// TODO`, no placeholder logic, no half-wired components.

---

## Objective

Three coordinated improvements, in this order of priority:

1. Skeleton loading everywhere data is fetched (no blank screens, no layout shift)
2. Zero-delay route navigation (previous UI stays visible/interactive until the next view is ready)
3. Real-time UI updates on data mutation (create/update/delete reflect instantly, without a manual refresh)

---

## Task 1 — Skeleton Loading System (Perceived Performance)

**Problem:** Views show a blank screen or a generic spinner while fetching, and content "pops in," causing layout shift.

**Fix:**

- Add a `loading.tsx` to every data-fetching route segment listed above — Next.js App Router's built-in Suspense boundary, and the first line of defense.
- At the component level, wrap client-side data-fetching sections in `<Suspense fallback={<SkeletonX />}>`.
- Expand the current two skeletons (`SkeletonCard`, `SkeletonHero` in `src/components/Shared/`) into a full family, each matching the **exact dimensions and layout** of the real content it replaces (1:1 shape, zero layout shift on swap-in):
  - `SkeletonCard` (exists — reuse for `salons` listing, `SalonCard` grid)
  - `SkeletonHero` (exists — reuse for `salons/detail/[id]`)
  - `SkeletonTable` — `dashboard/appointments`, `dashboard/approval-salon`, `dashboard/become-a-salon-owner-request`, `dashboard/customers`, `dashboard/admin/agents`
  - `SkeletonList` — `dashboard/services`, `dashboard/applications-status`
  - `SkeletonStat` — `dashboard` analytics overview cards
  - `SkeletonForm` — `dashboard/store` (create/edit salon), `dashboard/settings`, `my-profile`
- Use `animate-pulse` (Tailwind built-in) or a custom shimmer keyframe, styled with the existing `charcoal`/`cream` token pair so it matches the theme in both light/dark contexts (note: `ThemeProvider` exists but isn't active in root layout yet — build skeletons to work correctly whenever it is, don't wire up dark mode activation as part of this task).
- Rule of thumb: **any grid/list/table/detail view gets a shaped skeleton, never a spinner-only screen.**

---

## Task 2 — Instant Navigation (No Blank/Delay on Route Change)

**Problem:** Clicking a nav link (Navbar, DashboardSidebar) freezes the page or shows blank white space until the next route's data resolves.

**Fix:**

- Add a global top progress bar (NProgress-style) that triggers on route change. Implement as a small client component listening to `usePathname()`/`useSearchParams()`, mounted once in the root layout so it covers both `(commonLayout)` and `(dashboardLayout)`.
- Confirm each route group's layout isolates its persistent shell — `Navbar`/`Footer` in `(commonLayout)`, `DashboardSidebar` in `(dashboardLayout)` — from the route content, so only the content area suspends/re-renders on navigation, never the shell.
- Use `useTransition` + `startTransition` for client-triggered navigations inside the dashboard (filter clicks, tab switches on `dashboard/appointments`, `dashboard/approval-salon`, etc.) so the current UI stays interactive while the next view loads.
- Use `<Link prefetch>` (Next.js default) on all `Navbar` and `DashboardSidebar` links.
- Sequence on every navigation: **previous content stays visible → top progress bar appears → route's `loading.tsx` skeleton shows only if the transition exceeds a short threshold → real content replaces skeleton.**

---

## Task 3 — Real-Time Data Synchronization (Next.js Native — no client cache library)

**Problem:** After create/update/delete (approving a salon, updating an appointment status, adding a service/staff member), the UI doesn't reflect the change until a manual page refresh.

**Fix — built entirely on the existing `serverFetch` wrapper, native fetch tagging, Server Actions, and `revalidateTag`:**

- **Extend `src/lib/server-fetch.ts`** to accept and forward an optional `next: { tags?, revalidate? }` param through to the underlying `fetch` call, so every server-side GET already going through `serverFetch` can be tagged consistently without duplicating the wrapper:
  ```ts
  serverFetch("/salons", { next: { tags: ["salons"] } });
  serverFetch("/owner-requests", { next: { tags: ["owner-requests"] } });
  serverFetch("/appointments", { next: { tags: ["appointments"] } });
  ```
- **Convert the mutating functions in these service domains into Server Actions** (`'use server'`), kept in their existing `src/services/<domain>/` files to preserve the current one-function-per-file convention and the `{ success, message, data }` return contract:
  - `salon` — approve/reject, status updates
  - `become-a-salone-woner` — approve/reject application
  - `appoinments` — update status, cancel
  - `service` — create/update/delete
  - `staff` — add/delete
  - `counter` — create
  ```ts
  "use server";
  export async function approveSalon(id: string) {
    const res = await serverFetch(`/salons/${id}/approve`, { method: "PATCH" });
    if (!res.success) return res;
    revalidateTag("salons");
    revalidateTag("owner-requests");
    return res;
  }
  ```
- **Instant feedback:** in the client component that calls the action (dashboard tables/cards), wrap local state in React 19's `useOptimistic` so the row updates on click immediately, then reconciles once the action resolves — auto-revert on `success: false`.
- **Sync the rest of the page:** after the action resolves, call `router.refresh()` (`next/navigation`) so any Server Component on the current route re-renders with the newly revalidated data — no client cache to manage.
- **Freshness tuning per view, not globally:**
  - `dashboard/approval-salon` and `dashboard/become-a-salon-owner-request` (Admin/Agent-facing, low tolerance for stale data): `{ cache: 'no-store' }` or `revalidate: 10`
  - `salons` listing, `dashboard/services`, `dashboard/customers`: `revalidate: 30–60`
- Do not add WebSocket/SSE — out of scope unless explicitly requested later.
- Do not touch the auth service files — they intentionally use plain `fetch` via server actions already.

---

## Task 4 — Error, Retry & Feedback UX

- Route every success/failure through `sonner`'s `toast()`. Consolidate the existing `LoginSuccessToast`/`LogoutSuccessToast` pattern in `src/components/Shared/` into one reusable helper (e.g. `useAppToast` or a plain `showResultToast(result)` that reads the service's `{ success, message }` shape) so every mutation across `Dashboard`, `ApprovalSalon`, `OwnerRequest`, etc. calls the same function instead of one-off components.
- Failed fetches show a retry action inside the skeleton's space — never a dead blank state.
- State machine per view: `skeleton → (success: real content) | (error: retry state)`. Never leave an infinite spinner as an end state.

---

## Suggested Additions

**None.** Everything above uses what's already installed — native `fetch` caching/tags, Server Actions, `revalidateTag`, React 19's `useOptimistic`, and `sonner`. Do not add a data-fetching library.

---

## Priority File Scope (work in this order)

1. `src/components/Shared/*` — build out the skeleton family
2. `src/lib/server-fetch.ts` — extend to forward `next: { tags, revalidate }`
3. `src/app/**/loading.tsx` — add to each route segment listed under "Data-fetching routes in scope"
4. `src/services/{salon,become-a-salone-woner,appoinments,service,staff,counter}/*` — convert mutations into tagged Server Actions with `revalidateTag`
5. `src/components/Dashboard/*`, `Salons/*`, `ApprovalSalon/*`, `OwnerRequest/*` — wire skeletons + `useOptimistic` mutations
6. `src/components/layout/*` — add top progress bar, confirm shell isolation (Navbar/Footer and DashboardSidebar)
7. `src/components/Shared/*Toast*` — consolidate into one reusable toast helper

---

## Definition of Done

- [ ] No blank/white screen on any navigation — skeleton or previous content is always visible
- [ ] Every list/detail/dashboard view (across Customer, Staff, Salon Owner, Admin, Agent) has a skeleton matching its real layout shape (zero CLS)
- [ ] Create/update/delete actions reflect in the UI immediately (optimistic), then reconcile with the API response
- [ ] Top progress bar fires on every route change, in both `(commonLayout)` and `(dashboardLayout)`
- [ ] Failed requests show a retry option, never a dead end
- [ ] Verified responsive at 375px / 768px / 1440px
- [ ] `{ success, message, data }` contract preserved on every converted service/action
- [ ] No existing feature broken or removed, auth flow untouched

---

## Execution Plan

1. Read `AGENTS.md` in full before making any change.
2. Audit current `serverFetch` usage and client-side service calls across the domains listed in Task 3.
3. Extend `src/lib/server-fetch.ts` to support `next: { tags, revalidate }`.
4. Build the full skeleton component family in `Shared`.
5. Add `loading.tsx` to each route segment in scope.
6. Migrate **one** route end-to-end first — recommend `dashboard/approval-salon` since it exercises both a list, a mutation (approve/reject), and needs low-staleness tolerance.
7. Replicate the same pattern across `dashboard/become-a-salon-owner-request`, `dashboard/appointments`, `dashboard/services`, `dashboard/customers`, `salons`.
8. Add the top progress bar and confirm both layout shells (`(commonLayout)`, `(dashboardLayout)`) persist correctly across navigation.
9. Consolidate toasts into a single reusable helper on top of `sonner`.
10. Run the Definition of Done checklist before marking complete.

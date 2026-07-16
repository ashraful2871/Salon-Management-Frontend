# AGENTS.md

## Project

Salon Management Frontend — Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript. Requires a running backend API (default `http://localhost:5000/api/v1`).

## Commands

- `bun dev` — dev server (uses `--webpack`, not Turbopack)
- `bun run build` — production build
- `bun run lint` — ESLint (core-web-vitals + typescript)
- No test framework is configured

## Path Alias

`@/*` maps to `./src/*`. Always use `@/` imports.

## Route Groups

Route folders under `src/app/` use Next.js route groups (parenthesized names):

| Group | Purpose |
|---|---|
| `(auth)` | Login, register — no shared layout chrome |
| `(commonLayout)` | Public pages with Navbar + Footer |
| `(dashboardLayout)` | Authenticated dashboard — sidebar layout, fetches user role server-side |
| `(commonProtectedLayout)` | Nested inside dashboard — profile etc. |

Layout nesting: root layout → route group layout → page.

## Auth & Cookies

- JWT tokens (`accessToken`, `refreshToken`) stored as httpOnly cookies via `src/services/auth/cookiesHandler.ts` (server actions with `"use server"`).
- `src/lib/server-fetch.ts` — server-side fetch wrapper that attaches the accessToken cookie. Use this for all server-side API calls.
- Client-side API calls should go through service functions in `src/services/`.
- Roles: `CUSTOMER | STAFF | SALON_OWNER | ADMIN | AGENT | GUEST` (defined in `src/services/auth/auth-utils.ts`).

## Service Layer Pattern

All API calls live in `src/services/<domain>/`. Each file exports a single async function that uses `serverFetch` (or `fetch` for auth). Services return `{ success, message, data }` objects. Error messages are dev-prod gated via `NODE_ENV`.

## UI Components

- **shadcn/ui** — "new-york" style, components in `src/components/ui/`. Add new ones via `npx shadcn@latest add <component>`.
- **Radix UI** primitives for accessible behavior.
- **Lucide React** for icons.
- **Framer Motion** for animations.
- **sonner** for toast notifications (Toaster mounted in root layout).
- **react-hook-form + zod** for forms. Resolvers in devDependencies.

## Styling

- Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config.ts` — config is in `globals.css`).
- Custom color tokens: `gold`, `gold-light`, `cream`, `charcoal`, `rose`, `sage` (defined as CSS custom properties in `globals.css`).
- `cn()` utility from `@/lib/utils` (clsx + tailwind-merge).
- Font: Playfair Display (serif) applied globally via root layout.

## Gotchas

- `dev` script uses `--webpack` flag explicitly; do not switch to Turbopack without checking compatibility.
- `jsonwebtoken` is used server-side for token verification — never import in client components.
- Server components are the default (`rsc: true` in components.json). Mark client files with `"use client"` explicitly.
- `.env` is gitignored. Copy values from README if setting up fresh.
- No `tailwind.config.ts` exists — all Tailwind/theming config lives in `src/app/globals.css`.

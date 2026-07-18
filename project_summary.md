# Salon Management Frontend — Project Summary

## Overview

A modern, full-featured **salon management platform** built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**. The frontend enables salon discovery, appointment booking, role-based dashboards (Customer, Staff, Salon Owner, Admin, Agent), and complete salon/service/staff management. It consumes a separate REST backend API (default `http://localhost:5000/api/v1`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` |
| **UI Components** | shadcn/ui (New York style) + Radix UI primitives |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Forms & Validation** | React Hook Form + Zod |
| **Theming** | next-themes (dark/light) |
| **Toasts** | sonner |
| **Auth** | JWT (jsonwebtoken server-side) + httpOnly cookies |
| **Package Manager** | Bun (npm lockfile also present) |
| **Linting** | ESLint (core-web-vitals + TypeScript) |

---

## Project Structure

```
Salon-Management-Frontend/
├── public/                         # Static assets (SVGs)
├── src/
│   ├── app/                        # Next.js App Router pages & layouts
│   │   ├── (auth)/                 # Login & Register (no chrome)
│   │   ├── (commonLayout)/         # Public pages with Navbar + Footer
│   │   │   ├── page.tsx            # Home (Hero, Features, Bento, Services, Stats, Testimonials, CTA)
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── salons/             # Salon listings + detail/[id]
│   │   │   ├── ai-suggestions/     # AI-powered salon search
│   │   │   └── become-salon-owner/ # Apply to become a salon owner
│   │   ├── (dashboardLayout)/      # Dashboard with sidebar
│   │   │   ├── dashboard/          # Main dashboard + analytics
│   │   │   │   ├── admin/agents/   # Admin: manage agents
│   │   │   │   ├── appointments/   # Appointment management
│   │   │   │   ├── approval-salon/ # Approve/reject salon listings
│   │   │   │   ├── applications-status/ # Track owner applications
│   │   │   │   ├── become-a-salon-owner-request/ # Pending owner requests
│   │   │   │   ├── customers/      # Customer list
│   │   │   │   ├── services/       # Service management
│   │   │   │   ├── settings/       # Account settings
│   │   │   │   └── store/          # Salon store management + detail
│   │   │   └── my-profile/         # User profile
│   │   ├── api/                    # API routes (if any)
│   │   ├── layout.tsx              # Root layout (font, Toaster, auth toasts)
│   │   ├── globals.css             # Tailwind v4 config + theme tokens
│   │   └── not-found.tsx           # 404 page
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (19 components)
│   │   ├── layout/                 # Navbar, Footer, DashboardSidebar, LogoutButton
│   │   ├── Home/                   # Hero, Features, Services, Stats, Testimonials, BentoBox, CtaSection
│   │   ├── Auth/                   # LoginForm, RegisterForm
│   │   ├── Salons/                 # Salons, SalonDetails, BookAppointmentModal, ReviewModal, SalonCard
│   │   ├── Dashboard/              # Dashboard, Appointments, Services, Customers, Settings, Store, ManageSalon, modals
│   │   ├── BecomeASalonWoner/      # ApplyForm, PageHero, PageFeatures, PageStats
│   │   ├── About/ About.tsx
│   │   ├── Contact/ Contact.tsx
│   │   ├── AI-Suggestions/ AiSearchInterface.tsx
│   │   ├── ApprovalSalon/ ApprovalSalon.tsx
│   │   ├── OwnerRequest/ OwnerRequest.tsx, CheckStatus.tsx
│   │   ├── Shared/                 # SkeletonCard, SkeletonHero, SalonCard, toast components
│   │   └── theme-provider.tsx
│   ├── services/                   # API service layer (one file per endpoint)
│   │   ├── auth/                   # Login, Register, Logout, ChangePassword, CookiesHandler, auth-utils
│   │   ├── salon/                  # CRUD + status updates
│   │   ├── service/                # CRUD for salon services
│   │   ├── staff/                  # Add, Delete, Get staff by salon
│   │   ├── appoinments/            # Book, Cancel, Get, Update status
│   │   ├── counter/                # Create counter
│   │   ├── review/                 # Create review
│   │   ├── users/                  # Get all users, Get my customers
│   │   ├── dashboard/              # Dashboard stats
│   │   ├── ai/                     # AI search suggestions
│   │   ├── become-a-salone-woner/  # Apply, Check status, Approve, List applications
│   │   └── get-roles/              # Get user roles
│   ├── lib/
│   │   ├── server-fetch.ts         # Server-side fetch wrapper (attaches JWT cookie)
│   │   ├── utils.ts                # cn() utility (clsx + tailwind-merge)
│   │   └── api-types.ts            # TypeScript interfaces (Salon, Appointment, User, etc.)
│   ├── constants/
│   │   └── bangladesh-locations.ts # Divisions, districts, areas for location picker
│   └── assets/
│       └── hero-salon.jpg
├── tailwind.config.ts              # Tailwind theme extensions (colors, fonts, shadows)
├── next.config.ts                  # Images remotePatterns (allow all)
├── components.json                 # shadcn/ui config
├── postcss.config.mjs              # PostCSS with @tailwindcss/postcss
├── eslint.config.mjs               # ESLint flat config
├── tsconfig.json                   # TypeScript config (@/* → ./src/*)
├── AGENTS.md                       # AI agent development guidelines
├── project_summary.md              # This file
└── README.md
```

---

## Features & Roles

### Public (No Auth Required)
| Feature | Description |
|---|---|
| **Home Page** | Hero, Features grid, Bento box, Services overview, Stats counter, Testimonials carousel, CTA section |
| **About Page** | Company/mission info |
| **Contact Page** | Contact form/info |
| **Salon Listings** | Browse all salons with filters/search |
| **Salon Details** | View salon info, services, staff, reviews; book appointment |
| **AI Suggestions** | AI-powered salon search interface |
| **Become a Salon Owner** | Landing page + application form |
| **Login / Register** | JWT-based auth forms |

### Customer (Logged In)
| Feature | Description |
|---|---|
| **Dashboard** | Overview of appointments, spending, stats |
| **Book Appointments** | Select salon → service → staff → time slot |
| **My Appointments** | View/cancel upcoming appointments |
| **My Profile** | Edit personal information |
| **Write Reviews** | Rate and review visited salons |

### Salon Owner
| Feature | Description |
|---|---|
| **Store Management** | Create/update salon profile, operating hours, images |
| **Service Management** | Add, edit, delete services (name, price, duration, category) |
| **Staff Management** | Add/remove staff members with specialities |
| **Appointment Management** | View, confirm, complete, cancel appointments |
| **Counter Management** | Create service counters |
| **Customer List** | View customers who booked |
| **Application Status** | Check salon owner application status |
| **Dashboard** | Salon-specific analytics |

### Admin / Agent
| Feature | Description |
|---|---|
| **Full Dashboard** | Platform-wide stats (users, salons, appointments, revenue) |
| **Salon Approval** | Approve/reject pending salon listings |
| **Owner Requests** | Review and approve/reject salon owner applications |
| **Agent Management** | Create/manage agent accounts |
| **User Management** | View all users/customers |
| **Appointments** | View all platform appointments |
| **Services** | View all services across salons |

---

## Architecture

### Auth Flow
1. User submits credentials → client calls `login.ts` service → backend returns JWT tokens
2. Server action stores `accessToken` & `refreshToken` as **httpOnly cookies** (`cookiesHandler.ts`)
3. Server components use `serverFetch` (reads cookie, sends as `Cookie` header)
4. Client components call service functions that use plain `fetch` (cookies sent automatically)
5. Logout deletes cookies server-side

### Route Groups
| Group | Layout | Access |
|---|---|---|
| `(auth)` | None | Public |
| `(commonLayout)` | Navbar + Footer | Public |
| `(dashboardLayout)` | Sidebar + role-based redirect | Authenticated |
| `(commonProtectedLayout)` | Nested inside dashboard | Authenticated |

### Data Flow
```
Server Component → serverFetch (GET with JWT cookie) → Backend API → RSC render
Client Component → Service function (fetch) → Backend API → JSON → Client state
Server Action → Cookie handler → Auth service → Backend → Redirect
```

### Service Layer Pattern
- Each service file exports a single async function
- Returns `{ success, message, data }`
- Error messages are dev/prod gated via `NODE_ENV`
- Server-side services use `serverFetch`
- Auth services use plain `fetch` (handled by server actions)

---

## Styling & Theming

- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.ts` in v4 style — config is in `globals.css`)
- Custom color tokens: `gold`, `gold-light`, `gold-dark`, `cream`, `cream-dark`, `charcoal`, `charcoal-light`, `rose`, `rose-light`, `sage`, `sage-light`
- Font: **Playfair Display** (serif) applied globally
- Dark/light mode via `next-themes` (ThemeProvider available but not yet active in root layout)
- `cn()` utility for conditional class merging
- Framer Motion for animations
- sonner for toast notifications

---

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api/v1` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret | — |
| `ACCESS_TOKEN_SECRET` | Access token secret | — |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | — |

---

## Setup

```bash
bun install              # Install dependencies
# or: npm install

# Create .env with the variables above
bun dev                  # Dev server on http://localhost:3000
bun run build            # Production build
bun run lint             # ESLint
```

---

## Key Conventions

- Path alias `@/*` → `./src/*`
- All API calls in `src/services/<domain>/` — one function per file
- Server components by default; mark client components with `"use client"`
- `jsonwebtoken` is server-only — never import in client components
- `dev` script uses `--webpack` (not Turbopack)
- No test framework configured
- `shadcn/ui` components in `src/components/ui/` — add with `npx shadcn@latest add <component>`

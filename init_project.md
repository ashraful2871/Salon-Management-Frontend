# init_project.md — Project Functionality Overview

## Core Features

### Public-Facing
- **Home Page** — Hero section, salon highlights, call-to-action
- **Salon Listings** — Browse/search salons with filters (division, district, area, city)
- **Salon Detail** — View individual salon info, services, staff
- **About Page** — Company information
- **Contact Page** — Contact form/information
- **AI Suggestions** — AI-powered salon/service recommendations

### Authentication
- **Login** — Email + password, JWT-based, httpOnly cookie storage
- **Registration** — New user signup with role assignment
- **Password Change** — Authenticated password update
- **Role System** — `CUSTOMER`, `STAFF`, `SALON_OWNER`, `ADMIN`, `AGENT`, `GUEST`

### Dashboard (Authenticated)
- **Sidebar Navigation** — Role-aware sidebar (`DashboardSidebar`), adapts menu to user role
- **My Profile** — User profile management (protected route)
- **Dashboard Home** — Overview/analytics depending on role

### Salon Owner Features
- **Become a Salon Owner** — Application/owner request flow
- **My Salon** — View own salon details
- **Salon Management** — Create, update salon info
- **Salon Status** — Manage salon approval status

### Admin/Agent Features
- **Approval Queue** — Review and approve salon owner requests
- **Salon Management** — Admin-level salon CRUD and status control

### Appointments
- **Book Appointments** — Schedule services at salons
- **Appointment Management** — View/cancel upcoming appointments

### Services & Staff
- **Service Listings** — Browse available salon services
- **Staff Management** — View/manage salon staff (owner/admin)

### Reviews
- **Review System** — Rate and review salons/services

## Architecture

### Backend API
- External REST API expected at `NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api/v1`)
- Production API: `https://salon-management-server.onrender.com/api/v1`
- Authentication via JWT cookies forwarded from Next.js server to backend

### Data Flow
1. **Server Components** → `serverFetch` (attaches accessToken cookie) → Backend API
2. **Server Actions** (auth) → Direct `fetch` to backend → Set cookies via `cookies()` API
3. **Client Components** → Service functions in `src/services/` → Backend API

### Key Dependencies
| Package | Purpose |
|---|---|
| next 16.1 | Framework (App Router) |
| react 19.2 | UI library |
| tailwindcss 4 | Styling |
| radix-ui / shadcn | UI components |
| framer-motion | Animations |
| react-hook-form + zod | Form validation |
| jsonwebtoken | Server-side JWT verification |
| sonner | Toast notifications |
| next-themes | Dark/light mode |
| lucide-react | Icons |

### Environment Variables
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NODE_ENV` | development / production |
| `JWT_SECRET` | JWT signing secret |
| `ACCESS_TOKEN_SECRET` | Access token secret |
| `REFRESH_TOKEN_SECRET` | Refresh token secret |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, register pages
│   ├── (commonLayout)/      # Public pages (navbar + footer)
│   │   ├── about/
│   │   ├── ai-suggestions/
│   │   ├── become-salon-owner/
│   │   ├── contact/
│   │   └── salons/
│   ├── (dashboardLayout)/   # Authenticated pages (sidebar)
│   │   ├── (commonProtectedLayout)/
│   │   │   └── my-profile/
│   │   └── dashboard/
│   ├── globals.css          # Tailwind config + custom tokens
│   └── layout.tsx           # Root layout (font, toaster, auth toasts)
├── assets/                  # Static images
├── components/
│   ├── About/
│   ├── AI-Suggestions/
│   ├── ApprovalSalon/
│   ├── Auth/
│   ├── BecomeASalonWoner/
│   ├── Contact/
│   ├── Dashboard/
│   ├── Home/
│   ├── layout/              # Navbar, Footer, DashboardSidebar
│   ├── OwnerRequest/
│   ├── Salons/
│   ├── Shared/
│   ├── theme-provider.tsx
│   └── ui/                  # shadcn/ui components
├── constants/               # Static data (bangladesh-locations)
├── lib/
│   ├── server-fetch.ts      # Server-side API fetch wrapper
│   └── utils.ts             # cn() utility
└── services/                # API service functions
    ├── ai/
    ├── appoinments/
    ├── auth/
    ├── become-a-salone-woner/
    ├── counter/
    ├── dashboard/
    ├── get-roles/
    ├── review/
    ├── salon/
    ├── service/
    ├── staff/
    └── users/
```

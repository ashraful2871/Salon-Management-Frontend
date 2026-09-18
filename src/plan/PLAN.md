# PLAN.md — Salon Platform Master Plan

**Repo root:** `D:\Projects\salon management\`
**Created:** 2026-09-16

---

## The plan set

This plan is split into six files. Each one is phase-by-phase with small, independently shippable steps, verification commands and suggested commit messages.

| File | What it covers | When |
|---|---|---|
| **[FIXING.md](./FIXING.md)** | Everything that must be fixed before real users and real money | **First** |
| **[PAYMENT.md](./PAYMENT.md)** | Wallet, SSLCommerz, deposits, commission, payouts | **Your starting target** |
| **[BOOKING.md](./BOOKING.md)** | Booking engine rebuild, staff selection, staff portfolios | After payments |
| **[FEATURE.md](./FEATURE.md)** | Off-peak pricing, notifications, live queue, loyalty, discovery | The differentiators |
| **[GROWTH.md](./GROWTH.md)** | Bengali, PWA, AI stylist, home service, analytics, ops | Later |
| **[DATABASE.md](./DATABASE.md)** | Every schema change in one place, with migration order | Reference |
| **[TESTING.md](./TESTING.md)** | Phase gates, load tests, go-live checklist | Reference |

**Reading order if you're starting today:** [FIXING.md](./FIXING.md) Phase F1 → [PAYMENT.md](./PAYMENT.md) Phase P1.

---

## Context

You have a working two-repo salon marketplace:

- **`Salon-Management-Server`** — Express 4 + TypeScript + Prisma 6 + PostgreSQL (Neon) + pgvector, on Render. 14 modules: Auth, User, Salon, Service, Staff, Appointment, Counter, Payment, Review, Slot, DashboardStats, BecomeASalonOwner, Agent, AI-Suggestion.
- **`Salon-Management-Frontend`** — Next.js 16 App Router + React 19 + Tailwind v4 + shadcn/ui, server actions, httpOnly-cookie JWT, on Vercel.

The CRUD skeleton is genuinely solid — role-based auth that re-reads the role from the database, a salon approval workflow, an area-scoped agent role, pgvector semantic search, and a correct transactional guard on slot claiming.

What is missing is what turns a CRUD app into a **business**: real money movement, a booking engine that cannot double-book, and a reason for a customer to open your app instead of walking into the shop next door.

**Decisions locked in:** Wallet + small deposit · SSLCommerz · Hybrid booking (appointments + live queue) · Full phased roadmap.

---

## Audit summary

### 🔴 Blocking production right now

| # | Finding | Where | Fix |
|---|---|---|---|
| 1 | **Live credentials committed** — Neon DB password, Gemini key, Gmail app password | `Salon-Management-Server/.env.example` | [FIXING F1.1](./FIXING.md) |
| 2 | **Any customer can mark any appointment fully paid** — `amount` and `status` come from `req.body` | `payment.service.ts:31-38`, `payment.routes.ts:8-12` | [FIXING F1.2](./FIXING.md) |
| 3 | **Money stored as `Float`** — ledger will not balance once commissions exist | `payment.prisma`, `service.prisma` | [PAYMENT P1.2](./PAYMENT.md) |
| 4 | **Zero indexes** — one `@@unique` in the whole schema | all schema files | [FIXING F3.1](./FIXING.md) |
| 5 | **No frontend route guard** — no `middleware.ts`; dashboard renders for guests | `(dashboardLayout)/layout.tsx:15` | [FIXING F2.1](./FIXING.md) |

### 🟠 Breaking users today

| # | Finding | Where |
|---|---|---|
| 6 | **1-hour token in a 7-day cookie, no refresh call** — every user silently breaks after an hour | `config/index.ts:29`, `login.ts:57-63` |
| 7 | Possible IDOR — `PATCH /users/:id` open with no route-level ownership check | `user.routes.ts:22-27` |
| 8 | No rate limiting, no `helmet`, no body size cap | `app.ts` |
| 9 | No password reset — a forgotten password means a permanently locked account | `auth.routes.ts` |
| 10 | Timezone bug — `new Date("2026-09-17")` is UTC midnight; Dhaka is UTC+6 | `slot.service.ts:76,116` |

### 🟡 Breaks at scale

No tests anywhere · `getAllSalons` over-fetches every service, staff member and counter per salon · AI embedding model id `gemini-embedding-2` likely wrong (**verify — if so, no salon has an embedding and AI search silently returns nothing**) · no vector index · AI search ignores `status` · no structured logging or error tracking.

### Product gaps capping growth

| Gap | Consequence |
|---|---|
| **One service per appointment** (`Appointment.serviceId` singular) | Can't book "haircut + beard". Caps average order value. |
| **Customer cannot pick a barber at all** — `BookAppointmentModal.tsx` has no staff selector; `book-appoiments.ts:15` reads a `staffId` that is never sent | Your single biggest missing feature. People are loyal to a person, not a shop. |
| **Customer must pick a "Counter"** (`BookAppointmentModal.tsx:170-190`) | Internal plumbing leaking into customer UX |
| **No lat/lng on `Salon`** | "Near me" — the most-used filter in any local marketplace — is impossible |
| **No `salonType`** (Gents/Ladies/Unisex) | First filter every BD customer applies. Directory unusable for women. |
| **Slots created manually per service, per day** | 10 services × 30 days = 300 bulk-creates/month. Owners will quit. |
| **No staff dimension on slots** | Same barber bookable twice at once |
| **One email, no SMS** | In Bangladesh most customers never open email |
| **`NO_SHOW` exists with no consequence** | The salon's #1 pain point, unaddressed |

---

## The strategic answer

> *"Why would someone open an app to book a 150tk haircut instead of just walking in?"*

Not for payment convenience. Nobody installs an app to save 4tk in gateway fees. If that's the pitch, you lose.

**1. They stop waiting.** The real cost of a ৳150 haircut in Dhaka is ৳150 **plus 40 minutes on a bench**. At ৳100/hour, removing that wait is worth ~৳67 — more than any discount you could offer, and it costs you nothing to deliver. This is the entire product.

**2. Off-peak pricing.** Salons are dead 11:00–16:00 on weekdays and packed Thursday evening. An empty chair is unrecoverable inventory, like an airline seat.

```
Tuesday 12:30 PM   Haircut  ৳150 → ৳105    (Happy Hour −30%)
Thursday 7:00 PM   Haircut  ৳150 → ৳150    (peak)
```

The customer saves **৳45 — 30%**. The salon converts a dead hour into revenue it was never going to get. Nobody in this market does yield management, and a salon cannot do it alone — it needs whoever holds the calendar. **Your most defensible differentiator.**

**3. The same barber, every time.** People switch salons when their barber leaves. Let them follow the person.

**4. Loyalty worth something.** Every 6th cut free = 16.7% off, funded in marginal cost, not cash.

**5. Fixed price, instant refunds.** Cancel in time and the deposit is back in the wallet immediately — not "3–10 working days".

### Why salons benefit

No-shows nearly eliminated by a forfeitable deposit (free bookings no-show at 15–30%) · dead hours monetised · **free salon software** — most BD salons run on a paper notebook, and this is your wedge · customer CRM and win-back · predictable payouts.

### The move that makes salons say yes

**Charge 0% commission on the salon's own returning customers.** Only charge for first-time customers you introduced and off-peak slots you filled.

This flips the pitch from *"give me a cut of your business"* to *"pay me only for money I brought you."* It's a pricing policy, not code — it just needs `Appointment.source` and a first-visit check, both in [PAYMENT P4.1](./PAYMENT.md).

---

## The money model

```
STEP 1  TOP UP        Customer adds ৳500 via bKash/Nagad/card (SSLCommerz)
                      Gateway fee paid ONCE, here.

STEP 2  BOOK          Haircut ৳150 @ Tue 12:30 → off-peak ৳105
                      ৳30 deposit HELD from wallet. One tap, no OTP, no redirect.

STEP 3  OUTCOME       ✅ Showed up     → ৳30 off the bill, pay ৳75 at salon
                      🔄 Cancel >2h    → ৳30 back to wallet, instantly
                      ❌ No-show       → ৳30 forfeited: salon ৳21 / platform ৳9
```

**The wallet's real benefit is not the fee percentage** — 2.5% of ৳2,000 is 2.5% either way. It's **conversion** (a gateway redirect for ৳150 takes 60–90s and often fails on OTP or network; a wallet tap never does) and **instant refunds** (a deposit model generates constant small refunds, and gateway reversals take 3–10 days in Bangladesh).

**Revenue shape:** cheap haircuts are the **frequency engine** — they bring someone back every 3–4 weeks and build the habit. Bridal, keratin and spa at ৳3,000–15,000 are the **margin engine**. Never try to make the ৳150 haircut profitable on its own; make it the reason the app is on the home screen.

Full detail, including the five webhook defences and the ledger rules: **[PAYMENT.md](./PAYMENT.md)**.

---

## Roadmap at a glance

```
FIXING.md   F1  Stop the bleeding       ← today
            F2  Sessions that work
            F3  Survive traffic
            F4  See what's happening

PAYMENT.md  P1  Wallet foundations      ← your starting point
            P2  SSLCommerz top-up
            P3  Booking deposits
            P4  Salon settlement
            P5  Money notifications

BOOKING.md  B1  UTC timestamps + no-double-book constraint
            B2  Staff schedules
            B3  Computed availability
            B4  Multi-service bookings
            B5  Staff selection + portfolios   ← your change
            B6  Reschedule & cancel

FEATURE.md  G1  Off-peak pricing        ← strongest differentiator
            G2  Notifications / SMS
            G3  Live queue
            G4  Loyalty & packages
            G5  Geo + gender search

GROWTH.md   X1–X6  Bengali · PWA · AI stylist · home service · analytics · ops
```

---

## Where to start

**This week:** [FIXING F1.1](./FIXING.md) and [F1.2](./FIXING.md). Live database, AI and email credentials are sitting in a committed file, and any logged-in customer can currently mark an appointment paid in full. Nothing else matters until those are closed.

**This month:** the rest of [FIXING.md](./FIXING.md) F1–F2, then [PAYMENT.md](./PAYMENT.md) P1–P3. That gets you a working wallet, real SSLCommerz top-ups and deposit-backed bookings.

**The feature that most changes your business:** [off-peak pricing](./FEATURE.md) (G1). It is the only one that simultaneously saves the customer real money, earns the salon money it could not otherwise earn, and creates a commission stream nobody resents paying.

**The one test that must pass before launch:** 50 concurrent bookings for the same barber at the same time → exactly one succeeds ([TESTING.md](./TESTING.md) B-1).

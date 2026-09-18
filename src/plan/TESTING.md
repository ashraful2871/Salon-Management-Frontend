# TESTING.md — Verification & Go-Live

> Part of the plan set. See [PLAN.md](./PLAN.md) for the index.
> What to verify at the end of each phase, and the gate that decides when you can take real money.

---

## Setup

There is currently **no test runner and no test file** in either repo. Start here.

```bash
cd "D:\Projects\salon management\Salon-Management-Server"
npm i -D vitest supertest @types/supertest @faker-js/faker
```

`package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**Use a separate test database.** A Neon branch is ideal — cheap, isolated, resettable:

```
# .env.test
DATABASE_URL=postgresql://...neon.../neondb_test?sslmode=require
```

```ts
// tests/setup.ts — truncate between tests, don't re-migrate
beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE appointments, appointment_items, wallets, wallet_transactions,
             payment_intents, slots, staff, salons, users RESTART IDENTITY CASCADE
  `);
});
```

**Do not chase a coverage percentage.** Test the paths where a bug costs money or exposes data. Everything else is optional.

---

## Phase gates

Each phase ships only when its tests are green.

---

### Gate F — Security ([FIXING.md](./FIXING.md))

| # | Test | Expected |
|---|---|---|
| F-1 | CUSTOMER posts `{amount:1, status:"COMPLETED"}` to `/payments` | **403.** No payment row created. |
| F-2 | SALON_OWNER posts a payment with a tampered `amount` | Row created with the **real service price**, status `PENDING` |
| F-3 | Customer A sends `PATCH /users/<customer-B-id>` | **403** |
| F-4 | Non-admin tries to set `role: "ADMIN"` on their own profile | Field stripped, role unchanged |
| F-5 | 11 login attempts in 15 min | 11th returns **429** |
| F-6 | Logged-out `GET /dashboard/appointments` | Redirect to `/login?redirect=...` |
| F-7 | CUSTOMER visits `/dashboard/admin/agents` | Redirect to `/dashboard` |
| F-8 | Request with an access token expired 1 min ago | Silent refresh, request **succeeds**, no visible logout |
| F-9 | Password reset token used twice | Second attempt fails |
| F-10 | Reset token older than 15 min | Rejected |
| F-11 | `forgot-password` for a non-existent email | **200** (no user enumeration) |
| F-12 | Evening slot created for the 17th | Reads back as the 17th, same clock time, in Dhaka |
| F-13 | `EXPLAIN ANALYZE` on salon appointments | `Index Scan`, not `Seq Scan` |
| F-14 | `SELECT COUNT(*) FROM salons WHERE embedding IS NOT NULL` | **> 0** — proves the embedding model id is right |
| F-15 | AI search for a common term | Returns only `status = 'ACTIVE'` salons |

**Manual:** confirm the rotated credentials work and that `.env.example` contains no real secret. This one cannot be automated and is the most important item on the page.

---

### Gate P — Payments ([PAYMENT.md](./PAYMENT.md))

The highest-stakes tests in the project. Money bugs are silent and compounding.

| # | Test | Expected |
|---|---|---|
| **P-1** | Wallet 10000. Fire concurrently: hold 3000, hold 3000, hold 8000 | Both 3000s succeed, 8000 fails, `heldBalance` = **exactly 6000** |
| **P-2** | Replay the identical IPN body **5×** | Wallet credited **once**. One `TOPUP` row. |
| **P-3** | IPN whose validated amount ≠ the intent amount | Rejected, logged, **nothing credited** |
| **P-4** | IPN with an invalid signature | Rejected before the validation call |
| **P-5** | POST directly to `/sslcz/success` with a forged `tran_id` | **Nothing credited.** Only the IPN moves money. |
| **P-6** | `validate()` returns `FAILED` for a valid signature | Intent `FAILED`, wallet unchanged |
| P-7 | Book with insufficient available balance | **402**, slot **not** consumed, no appointment |
| P-8 | Cancel 3h before (window 120 min) | Deposit fully released, available back to original |
| P-9 | Cancel 30 min before | Deposit forfeited, split per `noShowSalonSharePct` |
| P-10 | Complete a booking | `DEPOSIT_APPLIED`, held → 0, salon credited |
| P-11 | Mark no-show | Forfeited, salon gets 70%, platform 30% |
| P-12 | Admin reverses a no-show within 48h | `ADJUSTMENT` row, customer made whole, audit row written |
| P-13 | Double-click Confirm | **One** appointment, **one** hold (idempotency key) |
| **P-14** | Sum every `WalletTransaction` per wallet | Equals `wallets.balance` for **every** wallet |
| **P-15** | Sum `LedgerEntry` per completed appointment | Equals **zero** across accounts |
| P-16 | Direct `UPDATE wallets SET balance = -1` | Rejected by the `CHECK` constraint |
| P-17 | Intent left PENDING 45 min | Reconciliation job settles it |

**Sandbox end-to-end, run by hand before go-live:**
```
1. Top up ৳500 via SSLCommerz sandbox          → wallet ৳500
2. Book a ৳150 service                          → available ৳470, held ৳30
3. Owner completes + collects ৳120 cash         → balance ৳470, ledger balanced
4. Payout batch runs                            → salon payable correct
5. Reconciliation job                           → zero drift
```

---

### Gate B — Booking ([BOOKING.md](./BOOKING.md))

| # | Test | Expected |
|---|---|---|
| **B-1** | **50 concurrent** bookings, same barber, same time | **Exactly 1** succeeds. 49 get a clean 409, not a 500. |
| B-2 | Two bookings, same barber, overlapping by 1 minute | Second rejected by `no_staff_overlap` |
| B-3 | Same time, **different** barbers | Both succeed |
| B-4 | Availability for a salon open 10–21, barber 10–14, one booking at 11 | Only genuinely free windows returned |
| B-5 | Request a slot in the past | Never returned |
| B-6 | Barber has time off that day | No slots offered for them |
| B-7 | Request 2 services totalling 45 min, only a 30-min gap exists | That window **not** offered |
| B-8 | Book haircut(30) + beard(15) | One appointment, two `AppointmentItem` rows, `endsAt − startsAt = 45 min` |
| B-9 | Owner raises the price after booking | Booked `AppointmentItem.priceMinor` **unchanged** |
| B-10 | Book with `staffId: null` ("any available") | Server assigns the least-loaded qualified barber |
| B-11 | Request a barber who cannot perform the service | 400, not offered as a candidate |
| B-12 | Every counter busy at time T | T not offered |
| B-13 | Counter auto-assignment | Appointment gets a free counter; customer never chose one |
| B-14 | Reschedule | Deposit **carries over** — not released and re-held |
| B-15 | 3rd reschedule attempt | Rejected (limit 2) |
| B-16 | Reschedule inside the cancellation window | Rejected |
| B-17 | Owner uploads a portfolio image for another salon's staff | **403** |
| B-18 | Portfolio upload > 5 MB or non-image | Rejected |

**B-1 is the single most important test in this document.** It is the difference between a demo and a product. Run it under real concurrency, not sequentially:

```ts
const results = await Promise.allSettled(
  Array.from({ length: 50 }, () => bookAppointment(userId, payload))
);
expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
```

---

### Gate G — Features ([FEATURE.md](./FEATURE.md))

| # | Test | Expected |
|---|---|---|
| G-1 | Tuesday 12:30 with a Happy Hour rule | ৳105, `isOffPeak: true` |
| G-2 | Thursday 19:00, same service | ৳150, no discount |
| G-3 | Two overlapping rules | Higher `priority` wins; tie → larger discount |
| G-4 | Edit the rule after a booking | Completed booking's price **unchanged** |
| G-5 | Rule that would discount below 40% of base | Floored at 40% |
| G-6 | Coupon + off-peak both apply | Only the **better** one applies; UI says which |
| G-7 | SMS at 23:00 with quiet hours 22:00–08:00 | Marketing suppressed; transactional still sent |
| G-8 | User with `smsEnabled: false` | No SMS; push/in-app still delivered |
| G-9 | Notification send fails | Retried 3× with backoff, logged, caller not crashed |
| G-10 | Queue ETA vs actual, simulated full day | Within **±5 minutes** |
| G-11 | Called customer absent 10 min | Demoted 2 places, notified, not dropped |
| G-12 | Demoted twice | `ABANDONED`, deposit forfeited |
| G-13 | Walk-in added at the counter | Enters the same queue; remote ETAs update |
| G-14 | Appointment at 14:00 vs queue | Appointment served at 14:00; queue flows around it |
| G-15 | 6th completed booking at one salon | Free-visit reward granted |
| G-16 | Package with 2 remaining | Booking consumes one, no charge, count → 1 |
| G-17 | Expired package | Not usable; normal price charged |
| G-18 | Coupon beyond `perUserLimit` | Rejected |
| G-19 | Filter `salonType=LADIES` | Only ladies + unisex salons |
| G-20 | Near-me sort with coordinates | Correctly ordered by distance |

---

## Load testing

Before launch, with `k6` or `autocannon`:

| Scenario | Target |
|---|---|
| Salon list, 100 concurrent | p95 < 400 ms |
| Availability query, 50 concurrent | p95 < 600 ms |
| Booking, 20 concurrent on one salon | Zero double-bookings, zero 500s |
| Queue SSE, 200 connections | Stable, no memory growth over 10 min |
| IPN webhook, 50/sec burst | All processed, zero duplicate credits |

Watch for N+1 queries under load. `getAllSalons` is the prime suspect until [FIXING.md](./FIXING.md) F3.3 lands.

---

## Manual smoke test

Run the whole thing end to end before every release. 15 minutes, catches what unit tests miss.

```
CUSTOMER
 1. Register → verification email arrives → verify
 2. Top up ৳500 (sandbox) → balance correct
 3. Search: area + Ladies filter + "near me"
 4. Open a salon → see services, team, reviews
 5. Open a barber's profile → portfolio loads
 6. Book: 2 services → pick barber → off-peak slot
 7. Confirm screen shows discount, deposit, due-at-salon
 8. Confirm → SMS received → appears in My Appointments
 9. Wallet shows ৳30 held

OWNER
10. Receives new-booking SMS
11. Appointment visible on today's list
12. Complete & Collect → enter ৳75 cash → complete
13. Earnings reflects it

CUSTOMER
14. Review request notification
15. Leave a review + photo → salon rating updates
16. Wallet: deposit applied, cashback credited
17. Loyalty progress advanced

ADMIN
18. Dashboard totals correct
19. Ledger reconciliation clean
20. Payout batch includes the booking
```

---

## Go-live gate

Do not flip `SSLCZ_IS_LIVE=true` until **every** line here is true.

```
SECURITY
  □ All three leaked credentials rotated; .env.example has no real secret
  □ Gate F fully green
  □ HTTPS everywhere; secure + httpOnly cookies
  □ Rate limiting live and verified in production

MONEY
  □ Gate P fully green
  □ Reconciliation job clean for 7 consecutive days
  □ One real ৳100 top-up made with your own money and verified end to end
  □ One real refund issued and verified
  □ Payout tested with a real salon

BOOKING
  □ Gate B green — especially B-1
  □ Load test shows zero double-bookings

OPERATIONS
  □ Neon PITR on, and a restore actually tested on a scratch database
  □ Sentry receiving errors
  □ Uptime monitoring on /health/ready
  □ Alerts on: error rate, failed intents, ledger drift
  □ Staging environment exists and mirrors production
  □ CI blocks merge on failing tests

LEGAL & SUPPORT
  □ Terms, privacy policy, refund policy published
  □ Support inbox monitored with a stated SLA
  □ No-show appeal process documented and visible to customers
```

---

## After launch — watch these

| Metric | Healthy | Investigate |
|---|---|---|
| Booking completion rate | > 60% | < 40% → friction in the flow |
| No-show rate | < 5% | > 10% → deposit too low |
| Wallet top-up success | > 90% | < 80% → gateway or UX problem |
| Ledger drift | **0** | anything > 0 → **stop and fix** |
| Availability p95 | < 600 ms | > 1s → caching or index problem |
| Queue ETA error | < 5 min | > 10 min → recalibrate `salonSpeedFactor` |
| Repeat booking rate (30d) | > 35% | < 20% → the core value prop isn't landing |
| Salon churn (monthly) | < 5% | > 10% → talk to owners, the software isn't earning its place |

**Ledger drift is the one with no acceptable tolerance.** Every other metric is a signal to improve. That one is a signal to stop.

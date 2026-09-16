# FEATURE.md — The Differentiator Features

> Part of the plan set. See [PLAN.md](./PLAN.md) for the index and the strategy.
> **Prerequisites:** [FIXING.md](./FIXING.md) Phase F1–F2 · [PAYMENT.md](./PAYMENT.md) Phase P1–P3 · [BOOKING.md](./BOOKING.md) Phase B1–B4.

---

## What this file is for

[FIXING.md](./FIXING.md) makes the platform safe. [PAYMENT.md](./PAYMENT.md) makes money move. [BOOKING.md](./BOOKING.md) makes booking work properly.

**This file is what makes anyone choose you over a competitor.**

Five features, in the order that gives you the most return per week of work:

| # | Feature | Who it wins | Effort |
|---|---|---|---|
| G1 | **Off-peak pricing** | customer + salon + you | Medium |
| G2 | **Notifications (SMS)** | everyone — this is oxygen | Small |
| G3 | **Live queue** | the walk-in market nobody serves | Large |
| G4 | **Loyalty & packages** | repeat rate | Medium |
| G5 | **Geo + gender search** | discovery, and half your market | Small |

> **If you only build one:** G1. It is the only feature that simultaneously saves the customer real money, earns the salon money it could not otherwise earn, and creates a commission stream nobody resents paying.

---

# Phase G1 — Off-peak pricing

## Why this is your strongest feature

A salon chair at 12:30 on a Tuesday is **unrecoverable inventory**, exactly like an airline seat. If nobody sits in it, that revenue is gone forever. Salons are dead 11:00–16:00 on weekdays and overflowing on Thursday evening.

```
Tuesday 12:30 PM   Haircut  ৳150 → ৳105    (Happy Hour −30%)
Thursday 7:00 PM   Haircut  ৳150 → ৳150    (peak, full price)
```

- **Customer** saves ৳45 — a real 30%. That is far more than any payment-fee optimisation could ever deliver, and it is the thing that makes a 150tk booking worth opening an app for.
- **Salon** converts a dead hour into revenue it was never going to get. Marginal cost of a haircut is near zero — it is the barber's already-paid idle time.
- **You** earn a commission the salon is happy to pay, because it is money they would not have had.

A salon cannot do this alone — it requires whoever holds the calendar. That is what makes it defensible.

---

### Step G1.1 — PricingRule schema

`prisma/schema/pricing.prisma`:

```prisma
model PricingRule {
  id           String   @id @default(uuid())
  salonId      String
  serviceId    String?           // null = all services
  name         String            // "Weekday Happy Hour"
  daysOfWeek   Int[]             // [0,1,2,3] Sun–Wed
  startTime    String            // "11:00"  salon-local
  endTime      String            // "16:00"
  discountPct  Int?              // 30 = 30% off
  fixedMinor   Int?              // or an absolute price override
  maxRedemptions Int?            // optional cap per day
  validFrom    DateTime?
  validTo      DateTime?
  isActive     Boolean  @default(true)
  priority     Int      @default(0)   // highest wins on overlap
  createdAt    DateTime @default(now())

  salon   Salon    @relation(fields: [salonId], references: [id], onDelete: Cascade)
  service Service? @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@index([salonId, isActive])
  @@map("pricing_rules")
}
```

**Resolution order** — get this right or you will have angry customers:

1. Collect every active rule matching salon + service + weekday + time window + validity dates.
2. Take the **highest `priority`**; tie-break on the **largest discount** (always favour the customer).
3. Apply to the base `priceMinor`, floor at a platform minimum (never below ~40% of base).
4. **Snapshot the result into `AppointmentItem.priceMinor`.** The price the customer saw is the price they pay, permanently — even if the owner edits the rule an hour later.

```ts
// src/app/modules/Pricing/pricing.service.ts
export const resolvePrice = (service: Service, rules: PricingRule[], at: Date, tz: string) => {
  const local = toZonedTime(at, tz);
  const match = rules
    .filter((r) => r.isActive
      && (r.serviceId === null || r.serviceId === service.id)
      && r.daysOfWeek.includes(local.getDay())
      && withinWindow(local, r.startTime, r.endTime)
      && withinValidity(at, r.validFrom, r.validTo))
    .sort((a, b) => b.priority - a.priority || discountOf(b, service) - discountOf(a, service))[0];

  if (!match) return { priceMinor: service.priceMinor, isOffPeak: false, ruleName: null };

  const discounted = match.fixedMinor
    ?? Math.round(service.priceMinor * (100 - (match.discountPct ?? 0)) / 100);

  return {
    priceMinor: Math.max(discounted, Math.round(service.priceMinor * 0.4)),
    isOffPeak: true,
    ruleName: match.name,
  };
};
```

---

### Step G1.2 — Wire into availability

`AvailabilityService` ([BOOKING.md](./BOOKING.md) B3.1) already calls `resolvePrice(services, t)`. Return `priceMinor`, `originalMinor`, `isOffPeak` and `ruleName` on **every** slot, so the discount shows up in the time grid itself — not buried at checkout.

```
Afternoon        🔥 Happy Hour −30%
 12:30    13:00    13:30
 ৳105     ৳105     ৳105
 ̶৳̶1̶5̶0̶     ̶৳̶1̶5̶0̶     ̶৳̶1̶5̶0̶
```

Seeing the strikethrough in the grid is what changes behaviour. A discount revealed only at the final step does not move anyone's booking time.

---

### Step G1.3 — Owner rule builder

`Dashboard → Settings → Pricing Rules`. Lead with one-click presets, because most owners will never build a custom rule:

```
┌──────────────────────────────────────────┐
│  Fill your quiet hours                   │
│                                          │
│  ⚡ Weekday Happy Hour                    │
│     Sun–Wed, 11 AM – 4 PM, 30% off       │
│     [ Enable ]                           │
│                                          │
│  ⚡ Early Bird                            │
│     Every day, first 2 opening hours,    │
│     20% off          [ Enable ]          │
│                                          │
│  ⚡ Last Hour                             │
│     Every day, final hour, 25% off       │
│     [ Enable ]                           │
│                                          │
│  [ + Build a custom rule ]               │
└──────────────────────────────────────────┘
```

Show the owner their own utilisation heatmap above this, so the dead hours are visible before they pick a rule:

```
        10  11  12  13  14  15  16  17  18  19  20
 Sat    ▓▓  ▓▓  ░░  ░░  ░░  ░░  ▒▒  ▓▓  ██  ██  ██
 Sun    ▒▒  ░░  ░░  ░░  ░░  ░░  ▒▒  ▓▓  ██  ██  ▓▓
 ...             ↑ your empty hours — discount these
```

---

### Step G1.4 — Surface it in discovery

- **"🔥 Deals near you"** row on the home page — salons with an off-peak slot in the next 3 hours.
- **Off-peak badge** on `SalonCard.tsx`: `Haircut from ৳105 today`.
- Sort option: **Best deals**.
- Push notification, max once per day, opt-in: *"৳105 haircut at Glamour, 2:00 PM today — 800m away."*

**Verify:** a Tuesday 12:30 booking picks up the rule and charges ৳105; the same service Thursday 19:00 charges ৳150; editing the rule afterwards does not change the completed booking.
**Commit:** `feat(pricing): off-peak dynamic pricing engine`

---

# Phase G2 — Notifications

*Small effort, and nothing else works without it.*

**SMS is not optional in Bangladesh.** Most customers will never open an email. Today the entire system sends exactly one email (`appointment.service.ts:145-160`) and nothing else — no reminder, no owner alert, no status change.

### Step G2.1 — Schema

```prisma
model Notification {
  id        String              @id @default(uuid())
  userId    String
  type      NotificationType
  channel   NotificationChannel // SMS | EMAIL | PUSH | IN_APP
  title     String
  body      String
  payload   Json?
  status    NotificationStatus  @default(QUEUED)
  sentAt    DateTime?
  readAt    DateTime?
  error     String?
  createdAt DateTime            @default(now())

  @@index([userId, createdAt])
  @@index([status, createdAt])
  @@map("notifications")
}

model NotificationPreference {
  id      String  @id @default(uuid())
  userId  String  @unique
  smsEnabled       Boolean @default(true)
  pushEnabled      Boolean @default(true)
  emailEnabled     Boolean @default(true)
  marketingEnabled Boolean @default(false)   // must default FALSE
  quietHoursStart  String? @default("22:00")
  quietHoursEnd    String? @default("08:00")
}
```

### Step G2.2 — NotificationService

One entry point, template-driven, queue-backed:

```ts
NotificationService.send(userId, "BOOKING_CONFIRMED", {
  salonName, time, depositAmount, dueAmount,
});
```

Rules:
- Respect `NotificationPreference` and quiet hours. **Never** send marketing at 11 PM.
- Transactional messages (booking, deposit, no-show) ignore `marketingEnabled` but still respect quiet hours except for T−2h reminders.
- Retry 3× with backoff; record failures, don't crash the caller — the existing `emailSender.ts` already swallows errors correctly, keep that behaviour.
- Bengali by default (`user.preferredLanguage`).

> **Cost warning:** Bengali SMS uses UTF-16, which halves the characters per segment (70 vs 160). A Bengali message can cost double. Keep templates short, or send Banglish for long ones.

### Step G2.3 — The message set

| Event | Channel | Timing |
|---|---|---|
| Booking confirmed | SMS + push | immediate |
| Reminder | SMS + push | T−2h |
| Reminder | push | T−30min |
| Status changed by salon | push | immediate |
| Cancelled → deposit released | push | immediate |
| Marked no-show | SMS | immediate |
| Completed → review request | push | T+1h |
| Cashback earned | push | immediate |
| **Owner:** new booking | SMS | immediate |
| **Owner:** cancellation | SMS | immediate |
| **Owner:** daily summary | SMS | 21:00 |
| Win-back | push | 35 days idle, max 1/month |

### Step G2.4 — In-app notification centre

Bell icon in `NavbarClient.tsx` with an unread count, dropdown list, mark-as-read. `GET /notifications?unread=true`.

**Commit:** `feat(notifications): SMS, push and in-app notification system`

---

# Phase G3 — Live queue

## Why this matters more than it looks

Bangladeshi salons are roughly **90% walk-in**. Booksy, Fresha and every Western competitor assume appointment culture and simply do not serve this. The real pain is not "I can't book" — it is **sitting 40 minutes on a bench**.

If a person's time is worth ৳100/hour, removing a 40-minute wait is worth ~৳67 to them — **more than any discount you could offer**, and it costs you nothing to deliver.

```
┌────────────────────────────────────┐
│  Glamour Salon · Dhanmondi         │
│                                    │
│         You are  #3                │
│      approx. 22 min wait           │
│                                    │
│  ●───────●───────○───────○         │
│  join   #3      #1     chair       │
│                                    │
│  We'll text you when to leave.     │
│              [ Leave queue ]       │
└────────────────────────────────────┘
```

### Step G3.1 — Schema

```prisma
model QueueEntry {
  id               String      @id @default(uuid())
  salonId          String
  customerId       String
  staffId          String?               // optional preferred barber
  serviceIds       String[]
  status           QueueStatus @default(WAITING)
  position         Int
  joinedAt         DateTime    @default(now())
  estimatedStartAt DateTime?
  calledAt         DateTime?
  startedAt        DateTime?
  completedAt      DateTime?
  depositMinor     Int         @default(0)
  appointmentId    String?               // created when they sit down

  @@index([salonId, status, position])
  @@index([customerId, joinedAt])
  @@map("queue_entries")
}

enum QueueStatus { WAITING  CALLED  IN_CHAIR  SERVED  ABANDONED  EXPIRED }
```

Add to `Salon`: `bookingModes BookingMode[] @default([APPOINTMENT])` — each salon chooses `APPOINTMENT`, `QUEUE`, or both.

### Step G3.2 — The ETA engine

Accuracy is the entire product here. A wrong ETA is worse than no ETA.

```
ETA(position n) = Σ(expected duration of entries 1..n−1) ÷ activeChairs
                + remaining time of in-progress services
                × salonSpeedFactor
```

- `salonSpeedFactor` = that salon's rolling 30-day median actual duration ÷ advertised duration. Some salons run 20% slow, consistently. Learn it, don't guess it.
- Recompute on every queue change, and on a 60-second tick.
- **Always show a range, never a point:** "20–25 min", not "22 min". Under-promise.
- Track accuracy per salon and surface it to the owner — it is a quality signal they will want to improve.

### Step G3.3 — Live updates via SSE

```ts
// GET /queue/:salonId/stream
router.get("/:salonId/stream", auth(), (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const push = () => res.write(`data: ${JSON.stringify(getQueueState(salonId))}\n\n`);
  push();
  const timer = setInterval(push, 15000);
  req.on("close", () => clearInterval(timer));
});
```

SSE over WebSockets: one-directional, works through every proxy, auto-reconnects in the browser, and needs no extra infrastructure. If you later move off Render's request timeouts, revisit.

### Step G3.4 — Salon queue console

A tablet screen for the counter — the owner's most-used view:

```
┌──────────────────────────────────────────────┐
│  QUEUE — 6 waiting        Chairs 3/4 busy    │
├──────────────────────────────────────────────┤
│ #1 Rahim    Haircut     waiting 18m [Call ]  │
│ #2 Karim    Cut+Beard   waiting 12m [Call ]  │
│ #3 Sabbir   Haircut     waiting  6m [Call ]  │
├──────────────────────────────────────────────┤
│  IN CHAIR                                    │
│  Ch1 Jamal   Haircut    8m  [Done]           │
│  Ch2 Nazmul  Colouring  24m [Done]           │
│  Ch3 — free —                                │
├──────────────────────────────────────────────┤
│  [ + Add walk-in ]                           │
└──────────────────────────────────────────────┘
```

"Add walk-in" is essential — people who physically walk in must enter the same queue, or the ETA for remote customers becomes a lie.

### Step G3.5 — Rules that keep it fair

- Called but absent after **10 minutes** → auto-demote 2 places, don't drop. Notify.
- Demoted twice → `ABANDONED`, deposit forfeited.
- Queue closes `X` minutes before the salon closes (default 45), configurable.
- Same deposit mechanic as appointments — a queue no-show forfeits it.
- **Appointments beat the queue.** A booked 14:00 appointment is served at 14:00; the queue flows around it. Say this clearly in the UI or walk-ins will feel cheated.

**Verify:** simulate a full day — ETA within ±5 minutes of actual; a called-but-absent customer demotes correctly; walk-ins and remote joiners interleave properly.
**Commit:** `feat(queue): live remote queue with ETA engine`

---

# Phase G4 — Loyalty & packages

### Step G4.1 — Points

```prisma
model LoyaltyAccount {
  id             String @id @default(uuid())
  userId         String @unique
  points         Int    @default(0)
  lifetimePoints Int    @default(0)
  tier           LoyaltyTier @default(BRONZE)
}

model LoyaltyTransaction {
  id          String   @id @default(uuid())
  accountId   String
  points      Int               // signed
  reason      String
  referenceId String?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
}
```

Earning: **1 point per ৳10 spent**, +50 first booking at a new salon, +20 for a review with a photo, +100 for a referral's first completed booking.

Redemption: **100 points = ৳10 wallet credit**. That is a clean 1% base — plus the every-6th-free mechanic below, which is where the real perceived value sits.

Points expire after 12 months of inactivity. Say so at earning time, not in fine print.

### Step G4.2 — Every 6th cut free

The one people actually understand:

```
┌────────────────────────────────────┐
│  Glamour Salon                     │
│  ●  ●  ●  ●  ○  ○                  │
│  4 of 6 visits — 2 more for a      │
│  FREE haircut                      │
└────────────────────────────────────┘
```

Per salon, not platform-wide — it drives loyalty to a specific shop, which is what makes salons fund it. Effective 16.7% discount, paid in marginal cost, not cash.

### Step G4.3 — Prepaid packages

```prisma
model Package {
  id           String @id @default(uuid())
  salonId      String
  name         String              // "6 Haircuts"
  serviceId    String
  quantity     Int                 // 6
  priceMinor   Int                 // ৳750 instead of ৳900
  validityDays Int    @default(180)
  isActive     Boolean @default(true)
}

model PackagePurchase {
  id           String   @id @default(uuid())
  packageId    String
  userId       String
  remaining    Int
  expiresAt    DateTime
  purchasedAt  DateTime @default(now())
}
```

**Salon gets ৳750 cash today** instead of ৳150 six times over six months — a genuinely compelling pitch for a small business with cash-flow pressure. **Customer saves ৳150 (17%)** and is locked in. Platform takes 5% of the package sale up front.

At booking, if the customer has a valid package covering the service, consume one unit instead of charging. Show remaining count on their appointment card.

### Step G4.4 — Coupons

```prisma
model Coupon {
  id              String @id @default(uuid())
  code            String @unique
  salonId         String?            // null = platform-wide
  discountPct     Int?
  discountMinor   Int?
  minSpendMinor   Int    @default(0)
  maxRedemptions  Int?
  perUserLimit    Int    @default(1)
  validFrom       DateTime
  validTo         DateTime
  isActive        Boolean @default(true)
}
```

Campaigns worth building: `FIRST50` (৳50 off first booking, platform-funded — acquisition cost), win-back at 35 days idle (salon-funded), referral reward both sides.

**Rule:** a coupon and an off-peak discount do **not** stack. Apply the better one and tell the customer which applied.

**Commit:** `feat(loyalty): points, packages and coupons`

---

# Phase G5 — Discovery: geo + gender

*Small effort, disproportionate payoff.*

### Step G5.1 — Gender segmentation ← fix this first

```prisma
enum SalonType { GENTS  LADIES  UNISEX  KIDS }

model Salon {
  salonType SalonType @default(GENTS)
}
```

**In Bangladesh this is the first filter every customer applies.** Without it your directory is effectively unusable for women — which is half your market, and the half that spends more per visit on higher-ticket services.

- Prominent filter chips on `/salons`: `All · Gents · Ladies · Unisex · Kids`
- Default the filter from `user.gender` when known.
- Badge on `SalonCard.tsx`.
- Backfill: ask every existing owner to set it; default `GENTS` with an admin report of unset ones.

This is a one-day change. Do it before the queue.

### Step G5.2 — Coordinates and "near me"

```prisma
model Salon {
  latitude  Float?
  longitude Float?
}
```

`getAllSalons` currently filters on `division`/`district`/`area` strings only — so "salons near me", the most-used filter in any local marketplace, is impossible.

```sql
-- distance sort; earthdistance or PostGIS both work
SELECT *, earth_distance(
  ll_to_earth($lat, $lng),
  ll_to_earth(latitude, longitude)
) / 1000 AS km
FROM salons
WHERE status = 'ACTIVE' AND "isDeleted" = false
  AND latitude IS NOT NULL
ORDER BY km
LIMIT 20;
```

- Map picker in the owner's salon settings.
- Browser geolocation on `/salons`, with graceful fallback to area select when denied.
- Show `1.2 km away` on every card.
- Sort options: **Nearest · Top rated · Best deals · Price**.

### Step G5.3 — Better search and filters

Current search (`salon.service.ts:60-66`) only matches salon name, description and city. Add:
- Match **service names** too — "fade", "keratin", "bridal" are what people actually type.
- Filters: price range, rating ≥ 4, open now, has off-peak deal, specific service available.
- Combine with the pgvector AI search from [FIXING.md](./FIXING.md) F3.4 once embeddings are confirmed working.

### Step G5.4 — Favourites

```prisma
model Favorite {
  id        String   @id @default(uuid())
  userId    String
  salonId   String?
  staffId   String?
  createdAt DateTime @default(now())

  @@unique([userId, salonId])
  @@unique([userId, staffId])
}
```

Heart icon on salon and staff cards; a **Favourites** tab; one-tap rebook: *"Book again with Rasel — next available Wed 5 PM"*. Rebooking is the cheapest booking you will ever get.

**Commit:** `feat(discovery): salon type, geo search, filters and favourites`

---

## Suggested build order

Not the same as the numbering — this is what I would actually do, week by week:

```
Week 1   G5.1  Salon type (Gents/Ladies/Unisex)    ← one day, unlocks half the market
Week 1   G2    Notifications / SMS                  ← everything else depends on it
Week 2-3 G1    Off-peak pricing                     ← your strongest differentiator
Week 4   G5.2  Geo + near me
Week 5   G4.1-2 Loyalty points + 6th-free
Week 6-8 G3    Live queue                           ← biggest build, biggest moat
Week 9   G4.3-4 Packages + coupons
Week 10  G5.3-4 Search filters + favourites
```

**Rationale:** ship the cheap, high-impact things first (G5.1, G2), then the feature that changes your economics (G1), and save the large build (G3) for when you have users whose behaviour can tell you whether the ETA model is right.

---

## Done checklist

```
G1  Off-peak pricing
  □ G1.1  PricingRule schema + resolution order
  □ G1.2  Wired into availability, prices in the time grid
  □ G1.3  Owner preset rules + utilisation heatmap
  □ G1.4  Deals row, badges, "Best deals" sort

G2  Notifications
  □ G2.1  Notification + NotificationPreference schema
  □ G2.2  NotificationService with quiet hours + retries
  □ G2.3  Full message set incl. owner alerts
  □ G2.4  In-app notification centre

G3  Live queue
  □ G3.1  QueueEntry schema + per-salon booking modes
  □ G3.2  ETA engine with salonSpeedFactor
  □ G3.3  SSE live stream
  □ G3.4  Salon queue console + walk-in entry
  □ G3.5  Fairness rules + appointment priority

G4  Loyalty
  □ G4.1  Points + tiers
  □ G4.2  Every-6th-free per salon
  □ G4.3  Prepaid packages
  □ G4.4  Coupons (no stacking with off-peak)

G5  Discovery
  □ G5.1  SalonType  ← do this first
  □ G5.2  lat/lng + near-me sort
  □ G5.3  Service-name search + filters
  □ G5.4  Favourites + one-tap rebook
```

Next: [GROWTH.md](./GROWTH.md) — AI stylist, home service, Bengali, PWA.

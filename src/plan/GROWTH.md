# GROWTH.md — Scale & Expansion

> Part of the plan set. See [PLAN.md](./PLAN.md) for the index.
> **Do not start any of this until [FIXING.md](./FIXING.md), [PAYMENT.md](./PAYMENT.md) and [BOOKING.md](./BOOKING.md) are done.** Growth on a broken base multiplies the breakage.

---

# Phase X1 — Bengali localisation

*Highest return per hour of work in this entire file.*

Your whole product is English-only. In Bangladesh that excludes most customers and **almost every salon owner** — the people you need to onboard, who will be entering their own services and schedules.

### Step X1.1 — i18n plumbing

Next.js App Router with `next-intl`:

```
src/
  messages/
    bn.json          ← default
    en.json
  i18n.ts
  app/[locale]/...
```

- **Default to Bengali**, offer English. Not the other way round.
- Bengali numerals (১২৩) for display; Latin digits in inputs.
- `৳` prefix, no decimals for whole amounts.
- Dates in Bengali (`১৭ সেপ্টেম্বর, বুধবার`).

### Step X1.2 — What to translate first

| Priority | Surface | Why |
|---|---|---|
| 1 | Owner dashboard | Owners are the hardest to onboard and the least likely to read English |
| 2 | Booking flow | Direct revenue path |
| 3 | SMS templates | Already Bengali-capable — mind the UTF-16 segment cost from [FEATURE.md](./FEATURE.md) G2.2 |
| 4 | Marketing pages | Lowest urgency |

Store `preferredLanguage` on `User` (already added in [DATABASE.md](./DATABASE.md)) and use it for notifications too — a Bengali-speaking customer should get Bengali SMS.

**Commit:** `feat(i18n): Bengali localisation with next-intl`

---

# Phase X2 — PWA

*No app store, no review delays, works on cheap Android.*

### Step X2.1 — Installable

- `manifest.json`, maskable icons, splash screens.
- Service worker: cache the shell, salon list and images; **never** cache availability or wallet balance.
- "Add to home screen" prompt after a user's **second** completed booking — not on first visit, which people dismiss reflexively.

### Step X2.2 — Web push

Replaces most SMS cost once installed. Wire into the existing `NotificationService` as another channel.

- Ask permission **after** the first successful booking, in context: *"Want us to remind you 2 hours before?"* Never on page load.
- Critical for the live queue — "you're next, leave now" needs to arrive instantly and free.
- Fall back to SMS when push is unsubscribed or fails.

### Step X2.3 — Offline and low-bandwidth

Bangladesh has a lot of 3G. Target: usable first paint on a slow connection.

- Offline page with cached upcoming appointments.
- Optimistic UI on booking, reconciled on reconnect.
- Aggressive image optimisation — Cloudinary is already configured; serve `f_auto,q_auto,w_400` for cards.
- Budget: **< 200 KB JS** on the salon list route.

**Commit:** `feat(pwa): installable app with web push and offline support`

---

# Phase X3 — AI Style Advisor

*Your novel acquisition hook. You already have the stack.*

You have Gemini and pgvector wired up (`ai.service.ts`). Today it answers *"find me a salon"*. Upgrade it to answer *"what should I do with my hair?"* — and make every answer directly bookable.

> **Prerequisite:** [FIXING.md](./FIXING.md) F3.4 must be done first. The embedding model id in `ai.service.ts:9` is likely wrong, which would mean no salon has an embedding and AI search currently returns nothing. Verify before building on top of it.

### Step X3.1 — The flow

```
┌────────────────────────────────────────┐
│  What should I get?                    │
│                                        │
│  [ 📷 Upload a photo ]                 │
│  or tell us:                           │
│  [ round face, thick hair, office job ]│
│                                        │
│  ──────────────────────────────────    │
│  ✨ 3 styles for you                   │
│                                        │
│  🖼 Textured Crop                       │
│     Suits round faces — adds height    │
│     ~45 min · ৳150–250                 │
│     [ Book at Glamour, 800m — ৳105 ]   │
│                                        │
│  🖼 Side Part Fade         ...          │
└────────────────────────────────────────┘
```

The last line is the whole point: **every suggestion ends in a bookable slot at a real nearby salon at a real price.** An AI feature that doesn't convert to a booking is a toy.

### Step X3.2 — Build notes

- Gemini Vision for face shape and current hair; **never store the photo** — process and discard, and say so on screen. Trust matters more than the feature.
- Map each suggestion to your `ServiceCategory` enum, then to actual services at nearby salons via the existing pgvector search.
- Prefer salons that have the style in a **staff portfolio** ([BOOKING.md](./BOOKING.md) B5.1) — "Rasel has done this cut 12 times" is far more persuasive than a generic match.
- Rate-limit hard (Gemini vision calls cost real money): 5/day for signed-in users, 2 for guests.
- Cache suggestions per user for 24h.

### Step X3.3 — Style library

Seed 40–60 styles with reference images, face-shape fit, maintenance level and typical duration. This makes suggestions consistent instead of hallucinated, and gives you a browsable gallery — a good SEO surface in its own right.

**Commit:** `feat(ai): style advisor with bookable suggestions`

---

# Phase X4 — Home service

*Large under-served segment, especially for women.*

Many customers — particularly women — cannot easily visit a salon. Sheba.xyz proved the demand exists. You have the booking engine already; this is mostly a scheduling variation.

### Step X4.1 — Schema

```prisma
model Salon {
  homeServiceAvailable Boolean @default(false)
  homeServiceRadiusKm  Int     @default(5)
  homeServiceFeeMinor  Int     @default(0)
}

model Service {
  isHomeService Boolean @default(false)
}

model Appointment {
  locationType    LocationType @default(SALON)   // SALON | HOME
  serviceAddress  String?
  serviceLat      Float?
  serviceLng      Float?
  travelBufferMin Int          @default(0)
}
```

### Step X4.2 — What changes in availability

- Add **travel buffer** before and after each home booking — based on distance, default 30 min each way. The barber's calendar must be blocked for the travel too, or you will double-book them.
- Verify the customer address is inside `homeServiceRadiusKm`.
- Home bookings take a **higher deposit** (they cost the salon far more to no-show) — suggest 50% of total.
- Home bookings are **staff-specific by necessity**; "any available" does not apply.

### Step X4.3 — Trust and safety

Non-negotiable before launch, since you are sending a person to a private address:

- Staff identity verified by the owner, photo shown to the customer before arrival.
- Live "on the way" status with ETA.
- In-app masked calling or chat — never expose raw phone numbers.
- SOS button on both sides during a home appointment.
- Home-service reviews kept separate from in-salon reviews.

**Do not ship home service without X4.3.** One bad incident ends the business.

**Commit:** `feat(home-service): at-home bookings with travel buffers`

---

# Phase X5 — Salon Analytics Pro

*Your subscription revenue tier.*

Free tier keeps the basics (today's `dashboardStats.service.ts`). **Pro at ৳1,500/month** adds what an owner would actually pay for:

| Report | Question it answers |
|---|---|
| Utilisation heatmap | Which hours are dead? → feeds off-peak rules |
| Staff leaderboard | Revenue, repeat rate, avg rating per barber |
| Customer cohorts | Who is about to churn? |
| Service profitability | Revenue per chair-hour, not per booking |
| No-show analysis | Which times and customers no-show most |
| Revenue forecast | Next 30 days from booked + historical |
| Competitor benchmark | Anonymised: "your area averages 4.3★, ৳180" |

**Revenue per chair-hour** is the metric owners have never had and immediately understand. A ৳500 facial taking 90 minutes (৳333/hr) is worse than a ৳150 haircut taking 30 (৳300/hr — close, and far more repeatable). That single insight reshapes how a salon prices its menu, and it is the strongest reason to pay you monthly.

**Commit:** `feat(analytics): Pro tier salon analytics`

---

# Phase X6 — Growth mechanics

### X6.1 — Referrals
Both sides get ৳50 wallet credit when the referee completes their first booking. Track `referredBy` on `User`. Deep-linked share text to WhatsApp — the dominant sharing channel in Bangladesh.

### X6.2 — Waitlist
When a desirable slot is full, let the customer join a waitlist. On cancellation, notify the first waiter with a 15-minute claim window. Converts cancellations into revenue instead of losses, and it is one of the highest-satisfaction features you can ship.

### X6.3 — Group bookings
Multiple people, one booking — weddings, friends, family. Split payment across wallets. Rare but very high value.

### X6.4 — Product sales
Salons sell shampoo, wax, cosmetics at high margin. Attach products to a booking for collection at the visit — no delivery logistics, no warehouse.

### X6.5 — Multi-branch
Chains need one owner account managing several salons. `Salon.ownerId` already supports this; the dashboard does not. Add a branch switcher and consolidated reporting.

### X6.6 — Staff app view
A stripped dashboard for staff: today's schedule, mark in-chair/done, personal earnings and tips, own rating. `STAFF` role exists but has almost no surface today.

---

# Operational maturity

Things that matter once you have real users, in rough order of when they start to hurt:

| Area | What to do |
|---|---|
| **Backups** | Verify Neon PITR is on. **Restore to a scratch database and confirm it works** — an untested backup is not a backup. |
| **Staging** | A second Neon branch + Vercel/Render preview. Never migrate production untested again. |
| **CI** | GitHub Actions: lint, typecheck, test, `prisma validate` on every PR. Block merge on red. |
| **Migrations** | `prisma migrate deploy` in the release step, never `db push` against production. |
| **Monitoring** | Uptime checks on `/health/ready`; alert on error rate, p95 latency, failed payment intents, ledger drift. |
| **Rate limits** | Per-user as well as per-IP once you have accounts worth abusing. |
| **Secrets** | Move out of `.env` files into Render/Vercel secret storage. Rotate quarterly. |
| **Legal** | Terms, privacy policy, refund policy. Required by payment gateways and app stores. |
| **Support** | A real inbox and a response SLA. Money disputes need a human. |

---

## Done checklist

```
X1  □ Bengali localisation (owner dashboard first)
X2  □ PWA: installable, web push, offline
X3  □ AI Style Advisor → bookable suggestions
X4  □ Home service + travel buffers + safety
X5  □ Analytics Pro (revenue per chair-hour)
X6  □ Referrals · waitlist · group · products · multi-branch · staff view
Ops □ Backups tested · staging · CI · monitoring · legal · support
```

---

## A closing note on sequencing

The temptation will be to build X3 (AI) first — it demos beautifully. Resist it. An AI advisor that recommends a style at a salon with a broken booking flow and no SMS reminder produces a bad first experience at scale.

**Order that compounds:**
1. Make it safe ([FIXING.md](./FIXING.md))
2. Make money move ([PAYMENT.md](./PAYMENT.md))
3. Make booking work ([BOOKING.md](./BOOKING.md))
4. Make it worth choosing ([FEATURE.md](./FEATURE.md))
5. Make it spread (this file)

Each layer makes the next one worth more. Skipping down the list makes everything above it worth less.

# BOOKING.md — Booking Engine & Staff Selection

> Part of the plan set. See [PLAN.md](./PLAN.md) for the index.

---

## ⚠️ Assumption to confirm before you start

You said you want to change how staff selection works in booking. I have designed it as:

| Who | Does what |
|---|---|
| **Customer** (booking) | Picks **Service(s) → Barber → Date → Time → Confirm**. Barber defaults to **"Any available"** so nobody is forced to choose. |
| **Counter / station** | **Removed from the customer's screen entirely.** The system auto-assigns a free counter. Today `BookAppointmentModal.tsx:170-190` makes the customer pick "Counter 2" — that is internal salon plumbing and it confuses people. |
| **Salon owner** | Manages each staff member's **portfolio** from the owner dashboard — photos of their work, speciality, bio, which services they can do, and whether they are bookable. Staff do **not** upload their own portfolio. |

**If you meant something different — say so and I'll rewrite this file.** Everything else below holds either way.

---

## Why the current engine has to change

`Slot` rows are pre-created by the owner for each `(salon, service, date)` combination. That single decision causes five problems:

| Problem | Where | Consequence |
|---|---|---|
| Slot explosion | `slot.service.ts:5` `bulkCreateSlots` | 10 services × 30 days = **300 bulk-create runs per month**. Owners will quit over this. |
| Slot locked to one service | `slot.prisma` `serviceId` | A 30-min slot cannot host a 45-min service. Can't book two services together. |
| No staff dimension | `slot.prisma` | The same barber can be booked twice at once, through two different service slots. |
| No capacity | `counter.prisma` | A 4-chair salon cannot express "4 parallel bookings". |
| Timezone drift | `slot.service.ts:76` | `new Date("2026-09-17")` is UTC midnight; Dhaka is UTC+6, so evening slots land on the wrong day. |

**The fix:** stop storing availability. Compute it.

```
AVAILABLE(salon, date, services[], staff?) =
      salon operating hours
    ∩ staff working schedule       (new: StaffSchedule)
    − staff time off               (new: TimeOff)
    − existing appointments        (staff-level AND resource-level)
    − explicit blocks              (Slot, repurposed)
    , keeping only windows ≥ Σ service durations
    , capped by chair capacity
```

`Slot` survives, but only as an **override table** — blocked periods, holidays, special sessions. It stops being the source of truth.

---

# Phase B1 — Time foundations

*Nothing else works until time is stored correctly.*

### Step B1.1 — Real timestamps on Appointment

Today: `appointmentDate DateTime` + `startTime String` + `endTime String?`. Loose strings can't be compared, indexed or range-queried, and they're the root of the timezone bug.

```prisma
model Appointment {
  ...
  startsAt  DateTime   // timestamptz, UTC
  endsAt    DateTime   // timestamptz, UTC
  // appointmentDate / startTime / endTime — keep during migration, drop after
}
```

Backfill by combining the old columns in Dhaka time:

```sql
ALTER TABLE appointments ADD COLUMN "startsAt" TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN "endsAt"   TIMESTAMPTZ;

UPDATE appointments SET
  "startsAt" = ((("appointmentDate"::date) || ' ' || "startTime")::timestamp
                 AT TIME ZONE 'Asia/Dhaka'),
  "endsAt"   = ((("appointmentDate"::date) || ' ' ||
                 COALESCE("endTime", "startTime"))::timestamp
                 AT TIME ZONE 'Asia/Dhaka');

ALTER TABLE appointments ALTER COLUMN "startsAt" SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN "endsAt"   SET NOT NULL;
```

Rule from here on: **store UTC, render `Asia/Dhaka`**. Add `timezone String @default("Asia/Dhaka")` to `Salon` so a second city later is not a rewrite.

**Verify:** an appointment showing 9:00 PM before the migration still shows 9:00 PM after.
**Commit:** `refactor(booking): store appointments as UTC timestamps`

---

### Step B1.2 — Make double-booking impossible in the database

Your current guard (`appointment.service.ts:79-100`) is a conditional `updateMany` in a transaction — a genuinely correct pattern for claiming a slot row. But once availability is computed rather than stored, there is no row to claim. Let Postgres enforce the invariant instead:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
  ADD CONSTRAINT no_staff_overlap
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  )
  WHERE (status IN ('PENDING','CONFIRMED','IN_PROGRESS') AND "staffId" IS NOT NULL);
```

Postgres now physically refuses to store two overlapping appointments for the same barber. Application checks lose races under load; an exclusion constraint cannot.

Catch the violation and return a clean error:

```ts
try {
  await tx.appointment.create({ data: {...} });
} catch (e: any) {
  if (e.code === "P2010" && String(e.meta?.message).includes("no_staff_overlap")) {
    throw new ApiError(409, "That barber was just booked. Please pick another time.");
  }
  throw e;
}
```

Add the same constraint on `counterId` once counters carry real capacity.

**Verify:** fire 50 concurrent bookings for the same barber and time — **exactly one** succeeds, 49 get a clean 409.
**Commit:** `feat(booking): database-level double-booking prevention`

---

# Phase B2 — Staff schedules

### Step B2.1 — Working hours and time off

New file `prisma/schema/schedule.prisma`:

```prisma
model StaffSchedule {
  id        String   @id @default(uuid())
  staffId   String
  dayOfWeek Int      // 0 = Sunday … 6 = Saturday
  startTime String   // "10:00" — local to the salon's timezone
  endTime   String   // "21:00"
  breakStart String? // "14:00"
  breakEnd   String? // "15:00"
  isActive  Boolean  @default(true)

  staff Staff @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@unique([staffId, dayOfWeek])
  @@index([staffId])
  @@map("staff_schedules")
}

model TimeOff {
  id        String   @id @default(uuid())
  staffId   String?            // null = whole salon closed (Eid, renovation)
  salonId   String
  startsAt  DateTime
  endsAt    DateTime
  reason    String?
  createdAt DateTime @default(now())

  @@index([salonId, startsAt])
  @@index([staffId, startsAt])
  @@map("time_off")
}
```

Seed a sensible default when a staff member is added (Sat–Thu 10:00–21:00, Friday off) so the owner is never blocked by an empty schedule.

---

### Step B2.2 — Owner UI: weekly schedule

`Dashboard → Staff → [name] → Schedule`

```
        Rasel Ahmed
┌──────────────────────────────────────────┐
│ Sat  [✓]  10:00 — 21:00   break 14:00-15:00│
│ Sun  [✓]  10:00 — 21:00                    │
│ Mon  [✓]  10:00 — 21:00                    │
│ Tue  [✓]  12:00 — 21:00                    │
│ Wed  [✓]  10:00 — 21:00                    │
│ Thu  [✓]  10:00 — 22:00                    │
│ Fri  [ ]  — off —                          │
├──────────────────────────────────────────┤
│  Time off:  [ + Add ]                      │
│  20–24 Sep · Eid holiday                   │
└──────────────────────────────────────────┘
```

This replaces `SlotManagement.tsx` as the owner's main scheduling screen. **Set once, works forever** — instead of bulk-creating slots every day.

**Commit:** `feat(staff): weekly schedules and time off`

---

# Phase B3 — The availability engine

### Step B3.1 — AvailabilityService

New module `src/app/modules/Availability/`.

```
GET /availability
  ?salonId=<uuid>
  &date=2026-09-17
  &serviceIds=svc1,svc2       // total duration = sum + buffers
  &staffId=<uuid>             // optional; omit for "any available"
```

```ts
const getAvailability = async (q: AvailabilityQuery) => {
  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id: q.salonId, isDeleted: false, status: "ACTIVE" },
    include: { counters: { where: { isDeleted: true === false } } },
  });

  const services = await prisma.service.findMany({
    where: { id: { in: q.serviceIds }, salonId: q.salonId, isActive: true, isDeleted: false },
  });
  if (services.length !== q.serviceIds.length) throw new ApiError(400, "Invalid service selection");

  const totalMin = services.reduce((s, x) => s + x.duration + (x.bufferMin ?? 0), 0);

  // Which barbers can perform ALL requested services?
  const candidates = await prisma.staff.findMany({
    where: {
      salonId: q.salonId, isDeleted: false, isBookable: true,
      status: { in: ["AVAILABLE", "BUSY"] },
      ...(q.staffId ? { id: q.staffId } : {}),
      AND: q.serviceIds.map((id) => ({ staffServices: { some: { serviceId: id } } })),
    },
    include: { schedules: true, user: { select: { name: true, profilePhoto: true } } },
  });

  const dayStart = dhakaStartOfDay(q.date, salon.timezone);
  const dayEnd   = addDays(dayStart, 1);

  const [booked, timeOff, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        salonId: q.salonId,
        startsAt: { gte: dayStart, lt: dayEnd },
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: { staffId: true, counterId: true, startsAt: true, endsAt: true },
    }),
    prisma.timeOff.findMany({
      where: { salonId: q.salonId, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
    }),
    prisma.slot.findMany({
      where: { salonId: q.salonId, date: { gte: dayStart, lt: dayEnd }, status: "BLOCKED" },
    }),
  ]);

  // Walk the day in 15-min steps; keep every start where SOME candidate is free
  // for the full totalMin AND a counter is free.
  const GRAIN = 15;
  const results: AvailableSlot[] = [];

  for (let t = openingTime(salon, q.date); t < closingTime(salon, q.date); t = addMinutes(t, GRAIN)) {
    const end = addMinutes(t, totalMin);
    if (end > closingTime(salon, q.date)) break;
    if (t < new Date()) continue;                       // never offer the past

    const freeStaff = candidates.filter((st) =>
      worksDuring(st.schedules, t, end, salon.timezone) &&
      !hasTimeOff(timeOff, st.id, t, end) &&
      !hasOverlap(booked, "staffId", st.id, t, end) &&
      !overlapsBlock(blocks, t, end)
    );
    if (freeStaff.length === 0) continue;

    const usedCounters = booked.filter((b) => overlaps(b, t, end)).length;
    if (usedCounters >= totalCapacity(salon.counters)) continue;

    results.push({
      startsAt: t,
      endsAt: end,
      availableStaff: freeStaff.map((s) => ({
        id: s.id, name: s.displayName ?? s.user.name,
        photo: s.user.profilePhoto, rating: s.rating,
      })),
      priceMinor: resolvePrice(services, t),            // off-peak applied here
      isOffPeak: isOffPeak(salon, t),
    });
  }

  return { date: q.date, durationMin: totalMin, slots: results };
};
```

Notes that matter:
- **15-minute grain** is the sweet spot. 5 min is noise; 30 min wastes capacity.
- **Never offer a past time** — an obvious bug that ships in most first versions.
- Cache per `(salonId, date, serviceIds, staffId)` for ~60 seconds. Bust on any booking for that salon/date.
- The off-peak price is resolved **here**, so the customer sees the discount in the slot grid itself — see [FEATURE.md](./FEATURE.md).

**Verify:** a salon open 10:00–21:00 with one barber working 10:00–14:00 and one booking at 11:00 returns exactly the expected free windows and nothing else.
**Commit:** `feat(booking): computed availability engine`

---

### Step B3.2 — Repurpose Slot as an override table

Stop generating slots. `Slot` now only means *"this window is deliberately unavailable"* (or a special session).

- Keep `bulkCreateSlots` but rename it to `blockTimeRange` and default the status to `BLOCKED`.
- `GET /slots` stays for the owner's calendar view; customers now use `GET /availability`.
- **Do not delete existing slot rows.** Migrate booked ones by linking their appointments to the new `startsAt`/`endsAt` and marking the rest `BLOCKED` or inactive.

**Commit:** `refactor(slots): repurpose Slot as block/override table`

---

# Phase B4 — Multi-service bookings

### Step B4.1 — AppointmentItem

`Appointment.serviceId` is singular, so "haircut + beard + facial" is impossible today. That directly caps your average order value, and it is the most common real-world booking shape.

```prisma
model AppointmentItem {
  id            String   @id @default(uuid())
  appointmentId String
  serviceId     String
  staffId       String?         // per-item: hair by Rasel, facial by Mim
  sequence      Int             // order performed
  priceMinor    Int             // FROZEN at booking time
  durationMin   Int             // FROZEN at booking time
  createdAt     DateTime @default(now())

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  service     Service     @relation(fields: [serviceId], references: [id])
  staff       Staff?      @relation(fields: [staffId], references: [id], onDelete: SetNull)

  @@index([appointmentId])
  @@map("appointment_items")
}
```

**Freezing price and duration is not optional.** If the owner raises the haircut price tomorrow, a booking made today must still be the price the customer agreed to. Reading `service.priceMinor` at completion time would silently change historical bookings and corrupt every revenue report.

`Appointment` gains `totalMinor` and `depositMinor` (see [PAYMENT.md](./PAYMENT.md) P3.2). Keep `serviceId` through the migration, backfill one `AppointmentItem` per existing appointment, then drop it.

**Commit:** `feat(booking): multi-service bookings via AppointmentItem`

---

### Step B4.2 — Auto-assign the counter

Remove `counterId` from the customer's input. In the booking transaction, pick the first counter with no overlapping appointment; if every counter is busy, the slot should not have been offered — return 409.

```prisma
model Appointment {
  counterId String?     // now nullable, server-assigned
}
model Counter {
  capacity Int @default(1)   // chairs at this station
}
```

Also drop `counterId` from `appointment.validation.ts:8` (currently `nonempty`) and from `book-appoiments.ts:14`.

**Commit:** `feat(booking): auto-assign counter, remove from customer input`

---

# Phase B5 — Staff selection & portfolio

*This is the change you asked for.*

### Step B5.1 — Staff profile fields

```prisma
model Staff {
  ...
  displayName String?              // "Rasel Bhai" — what customers see
  isBookable  Boolean  @default(true)
  tagline     String?              // "Fade specialist, 8 years"
  portfolio   StaffPortfolio[]
  schedules   StaffSchedule[]
}

model StaffPortfolio {
  id        String   @id @default(uuid())
  staffId   String
  imageUrl  String                 // Cloudinary — already configured
  caption   String?
  serviceId String?                // tag it: "this is a fade"
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  staff   Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)
  service Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)

  @@index([staffId, sortOrder])
  @@map("staff_portfolio")
}
```

---

### Step B5.2 — Owner manages the portfolio

`Dashboard → Staff → [name] → Portfolio` (owner-only, per your requirement).

```
   Rasel Ahmed          ⭐ 4.8 (52)
┌───────────────────────────────────────┐
│ Display name  [ Rasel Bhai          ] │
│ Tagline       [ Fade specialist, 8y ] │
│ Bookable      [✓] customers can pick  │
│                                       │
│ Can perform:                          │
│   [✓] Haircut  [✓] Beard  [ ] Facial  │
│                                       │
│ Portfolio                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │ 🖼 │ │ 🖼 │ │ 🖼 │ │ +  │          │
│  └────┘ └────┘ └────┘ └────┘          │
│   Fade   Beard  Layer  Upload         │
└───────────────────────────────────────┘
```

Endpoints — all `auth("SALON_OWNER")` with an ownership check that the staff belongs to the caller's salon:

| Method | Path |
|---|---|
| `POST` | `/staff/:id/portfolio` (multipart → Cloudinary) |
| `PATCH` | `/staff/:id/portfolio/:imageId` (caption, tag, order) |
| `DELETE` | `/staff/:id/portfolio/:imageId` |
| `PATCH` | `/staff/:id/profile` (displayName, tagline, isBookable) |
| `PUT` | `/staff/:id/services` (which services they can do) |

Cloudinary is already in `package.json` and `config/index.ts` — reuse it. Validate: images only, ≤ 5 MB, max 12 per staff member.

**Commit:** `feat(staff): owner-managed staff profiles and portfolios`

---

### Step B5.3 — Public staff profile

`/salons/[id]/staff/[staffId]` — photo, display name, tagline, rating, portfolio grid, services with prices, next 3 available slots, and a **Book with Rasel** button.

Also add a **Our Team** section on the salon detail page (`SalonDetails.tsx`) with a card per bookable staff member.

> Currently the customer cannot choose a barber *at all* — `BookAppointmentModal.tsx` has no staff selector, and `book-appoiments.ts:15` reads a `staffId` that is never sent. This step is what closes that gap, and it is the single biggest missing feature in the product.

**Commit:** `feat(staff): public staff profile pages`

---

### Step B5.4 — Rewrite the booking modal

Replace `BookAppointmentModal.tsx` entirely. Four steps, with the counter gone:

```
STEP 1 — SERVICES  (multi-select)
┌────────────────────────────────────────┐
│ [✓] Haircut            30 min    ৳150  │
│ [✓] Beard trim         15 min     ৳80  │
│ [ ] Facial             45 min    ৳500  │
│ ────────────────────────────────────── │
│ 2 selected · 45 min · ৳230             │
│                             [ Next → ] │
└────────────────────────────────────────┘

STEP 2 — BARBER
┌────────────────────────────────────────┐
│ ┌────────────────────────────────────┐ │
│ │ ✨ Any available      fastest      │ │  ← default
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 🖼 Rasel Bhai   ⭐4.8 (52)          │ │
│ │    Fade specialist   [see work →]  │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 🖼 Karim        ⭐4.6 (31)          │ │
│ └────────────────────────────────────┘ │
│                    [ ← Back ] [ Next ] │
└────────────────────────────────────────┘

STEP 3 — DATE & TIME
┌────────────────────────────────────────┐
│  Sep  16  17  18  19  20  21  22       │
│       Tue [Wed] Thu Fri Sat Sun Mon    │
│                                        │
│  Morning                               │
│   10:00   10:30   11:00                │
│  Afternoon      🔥 Happy Hour −30%     │
│   12:30   13:00   13:30                │
│    ৳161    ৳161    ৳161                │
│  Evening                               │
│   17:00   17:30   —      19:00         │
│                    ↑ booked            │
│                    [ ← Back ] [ Next ] │
└────────────────────────────────────────┘

STEP 4 — CONFIRM
┌────────────────────────────────────────┐
│  Glamour Salon · Dhanmondi             │
│  Wed 17 Sep, 12:30 PM · with Rasel     │
│                                        │
│  Haircut                        ৳150   │
│  Beard trim                      ৳80   │
│  Happy Hour −30%                −৳69   │
│  ──────────────────────────────────    │
│  Total                          ৳161   │
│  Pay now (deposit)               ৳30   │
│  Pay at salon                   ৳131   │
│                                        │
│  Notes [                            ]  │
│  Wallet ৳470 available                 │
│              [ Confirm Booking ]       │
└────────────────────────────────────────┘
```

Implementation notes:
- Keep `useActionState` + server actions — the existing pattern is good.
- **Gate on login before step 1**, not at submit. Today an unauthenticated user fills the whole form and then fails. Send them to `/login?redirect=/salons/<id>?book=1`.
- Fetch availability on step 3 entry, keyed by the step-1 and step-2 choices.
- "Any available" sends `staffId: null`; the server picks the barber with the lightest load that day.
- Show the price total live from step 1 onward.
- On 402 (insufficient wallet), show an inline top-up prompt instead of an error toast.

**Verify:** book 2 services with a chosen barber at an off-peak time — one appointment, two `AppointmentItem` rows, discounted total, ৳30 held, counter auto-assigned, barber not double-booked.
**Commit:** `feat(booking): rebuild booking flow with barber selection`

---

# Phase B6 — Reschedule & cancel

### Step B6.1 — Cancellation policy

| When | Result |
|---|---|
| More than `cancellationWindowMin` before start (default 120 min) | Free. Deposit released. |
| Inside the window | Deposit forfeited per policy. |
| Salon cancels, any time | Deposit released + goodwill credit. |

Show the exact deadline in plain words on the appointment card: *"Free cancellation until 10:30 AM"*. Never make someone compute it.

### Step B6.2 — Reschedule

One move instead of cancel-then-rebook: pick a new time from `/availability`, and in a single transaction update `startsAt`/`endsAt` and reassign the counter. **The deposit carries over** — it is not released and re-held.

Limit to 2 reschedules per appointment, and disallow reschedule inside the cancellation window. Both rules exist to stop the feature being used to dodge the no-show penalty.

**Commit:** `feat(booking): reschedule and cancellation policy`

---

## Done checklist

```
B1  Time foundations
  □ B1.1  startsAt / endsAt UTC migration + backfill
  □ B1.2  btree_gist exclusion constraint — no double-booking

B2  Schedules
  □ B2.1  StaffSchedule + TimeOff schema
  □ B2.2  Owner weekly schedule UI

B3  Availability
  □ B3.1  AvailabilityService + GET /availability
  □ B3.2  Slot repurposed to blocks only

B4  Multi-service
  □ B4.1  AppointmentItem, frozen price + duration
  □ B4.2  Counter auto-assigned, removed from customer input

B5  Staff  ← your change
  □ B5.1  displayName, isBookable, tagline, StaffPortfolio
  □ B5.2  Owner-managed portfolio UI + endpoints
  □ B5.3  Public staff profile + "Our Team"
  □ B5.4  4-step booking modal with barber selection

B6  Changes
  □ B6.1  Cancellation policy with visible deadline
  □ B6.2  Reschedule carrying the deposit
```

**The one test that must pass before this ships:** 50 concurrent bookings for the same barber and time → exactly 1 succeeds.

Next: [FEATURE.md](./FEATURE.md) — queue, off-peak pricing, loyalty.

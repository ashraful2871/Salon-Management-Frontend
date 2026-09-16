# DATABASE.md — Schema Reference

> Part of the plan set. See [PLAN.md](./PLAN.md) for the index.
> Every schema change across all phases, in one place. Each entry links to the file that explains *why*.

All files live in `Salon-Management-Server/prisma/schema/` (you use `prismaSchemaFolder`, so one model group per file is fine).

---

## Migration order

Migrations are not independent. Run them in this order or they will fail on missing columns:

```
1.  add_indexes                    FIXING.md F3.1     ← safe, do first
2.  money_to_minor                 PAYMENT.md P1.2    ← breaks reads; fix call sites same commit
3.  add_wallet                     PAYMENT.md P1.3
4.  add_payment_intent             PAYMENT.md P2.4
5.  appointment_timestamps         BOOKING.md B1.1    ← backfill required
6.  staff_overlap_constraint       BOOKING.md B1.2    ← needs #5
7.  add_staff_schedules            BOOKING.md B2.1
8.  add_appointment_items          BOOKING.md B4.1    ← backfill required
9.  add_deposit_policy             PAYMENT.md P3.1
10. add_staff_portfolio            BOOKING.md B5.1
11. add_ledger_and_payouts         PAYMENT.md P4.1-3
12. add_pricing_rules              FEATURE.md G1.1
13. add_notifications              FEATURE.md G2.1
14. add_salon_type_and_geo         FEATURE.md G5.1-2
15. add_queue                      FEATURE.md G3.1
16. add_loyalty_packages_coupons   FEATURE.md G4
17. add_favorites                  FEATURE.md G5.4
18. add_home_service               GROWTH.md X4.1
```

**Rules:**
- Always `prisma migrate dev` locally → review the generated SQL → commit it. Never `db push` against production.
- Any migration that drops a column needs a **backfill step in the same migration file**, hand-written.
- Take a Neon branch snapshot before #2, #5 and #8 — those three transform existing data.

---

## Modified models

### `User` — `user.prisma`

```prisma
model User {
  // existing fields unchanged
  emailVerified     Boolean @default(false)   // FIXING F2.3
  phoneVerified     Boolean @default(false)   // FIXING F2.3
  preferredLanguage String  @default("bn")    // GROWTH X1
  referredBy        String?                   // GROWTH X6.1

  wallet             Wallet?
  loyaltyAccount     LoyaltyAccount?
  paymentIntents     PaymentIntent[]
  notifications      Notification[]
  notificationPrefs  NotificationPreference?
  favorites          Favorite[]
  queueEntries       QueueEntry[]
  verificationTokens VerificationToken[]

  @@index([role, status])
  @@index([createdAt])
}
```

### `Salon` — `salon.prisma`

```prisma
model Salon {
  // existing fields unchanged
  latitude              Float?                        // FEATURE G5.2
  longitude             Float?                        // FEATURE G5.2
  salonType             SalonType   @default(GENTS)   // FEATURE G5.1
  timezone              String      @default("Asia/Dhaka")  // FIXING F3.2
  bookingModes          BookingMode[] @default([APPOINTMENT]) // FEATURE G3.1
  depositMinor          Int         @default(3000)    // PAYMENT P3.1  — ৳30
  depositPercent        Int?                          // PAYMENT P3.1
  cancellationWindowMin Int         @default(120)     // PAYMENT P3.1
  noShowSalonSharePct   Int         @default(70)      // PAYMENT P3.1
  homeServiceAvailable  Boolean     @default(false)   // GROWTH X4.1
  homeServiceRadiusKm   Int         @default(5)       // GROWTH X4.1
  homeServiceFeeMinor   Int         @default(0)       // GROWTH X4.1

  pricingRules PricingRule[]
  queueEntries QueueEntry[]
  timeOff      TimeOff[]
  packages     Package[]

  @@index([status, isDeleted])
  @@index([division, district, area])
  @@index([ownerId])
  @@index([salonType, status])
}
```

### `Service` — `service.prisma`

```prisma
model Service {
  // price Float        ← REMOVED
  priceMinor    Int                           // PAYMENT P1.2 — poisha
  bufferMin     Int     @default(0)           // BOOKING B3.1 — cleanup time after
  isHomeService Boolean @default(false)       // GROWTH X4.1

  appointmentItems AppointmentItem[]
  pricingRules     PricingRule[]
  portfolioItems   StaffPortfolio[]

  @@index([salonId, isDeleted, isActive])
  @@index([category])
}
```

### `Appointment` — `appointment.prisma`

```prisma
model Appointment {
  // appointmentDate / startTime / endTime  ← dropped AFTER backfill
  startsAt        DateTime                       // BOOKING B1.1 — UTC
  endsAt          DateTime                       // BOOKING B1.1 — UTC
  totalMinor      Int          @default(0)       // PAYMENT P3.2
  depositMinor    Int          @default(0)       // PAYMENT P3.2
  source          BookingSource @default(PLATFORM) // PAYMENT P4.1 — commission logic
  isFirstVisit    Boolean      @default(false)   // PAYMENT P4.1 — 0% repeat rule
  counterId       String?                        // BOOKING B4.2 — now nullable, auto-assigned
  locationType    LocationType @default(SALON)   // GROWTH X4.1
  serviceAddress  String?                        // GROWTH X4.1
  serviceLat      Float?                         // GROWTH X4.1
  serviceLng      Float?                         // GROWTH X4.1
  travelBufferMin Int          @default(0)       // GROWTH X4.1
  rescheduleCount Int          @default(0)       // BOOKING B6.2 — max 2

  items       AppointmentItem[]
  ledgerEntries LedgerEntry[]

  @@index([salonId, startsAt])
  @@index([customerId, startsAt])
  @@index([staffId, startsAt])
  @@index([status, startsAt])
}
```

Plus the raw-SQL exclusion constraint Prisma cannot express ([BOOKING.md](./BOOKING.md) B1.2):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE appointments
  ADD CONSTRAINT no_staff_overlap
  EXCLUDE USING gist ("staffId" WITH =, tstzrange("startsAt","endsAt",'[)') WITH &&)
  WHERE (status IN ('PENDING','CONFIRMED','IN_PROGRESS') AND "staffId" IS NOT NULL);
```

### `Staff` — `staff.prisma`

```prisma
model Staff {
  displayName String?                   // BOOKING B5.1 — "Rasel Bhai"
  tagline     String?                   // BOOKING B5.1
  isBookable  Boolean @default(true)    // BOOKING B5.1

  schedules        StaffSchedule[]
  timeOff          TimeOff[]
  portfolio        StaffPortfolio[]
  appointmentItems AppointmentItem[]

  @@index([salonId, isDeleted])
  @@index([salonId, isBookable])
}
```

### `Payment` — `payment.prisma`

```prisma
model Payment {
  // amount Float      ← REMOVED
  amountMinor    Int                       // PAYMENT P1.2
  collectedMinor Int     @default(0)       // PAYMENT P4.4 — cash taken at counter
  gatewayRef     String?                   // PAYMENT P2.6
  idempotencyKey String? @unique           // PAYMENT P2.6
  rawPayload     Json?                     // PAYMENT P2.6 — audit

  @@index([status, createdAt])
}
```

### `Counter` / `Slot` / `Review`

```prisma
model Counter {
  capacity Int @default(1)              // BOOKING B4.2 — chairs at this station
  @@index([salonId, isDeleted])
}

model Slot {                             // BOOKING B3.2 — now an OVERRIDE table
  reason String?                         // "Eid holiday", "staff training"
  @@index([salonId, date, status])
}

model Review {
  photos      String[]                   // FEATURE G4.1 — +20 loyalty points
  ownerReply  String?
  repliedAt   DateTime?
  @@index([salonId, createdAt])
  @@index([staffId])
}
```

---

## New models by file

| File | Models | Source |
|---|---|---|
| `wallet.prisma` | `Wallet`, `WalletTransaction` | [PAYMENT.md](./PAYMENT.md) P1.3 |
| `intent.prisma` | `PaymentIntent` | [PAYMENT.md](./PAYMENT.md) P2.4 |
| `ledger.prisma` | `LedgerEntry`, `Payout`, `CommissionRule` | [PAYMENT.md](./PAYMENT.md) P4 |
| `schedule.prisma` | `StaffSchedule`, `TimeOff` | [BOOKING.md](./BOOKING.md) B2.1 |
| `item.prisma` | `AppointmentItem` | [BOOKING.md](./BOOKING.md) B4.1 |
| `portfolio.prisma` | `StaffPortfolio` | [BOOKING.md](./BOOKING.md) B5.1 |
| `pricing.prisma` | `PricingRule`, `Coupon`, `CouponRedemption` | [FEATURE.md](./FEATURE.md) G1.1, G4.4 |
| `notification.prisma` | `Notification`, `NotificationPreference` | [FEATURE.md](./FEATURE.md) G2.1 |
| `queue.prisma` | `QueueEntry` | [FEATURE.md](./FEATURE.md) G3.1 |
| `loyalty.prisma` | `LoyaltyAccount`, `LoyaltyTransaction`, `Package`, `PackagePurchase` | [FEATURE.md](./FEATURE.md) G4 |
| `misc.prisma` | `Favorite`, `AuditLog`, `VerificationToken` | various |

### `AuditLog` — used by all money paths

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  actorId    String?              // null = system
  actorRole  String?
  action     String               // "PAYOUT_MARKED_PAID", "WALLET_ADJUSTED"
  entityType String
  entityId   String
  before     Json?
  after      Json?
  reason     String?
  ip         String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([actorId, createdAt])
  @@map("audit_logs")
}
```

Write an audit row for: every admin wallet adjustment, every payout status change, every no-show mark and reversal, every user role/status change, every salon approval or rejection. Disputes and regulators both require this, and you cannot reconstruct it after the fact.

---

## Complete enum additions — `enum.prisma`

```prisma
enum SalonType        { GENTS  LADIES  UNISEX  KIDS }
enum BookingMode      { APPOINTMENT  QUEUE }
enum LocationType     { SALON  HOME }
enum BookingSource    { PLATFORM  WALK_IN  OWNER_ENTERED }
enum QueueStatus      { WAITING  CALLED  IN_CHAIR  SERVED  ABANDONED  EXPIRED }

enum WalletTxType {
  TOPUP  TOPUP_REVERSAL
  DEPOSIT_HOLD  DEPOSIT_RELEASE  DEPOSIT_APPLIED  DEPOSIT_FORFEIT
  REFUND  CASHBACK  GOODWILL_CREDIT  ADJUSTMENT  WITHDRAWAL
}

enum IntentPurpose    { WALLET_TOPUP  BOOKING  PACKAGE }
enum IntentStatus     { INITIATED  PENDING  SUCCESS  FAILED  CANCELLED  EXPIRED }
enum LedgerAccount    { SALON_PAYABLE  PLATFORM_REVENUE  CUSTOMER_WALLET  GATEWAY_CLEARING }
enum PayoutStatus     { PENDING  PROCESSING  PAID  FAILED }
enum CommissionScope  { NEW_CUSTOMER  OFF_PEAK  ALL }
enum LoyaltyTier      { BRONZE  SILVER  GOLD  PLATINUM }
enum NotificationChannel { SMS  EMAIL  PUSH  IN_APP }
enum NotificationStatus  { QUEUED  SENT  FAILED  READ }
enum NotificationType {
  BOOKING_CONFIRMED  BOOKING_REMINDER  BOOKING_CANCELLED  BOOKING_COMPLETED
  DEPOSIT_HELD  DEPOSIT_RELEASED  DEPOSIT_FORFEITED
  TOPUP_SUCCESS  TOPUP_FAILED  CASHBACK_EARNED
  QUEUE_POSITION  QUEUE_CALLED
  PAYOUT_SENT  NEW_BOOKING_OWNER  DAILY_SUMMARY
  REVIEW_REQUEST  WINBACK  PROMO
}
enum TokenType { PASSWORD_RESET  EMAIL_VERIFY  PHONE_VERIFY }
```

---

## Raw SQL that Prisma cannot express

Keep these in migration files, applied after the Prisma-generated SQL.

```sql
-- 1. Wallet integrity (PAYMENT P1.3)
ALTER TABLE wallets ADD CONSTRAINT wallet_balance_non_negative CHECK (balance >= 0);
ALTER TABLE wallets ADD CONSTRAINT wallet_held_non_negative    CHECK ("heldBalance" >= 0);
ALTER TABLE wallets ADD CONSTRAINT wallet_held_lte_balance     CHECK ("heldBalance" <= balance);

-- 2. No double-booking (BOOKING B1.2)
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE appointments
  ADD CONSTRAINT no_staff_overlap
  EXCLUDE USING gist ("staffId" WITH =, tstzrange("startsAt","endsAt",'[)') WITH &&)
  WHERE (status IN ('PENDING','CONFIRMED','IN_PROGRESS') AND "staffId" IS NOT NULL);

-- 3. Vector index for AI search (FIXING F3.4)
CREATE INDEX IF NOT EXISTS salons_embedding_hnsw
  ON salons USING hnsw (embedding vector_cosine_ops);

-- 4. Geo distance (FEATURE G5.2)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
CREATE INDEX salons_geo ON salons USING gist (ll_to_earth(latitude, longitude))
  WHERE latitude IS NOT NULL;

-- 5. Case-insensitive search on service names (FEATURE G5.3)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX services_name_trgm ON services USING gin (name gin_trgm_ops);
```

---

## Data integrity jobs

Scheduled checks that catch problems before your customers do.

| Job | Frequency | Alert when |
|---|---|---|
| **Ledger reconciliation** | hourly | `wallets.balance ≠ SUM(wallet_transactions.amount)` for any wallet |
| **Held balance check** | hourly | `heldBalance ≠ SUM` of active `DEPOSIT_HOLD` amounts |
| **Stale intents** | hourly | any `PaymentIntent` PENDING > 30 min → re-query gateway; alert past 24h |
| **Appointment ledger balance** | daily | any completed appointment whose `LedgerEntry` rows do not sum to zero |
| **Orphan holds** | daily | held deposits against appointments that are already terminal |
| **Auto no-show** | every 5 min | `CONFIRMED` appointments more than 20 min past `startsAt` |
| **Queue expiry** | every 5 min | `CALLED` entries with no response for 10 min |

The reconciliation job is the important one. **If the ledger drifts even by ৳1, stop and find out why before writing another feature.** Money bugs compound silently.

---

## Safety checklist before each migration

```
□ Neon branch snapshot taken (mandatory for #2, #5, #8)
□ Generated SQL read line by line, not just `migrate dev` blindly
□ Every dropped column has a backfill in the same migration file
□ Tested against a copy of production-shaped data, not an empty database
□ Rollback path written down before applying
□ Application code for the new shape deployed in the same release
```

# FIXING.md — What to Fix Before Production

> Part of the plan set. See [PLAN.md](./PLAN.md) for the index and strategy.
> **Do these before any real user or real money touches the system.**

Every step below is small enough to do in one sitting, ends with a verification you can run, and has a suggested commit message. Work top to bottom.

**Legend:** 🔴 = exposure right now · 🟠 = breaks users · 🟡 = breaks at scale

---

## Phase F1 — Stop the bleeding (do today)

### 🔴 Step F1.1 — Rotate the leaked credentials

`Salon-Management-Server/.env.example` contains **real working credentials**, and the file is in git history on the repo:

| Credential | Where to rotate |
|---|---|
| Neon Postgres connection string (with password) | Neon console → Project → Roles → Reset password |
| `GEMINI_API_KEY` | Google AI Studio → API keys → Delete + create new |
| `SMTP_PASS` (Gmail app password) | Google Account → Security → App passwords → Revoke + create new |

Then replace the file contents with placeholders only:

```bash
# Salon-Management-Server/.env.example
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
JWT_SECRET=replace-me
EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=replace-me
REFRESH_TOKEN_EXPIRES_IN=90d
CLOUDINARY_CLOUD_NAME=replace-me
CLOUDINARY_API_KEY=replace-me
CLOUDINARY_API_SECRET=replace-me
GEMINI_API_KEY=replace-me
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=replace-me
SMTP_PASS=replace-me
```

Then confirm `.env` is ignored:

```bash
cd "D:\Projects\salon management\Salon-Management-Server"
cat .gitignore | grep -E "^\.env"
git check-ignore -v .env        # must print a match
```

**Note:** rotating is what actually protects you. Removing the file from history is optional cleanup — the keys are already exposed, so assume they are compromised regardless.

**Verify:** app still boots with the new values in your local `.env`; `.env.example` contains no real secret.
**Commit:** `chore(security): scrub secrets from .env.example after rotation`

---

### 🔴 Step F1.2 — Close the payment authorization hole

**The bug:** `src/app/modules/Payment/payment.service.ts:31-38` writes `payload.amount` and `payload.status` straight from `req.body`, and `payment.routes.ts:8-12` allows `CUSTOMER`. Any logged-in user can mark any appointment as fully paid for ৳1.

**Fix — `payment.routes.ts`:** remove `CUSTOMER` from the create route.

```ts
router.post(
  "/",
  auth("ADMIN", "SALON_OWNER"),   // was: "CUSTOMER", "ADMIN", "SALON_OWNER"
  validateRequest(PaymentValidation.createPaymentValidation),
  PaymentController.createPayment
);
```

**Fix — `payment.service.ts`:** derive the amount server-side, never accept a client status.

```ts
const createPayment = async (payload: any) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: payload.appointmentId },
    include: { service: true },
  });
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");

  const existing = await prisma.payment.findUnique({
    where: { appointmentId: payload.appointmentId },
  });
  if (existing) throw new ApiError(StatusCodes.CONFLICT, "Payment already exists");

  return prisma.payment.create({
    data: {
      appointmentId: payload.appointmentId,
      amount: appointment.service.price,   // ALWAYS server-derived
      paymentMethod: payload.paymentMethod,
      status: "PENDING",                   // NEVER from the client
      // transactionId / paymentDate are set by the gateway webhook only
    },
  });
};
```

Add a zod schema so only the two safe fields get through:

```ts
// payment.validation.ts (new file)
const createPaymentValidation = z.object({
  body: z.object({
    appointmentId: z.string().uuid(),
    paymentMethod: z.enum(["CASH", "CARD", "ONLINE", "MOBILE_BANKING"]),
  }),
});
```

**Verify:**
```bash
# as a logged-in CUSTOMER — must be 403
curl -X POST localhost:5000/api/v1/payments \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H "Content-Type: application/json" \
  -d '{"appointmentId":"<id>","amount":1,"status":"COMPLETED","paymentMethod":"CASH"}'

# as SALON_OWNER — must create a PENDING row with the real service price, ignoring amount/status
```
**Commit:** `fix(security): derive payment amount server-side, block client-set status`

---

### 🟠 Step F1.3 — Rate limiting, helmet, body cap

```bash
cd "D:\Projects\salon management\Salon-Management-Server"
npm i helmet express-rate-limit
```

In `src/app.ts`, above the routes:

```ts
import helmet from "helmet";
import rateLimit from "express-rate-limit";

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
});

const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });

app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1", apiLimiter);
```

If you stay on Render behind its proxy, also set `app.set("trust proxy", 1)` so the limiter sees real client IPs.

**Verify:** 11 rapid login attempts → the 11th returns 429.
**Commit:** `feat(security): add helmet, rate limiting and request body limits`

---

### 🟠 Step F1.4 — Verify and fix the user-update ownership check

`src/app/modules/User/user.routes.ts:22-27` opens `PATCH /users/:id` to `CUSTOMER`, `STAFF` and `SALON_OWNER` with no route-level ownership check.

First **confirm** whether `user.service.ts` already compares `:id` to the caller:

```bash
grep -n "userId\|req.user" src/app/modules/User/user.service.ts
```

If it does not, add the guard inside the service (the controller must pass the caller):

```ts
const updateUser = async (callerId: string, callerRole: string, targetId: string, payload: any) => {
  if (callerRole !== "ADMIN" && callerId !== targetId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only update your own profile");
  }
  // strip fields a non-admin must never set
  if (callerRole !== "ADMIN") {
    delete payload.role;
    delete payload.status;
    delete payload.isDeleted;
    delete payload.email;
  }
  ...
};
```

**Verify:** customer A calls `PATCH /users/<customer-B-id>` → 403.
**Commit:** `fix(security): enforce ownership on user profile update`

---

## Phase F2 — Make sessions work (users are being logged out)

### 🟠 Step F2.1 — Frontend route guard

There is no `middleware.ts`. `(dashboardLayout)/layout.tsx:15` falls back to `"GUEST"` and renders an empty shell instead of redirecting.

Create `Salon-Management-Frontend/src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/admin":                          ["ADMIN"],
  "/dashboard/become-a-salon-owner-request":   ["ADMIN"],
  "/dashboard/approval-salon":                 ["ADMIN", "AGENT"],
  "/dashboard/slots":                          ["SALON_OWNER"],
  "/dashboard/store":                          ["SALON_OWNER"],
  "/dashboard/services":                       ["SALON_OWNER", "ADMIN"],
  "/dashboard/customers":                      ["SALON_OWNER", "STAFF", "ADMIN", "AGENT"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("accessToken")?.value;

  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  // Decode only — do NOT verify here. Edge runtime has no `jsonwebtoken`,
  // and the backend verifies the signature on every API call anyway.
  let role: string | undefined;
  try {
    role = JSON.parse(atob(token.split(".")[1]))?.role;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const rule = Object.entries(ROLE_ROUTES).find(([p]) => pathname.startsWith(p));
  if (rule && role && !rule[1].includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/my-profile/:path*"] };
```

> The middleware is a **UX redirect**, not your security boundary. The backend `auth()` middleware remains the real gate — it already re-reads the role from the database (`auth.ts:36-52`), which is correct.

**Verify:** log out, visit `/dashboard/appointments` → redirected to `/login?redirect=/dashboard/appointments`. Log in as CUSTOMER, visit `/dashboard/admin/agents` → bounced to `/dashboard`.
**Commit:** `feat(auth): add middleware route guard for dashboard`

---

### 🟠 Step F2.2 — Silent token refresh

**The bug:** `config/index.ts:29` sets the access token to expire in **1 hour**, but `login.ts:57-63` sets the cookie `maxAge` to **7 days**. `/auth/refresh-token` exists but the frontend never calls it, so every user is silently broken after one hour.

Add a refresh helper and retry-once logic in `src/lib/server-fetch.ts`:

```ts
import { getCookie, setCookie } from "@/services/auth/cookiesHandler";

async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getCookie("refreshToken");
  if (!refreshToken) return null;

  const res = await fetch(`${BACKEND_API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const json = await res.json();
  const token = json?.data?.accessToken;
  if (!token) return null;

  await setCookie("accessToken", token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return token;
}

const serverFetchHelper = async (endPoint, options) => {
  const { headers, ...rest } = options;
  let accessToken = await getCookie("accessToken");

  const call = (t: string | null) =>
    fetch(`${BACKEND_API_URL}${endPoint}`, {
      headers: { Cookie: t ? `accessToken=${t}` : "", ...headers },
      ...rest,
      credentials: "include",
    });

  let res = await call(accessToken);

  if (res.status === 401) {
    const fresh = await tryRefresh();
    if (fresh) res = await call(fresh);       // retry exactly once
  }
  return res;
};
```

Also shorten the access token and make the cookie match its real lifetime:

```
EXPIRES_IN=15m          # was 1h
```

**Verify:** log in, set `EXPIRES_IN=30s` temporarily, wait 40s, click around the dashboard → everything still loads, no logout.
**Commit:** `fix(auth): silent access-token refresh on 401`

---

### 🟠 Step F2.3 — Forgot password + email verification

Two new flows in `src/app/modules/Auth/`. Reuse the existing `utils/emailSender.ts` and `utils/emailTemplates.ts`.

| Endpoint | Behaviour |
|---|---|
| `POST /auth/forgot-password` | Body `{ email }`. Always responds 200 regardless of whether the email exists (no user enumeration). If it exists, email a single-use token valid 15 minutes. |
| `POST /auth/reset-password` | Body `{ token, newPassword }`. Verify, hash with bcrypt cost 12, consume the token. |
| `POST /auth/verify-email` | Body `{ token }`. Sets `user.emailVerified = true`. |
| `POST /auth/resend-verification` | Rate-limited to 1 per 60s per user. |

Store tokens hashed, not raw:

```prisma
model VerificationToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique      // sha256 of the emailed token
  type      TokenType            // PASSWORD_RESET | EMAIL_VERIFY
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, type])
}
```

Add `emailVerified Boolean @default(false)` to `User`. Apply the `authLimiter` from F1.3 to both new routes.

**Verify:** request a reset, receive the email, reset, log in with the new password; the same token fails on second use.
**Commit:** `feat(auth): forgot-password and email verification flows`

---

## Phase F3 — Make it survive traffic

### 🟡 Step F3.1 — Add indexes

Only one `@@unique` exists in the entire schema today. Every filter on `salonId`, `customerId`, `staffId`, `date` or `status` is a sequential scan.

```prisma
// appointment.prisma
@@index([salonId, appointmentDate])
@@index([customerId, createdAt])
@@index([staffId, appointmentDate])
@@index([status])

// slot.prisma
@@index([salonId, date, status])
@@index([serviceId, date])

// review.prisma
@@index([salonId, createdAt])
@@index([staffId])

// service.prisma
@@index([salonId, isDeleted, isActive])

// salon.prisma
@@index([status, isDeleted])
@@index([division, district, area])
@@index([ownerId])

// payment.prisma
@@index([status, createdAt])

// staff.prisma
@@index([salonId, isDeleted])

// counter.prisma
@@index([salonId, isDeleted])
```

```bash
npx prisma migrate dev --name add_indexes
```

**Verify:** `EXPLAIN ANALYZE` a salon-appointments query before and after — `Seq Scan` should become `Index Scan`.
**Commit:** `perf(db): add indexes on all hot query paths`

---

### 🟡 Step F3.2 — Fix the timezone handling

`slot.service.ts:76` does `new Date(date)`, which parses `"2026-09-17"` as **UTC midnight**. Bangladesh is UTC+6, so an evening slot can land on the wrong calendar day. `slot.service.ts:116` then filters with exact date equality, which is brittle.

Two changes:

1. **Store the day boundary in Dhaka time.** Build the date at 00:00 Asia/Dhaka and convert to UTC before saving.
2. **Query by range, not equality:**

```ts
if (date) {
  const start = dhakaStartOfDay(date);          // 00:00 Dhaka → UTC instant
  const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  whereConditions.date = { gte: start, lt: end };
}
```

Add `timezone String @default("Asia/Dhaka")` to `Salon` now, so multi-city expansion later is not a rewrite. Consider `date-fns-tz` for the conversions.

**Verify:** create a 9:00 PM slot for the 17th, read it back — it must still be the 17th, 9:00 PM Dhaka.
**Commit:** `fix(slots): correct Asia/Dhaka timezone handling and date-range queries`

---

### 🟡 Step F3.3 — Slim down `getAllSalons`

`salon.service.ts:97-137` eagerly includes every service, every staff member (with nested user) and every counter — for every salon in the list. The payload grows linearly with each salon's catalogue.

The list page needs only: id, name, images[0], area/district, rating, totalReviews, price range, and counts. Keep the full include on `getSalonById`.

```ts
// list view
select: {
  id: true, name: true, images: true, area: true, district: true, city: true,
  rating: true, totalReviews: true, status: true,
  services: { where: { isDeleted: false, isActive: true }, select: { price: true }, take: 50 },
  _count: { select: { services: true, staff: true, reviews: true } },
}
```

Derive `minPrice`/`maxPrice` from the trimmed `services` array in the service layer.

**Verify:** compare response size for `/salons?limit=10` before and after.
**Commit:** `perf(salons): trim list payload, keep full detail on single salon`

---

### 🟡 Step F3.4 — Fix the AI search

Three separate problems in `src/app/modules/AI-Suggestion/ai.service.ts`:

**(a) The model id is likely wrong.** Line 9 uses `"gemini-embedding-2"`, which does not match Google's published model names. Check the current Gemini embedding docs and use the real id (likely `gemini-embedding-001` or `text-embedding-004`). If it is wrong, every embedding call is failing silently into the `.catch(console.error)` at `salon.service.ts:37` — meaning **no salon has an embedding and AI search returns nothing**. Confirm first:

```sql
SELECT COUNT(*) FROM salons WHERE embedding IS NOT NULL;
```

**(b) No vector index** — every search is a sequential scan with a distance computation per row:

```sql
CREATE INDEX IF NOT EXISTS salons_embedding_hnsw
  ON salons USING hnsw (embedding vector_cosine_ops);
```

**(c) Inactive salons leak into results.** Line 66-73 filters `isDeleted = false` but not status:

```sql
WHERE "isDeleted" = false
  AND status = 'ACTIVE'
  AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT 5
```

Also add a backfill script for salons created while embeddings were broken.

**Verify:** the count query returns > 0; searching "cheap haircut in Dhanmondi" returns only ACTIVE salons.
**Commit:** `fix(ai): correct embedding model, add HNSW index, filter inactive salons`

---

## Phase F4 — Be able to see what's happening

### Step F4.1 — Structured logging and error tracking

Replace scattered `console.log`/`console.error` with `pino`, and add Sentry. Today `server.ts:31-32` kills the process on any unhandled rejection with no sink — you will never learn why production died.

```bash
npm i pino pino-http @sentry/node
```

- Log JSON in production, pretty in dev.
- Attach a request id to every log line.
- **Never log** tokens, passwords, `verify_sign`, or full gateway payloads.
- Report to Sentry in `globalErrorHandler.ts` before responding.

### Step F4.2 — Health endpoints

Split liveness from readiness so Render restarts only on real failure:

```ts
app.get("/health/live",  (_req, res) => res.json({ ok: true }));
app.get("/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch {
    res.status(503).json({ ok: false, db: "down" });
  }
});
```

**Commit:** `feat(ops): structured logging, Sentry, health probes`

---

### Step F4.3 — Test harness

There is no test runner and no test file in either repo. Add Vitest plus the handful of tests that protect the things most likely to cost you money.

```bash
npm i -D vitest supertest @types/supertest
```

`package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`

Minimum set before production:

| Test | Guards |
|---|---|
| Customer cannot create a COMPLETED payment | F1.2 |
| Customer cannot PATCH another user | F1.4 |
| 11 rapid logins → 429 | F1.3 |
| Expired access token → silent refresh, request succeeds | F2.2 |
| 50 concurrent bookings on one slot → exactly 1 wins | the money-losing race |
| Password reset token cannot be reused | F2.3 |

**Commit:** `test: add Vitest harness and security regression tests`

---

## Done checklist

```
🔴 F1.1  Credentials rotated, .env.example scrubbed
🔴 F1.2  Payment amount server-derived, status not client-settable
🟠 F1.3  helmet + rate limiting + body cap
🟠 F1.4  User-update ownership check verified
🟠 F2.1  middleware.ts route guard
🟠 F2.2  Silent token refresh on 401
🟠 F2.3  Forgot password + email verification
🟡 F3.1  Indexes on every hot path
🟡 F3.2  Asia/Dhaka timezone handling
🟡 F3.3  getAllSalons payload trimmed
🟡 F3.4  AI embedding model, HNSW index, ACTIVE filter
   F4.1  pino + Sentry
   F4.2  /health/live + /health/ready
   F4.3  Vitest + security regression tests
```

**When F1 and F2 are green, you are safe to take real users.**
**When F3 and F4 are green, you are safe to take real traffic.**

Next: [PAYMENT.md](./PAYMENT.md) — the money flow.

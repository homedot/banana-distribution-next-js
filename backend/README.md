# Backend

MongoDB-backed API for the app, called by the frontend under `src/`. Each
request flows through the same four layers:

```
app/api/<resource>/route.ts   Next.js route — maps HTTP verbs to a controller
backend/controllers/          parses the request, calls a service, formats the response
backend/services/             business logic + Mongoose queries, throws ApiError on failure
backend/models/                Mongoose schemas
backend/config/db.ts           cached MongoDB Atlas connection
backend/utils/                 shared response/error helpers
backend/seed/                  one-off script to populate demo data
```

To add a new resource, copy an existing one (e.g. `vendor`) across those four
layers and add its `route.ts` files under `app/api/`.

## Setup

1. Copy `.env.example` to `.env.local` and set `MONGODB_URI` (get it from
   your MongoDB Atlas cluster's "Connect" dialog) and `JWT_SECRET` (generate
   one with `openssl rand -base64 48`).
2. `npm install`
3. `npm run seed` — optional, populates the demo brokers/vendors/batches/distributions.
4. `npm run seed:admin` — creates/resets the admin login user (safe to re-run; upserts by email).
5. `npm run dev`

## API

All responses are JSON shaped as `{ success: true, data }` or
`{ success: false, message }`.

| Resource        | Endpoints                                                              |
| --------------- | ----------------------------------------------------------------------- |
| Brokers         | `GET/POST /api/brokers`, `GET/PUT/DELETE /api/brokers/:id`             |
| Vendors         | `GET/POST /api/vendors`, `GET/PUT/DELETE /api/vendors/:id`             |
| Batches         | `GET/POST /api/batches`, `GET/PUT/DELETE /api/batches/:id`             |
| Distributions   | `GET/POST /api/distributions`, `GET/PUT/DELETE /api/distributions/:id` |
| Auth            | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`    |

`Batch` is a broker's inward stock consignment (`BrokerBatch` in
`src/types`); `Distribution` is a dispatch of stock to a vendor.

## Auth

Login is email + password against the `User` model (`backend/models/User.ts`,
password hashed with bcrypt). A successful login signs a JWT (7-day expiry,
`backend/utils/jwt.ts`) and sets it as an `httpOnly` cookie — the frontend
never touches the token directly.

`proxy.ts` (project root — this Next.js version's renamed `middleware.ts`)
verifies that cookie on every request: unauthenticated visitors are
redirected to `/login`; unauthenticated API calls (other than `/api/auth/*`)
get a 401. This is an *optimistic* check (signature + expiry only, no DB
hit) — it's not a substitute for checking auth in the services themselves
if you add anything sensitive.

The dashboard UI (`app/(dashboard)/...`, wrapped in `DataProvider` +
`AppShell`) and the standalone `/login` page are split with an App Router
route group so `/login` doesn't get the dashboard chrome or try to fetch
app data before the user is signed in.

To add another admin/user, either run `npm run seed:admin` with different
constants, or insert directly via `backend/services/auth.service.ts`'s
pattern (hash the password with `hashPassword` before storing it — never
store plaintext).

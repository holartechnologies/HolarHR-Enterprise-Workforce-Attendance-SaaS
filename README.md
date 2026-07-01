# HolarHR — Enterprise Workforce Attendance SaaS
https://holarhrattendance.vercel.app/HolarHR-User-Guide.pdf

Multi-tenant attendance tracking, employee management, and HR platform built with Next.js 16 (App Router), Tailwind CSS v4, Prisma 7, and NextAuth v5.

## Quick Start

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Redis errors on build are harmless — the app works without a Redis server. Caching/queues degrade gracefully.


| Email | Password | Plan | Role |
|---|---|---|---|
| admin@holarhr.com | admin123 | — | SUPER_ADMIN |
| free@test.com | password123 | Free | COMPANY_ADMIN |
| starter@test.com | password123 | Starter | COMPANY_ADMIN |
| business@test.com | password123 | Business | COMPANY_ADMIN |
| enterprise@test.com | password123 | Enterprise | COMPANY_ADMIN |

## Employee Login Flow

1. **Admin adds an employee** via the Employees page — fill in details including email
2. A **User account** is auto-created with role `EMPLOYEE` and a random temporary password
3. The temp password is shown in the toast notification — the admin shares it with the employee
4. The **employee logs in** at `/login` with their email + temp password
5. The employee can **clock in/out** on the Attendance page and view their own records

Employees only see pages they have permission for (attendance, reports, leave).

## Plans & Limits

| Plan | Max Employees | Price |
|---|---|---|
| Free | 3 (incl. admin) | Free |
| Starter | 25 | $29/mo |
| Business | 250 | $99/mo |
| Enterprise | Unlimited | $299/mo |

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Auth:** NextAuth v5 (credentials, JWT), bcrypt
- **Database:** SQLite (local) via Prisma + better-sqlite3 adapter
- **UI:** Tailwind CSS v4, shadcn/ui components, Lucide icons
- **Payments:** Stripe + Paystack (mock mode: `PAYSTACK_MOCK=true`)
- **AI:** OpenAI integration (Enterprise plan)
- **Queues:** BullMQ + Redis (optional — degrades gracefully)

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/        # Authenticated pages (attendance, employees, etc.)
│   ├── admin/              # SUPER_ADMIN panel (tenants, users, stats)
│   ├── api/                # REST API routes
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   └── page.tsx            # Landing page
├── auth.ts                 # NextAuth configuration
├── middleware.ts           # Auth + admin route protection
├── lib/
│   ├── prisma.ts           # PrismaClient singleton
│   ├── rbac.ts             # Role-based permission system
│   ├── plans.ts            # Plan limits & features
│   ├── api-utils.ts        # API response helpers
│   ├── audit.ts            # Audit logging
│   ├── stripe.ts           # Stripe client
│   ├── paystack.ts         # Paystack integration
│   └── redis.ts            # Redis client (optional)
├── components/
│   └── ui/                 # shadcn/ui primitives
└── types/                  # TypeScript types
```

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register new company |
| POST | /api/auth/[...nextauth] | Login (NextAuth) |
| GET/POST | /api/employees | List/create employees |
| GET/PATCH/DELETE | /api/employees/[id] | Single employee CRUD |
| POST | /api/attendance | Clock in/out, break start/end |
| GET | /api/attendance/status | Current clock status |
| GET | /api/attendance/stats | Attendance statistics |
| GET/POST | /api/departments | List/create departments |
| PATCH/DELETE | /api/departments/[id] | Single department update/delete |
| GET/POST | /api/branches | List/create branches |
| GET/POST | /api/shifts | List/create shifts |
| GET/POST | /api/leave | List/create leave requests |
| GET | /api/reports | Attendance reports |
| GET/PUT | /api/settings | Company settings |
| GET | /api/admin/stats | SUPER_ADMIN dashboard stats |
| GET | /api/admin/tenants | SUPER_ADMIN tenant list |
| GET | /api/admin/users | SUPER_ADMIN user list |

## Environment Variables

```env
# Required
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Payments (optional — mock mode works without real keys)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_MOCK=true

# AI (optional — Enterprise plan only)
OPENAI_API_KEY=

# Redis (optional)
REDIS_URL=
```

## RBAC Roles

| Role | Permissions |
|---|---|
| SUPER_ADMIN | Everything (admin panel) |
| COMPANY_ADMIN | Full company control, billing, users |
| HR_MANAGER | Employee/attendance/reports management |
| DEPARTMENT_MANAGER | Department-level view, basic actions |
| EMPLOYEE | Clock in/out, view own records, request leave |

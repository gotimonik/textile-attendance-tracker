# ThreadTrack — Attendance for Textile & Embroidery Teams

A department-wise worker attendance tracker built for textile, embroidery and
garment units. Mark daily attendance in under a minute, see live dashboards,
and export reports for payroll.

## Features

- **Departments** — organize your floor into departments (Embroidery, Cutting,
  Stitching, Dyeing, Printing, Finishing & Packing, Quality Control,
  Warehouse & Dispatch, or your own).
- **Workers** — add, edit, deactivate or remove workers; filter and search by
  department or status.
- **Daily attendance** — mark Present / Absent / Half-day / On-leave per
  worker, grouped by department, with one-click "mark all present" and
  "mark as holiday" bulk actions.
- **Dashboard** — today's headcount, a 14-day attendance trend, and a
  department-by-department breakdown.
- **Reports** — a per-worker attendance summary over any date range, plus a
  one-click CSV export for payroll.
- **Admin login** — a single password-protected admin account guards editing.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Turbopack)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Prisma](https://www.prisma.io) + SQLite (a single local file — no external
  database to set up)
- [NextAuth.js](https://next-auth.js.org) (credentials-based admin login)
- [Recharts](https://recharts.org) for the attendance trend chart
- [Framer Motion](https://www.framer.com/motion/) for the interface animation

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). A seeded SQLite database
(`prisma/dev.db`) is already included with 8 sample departments, ~65 sample
workers, and three weeks of sample attendance history, so the app is ready to
explore immediately.

**Default login:**

- Username: `admin`
- Password: `admin123`

**Change these before sharing the app with anyone else** — see
[Security notes](#security-notes) below.

## Resetting or re-seeding the database

```bash
# Wipe and recreate the database from the schema, then reseed demo data
npx prisma migrate reset

# Or just reseed (safe to re-run; it won't duplicate departments/workers already seeded)
npx tsx prisma/seed.ts
```

To start from a completely empty app (no demo departments/workers), delete
`prisma/dev.db`, run `npx prisma migrate dev`, and skip the seed step — or
edit `prisma/seed.ts` to only create the admin user.

## Project structure

```
src/
  app/
    (dashboard)/        # Authenticated app shell: dashboard, attendance,
                         # workers, departments, reports
    api/                # Route handlers (departments, workers, attendance,
                         # attendance summary/report/export, NextAuth)
    login/               # Public login page
  components/            # UI building blocks, organized by feature
  lib/                   # Prisma client, auth config, date + color helpers
prisma/
  schema.prisma          # Department / Worker / AttendanceRecord / AdminUser
  seed.ts                # Demo data generator
```

## Security notes

This app ships with development-friendly defaults so it runs immediately.
Before using it for real, or deploying it anywhere reachable by others:

1. Change `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`, then re-run
   `npx tsx prisma/seed.ts` to update the stored admin password.
2. Replace `NEXTAUTH_SECRET` in `.env` with a long random string (e.g.
   `openssl rand -base64 32`).
3. Set `NEXTAUTH_URL` to your real domain when deploying.
4. SQLite is great for a single-machine deployment. If you need multiple
   people editing from different servers at once, swap the Prisma
   `datasource` in `prisma/schema.prisma` for Postgres/MySQL and update
   `DATABASE_URL`.

## Available scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — lint the codebase
- `npx prisma studio` — browse/edit the database with a GUI

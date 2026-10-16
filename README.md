# AnonyWorks

> A private space for honest, anonymous feedback.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

AnonyWorks is a serverless anonymous-feedback application for individuals and companies. Users can create feedback sessions, share a session link, and review messages without exposing the sender's identity.

The application runs as a Next.js App Router application. The user interface is rendered through the catch-all page at `app/[[...path]]/page.tsx`, while the serverless API is implemented by the catch-all route at `app/api/[...route]/route.ts`.

## Features

- 🔐 **Anonymous feedback** — Send feedback without attaching a name or personal details.
- 📝 **Professional feedback mode** — Mark messages as professional for clearer team review.
- 📊 **Feedback sessions** — Create, view, end, and delete feedback sessions.
- 🔑 **Password authentication** — JWT-based authentication with bcrypt password hashing.
- 🎨 **Modern UI** — Dark theme with glassmorphism effects, Framer Motion animations, and Lucide icons.
- ⚡ **Serverless API** — Next.js route handlers serve the backend without a separate Express server.

## Future directions

More information will be added later. Potential anonymous-problem solutions include:

1. Anonymous workplace incident reporting with case tracking.
2. Anonymous university harassment and safety reporting.
3. Anonymous healthcare near-miss reporting.
4. Anonymous customer complaint channels for companies.
5. Anonymous landlord or tenant issue reporting.
6. Anonymous community safety reports with moderation and duplicate detection.
7. Anonymous whistleblower intake with encrypted evidence uploads.
8. Anonymous peer feedback for schools and teams.

## What is not included

- **Brevo/email delivery:** Removed. Account registration and login currently use password authentication and do not send OTP emails.
- **Gemini/AI processing:** Removed. Messages are stored as submitted; professional mode is a user-selected label rather than an AI rewrite.
- **Google OAuth:** Not currently implemented.
- **WebSockets or a separate backend service:** The active backend is the Next.js serverless API route.

## Tech stack

- **Next.js 16** with the App Router
- **React 19** and TypeScript
- **Tailwind CSS**
- **Framer Motion** for animations
- **Lucide React** for icons
- **PostgreSQL on Supabase** through the `pg` driver
- **JWT** for stateless authentication
- **bcrypt** for password hashing

## Prerequisites

- Node.js 20.9 or later
- npm or Bun
- A Supabase project with PostgreSQL access

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/codewithemmax/Anonyworks.git
cd Anonyworks
```

### 2. Install dependencies

```bash
npm install
```

Or, using Bun:

```bash
bun install
```

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
SUPABASE_DB_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
JWT_SECRET=replace-with-a-long-random-secret
```

Use a Supabase connection string appropriate for your deployment. Do not commit real credentials.

### 4. Initialize the database

```bash
npm run db:init
```

Or:

```bash
bun run db:init
```

The initialization script creates the following tables and indexes:

- `users` — Application accounts
- `pits` — Anonymous feedback sessions
- `messages` — Feedback submitted to a session
- Indexes for pit creators and message-to-pit lookups

## Supabase RLS status

Row Level Security is **enabled** for the `pits` and `messages` tables by `scripts/init-db.mjs`:

```sql
ALTER TABLE pits ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

However, the repository currently does **not** define any `CREATE POLICY` statements, and RLS is not enabled for `users`. The application connects through the PostgreSQL pool in `lib/db.ts` and performs authorization in the Next.js route handlers using the application JWT. Therefore, RLS should be considered **enabled but not fully policy-configured**. Database-level isolation is not complete until explicit policies are added and the connection role is configured to observe them.

The API still applies ownership checks for protected operations, including loading a user's pits, reading pit messages, updating professional mode, ending a pit, and deleting a pit.

## Development

Start the Next.js development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

Available scripts:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run db:init` | Create the Supabase database tables and indexes |

## API endpoints

All endpoints are served under `/api` by `app/api/[...route]/route.ts`.

### Public endpoints

- `GET /api/health` — Check API availability.
- `POST /api/auth/signup` — Create an account and return a JWT.
- `POST /api/auth/login` — Authenticate with an email and password.
- `GET /api/pit/:id/info` — Retrieve public information about a feedback session.
- `POST /api/pit/:id/message` — Submit anonymous feedback to an active session.

### Authenticated endpoints

Send the JWT as a bearer token in the `Authorization` header.

- `GET /api/user/profile` — Retrieve the authenticated user's profile.
- `GET /api/user/pits` — List the authenticated user's feedback sessions.
- `POST /api/pit/create` — Create a feedback session.
- `GET /api/pit/:id/messages` — Retrieve messages for an owned session.
- `PUT /api/pit/:id/professional` — Update professional mode for an owned session.
- `POST /api/pit/:id/end` — End an owned session.
- `DELETE /api/pit/:id` — Delete an owned session.

Example authenticated request:

```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project structure

```text
Anonyworks/
├── app/
│   ├── [[...path]]/page.tsx       # Client UI entry point
│   ├── api/[...route]/route.ts    # Serverless API route handlers
│   └── layout.tsx                 # Root layout and metadata
├── frontend/src/                  # Existing client UI components and screens
│   ├── App.tsx                    # Client-side route definitions
│   ├── components/                # Reusable UI components
│   ├── pages/                     # Landing, auth, dashboard, and pit screens
│   ├── utils/                     # Client API helpers
│   └── index.css                  # Global styles
├── lib/
│   ├── auth.ts                    # JWT creation and request authentication
│   └── db.ts                      # Supabase PostgreSQL connection pool
├── scripts/init-db.mjs            # Database schema initialization
├── next.config.mjs                # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
├── package.json                   # Next.js scripts and dependencies
└── README.md
```

The `frontend/src` directory contains the client UI consumed by the Next.js catch-all page. It is not a separate Vite or Express application in the current setup.

## Security notes

- Passwords are hashed with bcrypt before storage.
- SQL queries use PostgreSQL parameters rather than string interpolation.
- JWT secrets and database credentials are read from environment variables.
- Protected API operations verify the JWT and check resource ownership.
- RLS is enabled on `pits` and `messages`, but explicit Supabase policies still need to be configured for database-level enforcement.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Author

**Olayinka Emmanuel** — [GitHub](https://github.com/codewithemmax)

---

<div align="center">
  <strong>Built with ❤️ for honest feedback</strong>
</div>

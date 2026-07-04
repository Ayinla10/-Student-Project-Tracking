# Student Project Tracking System

A production-ready web application that lets students submit and update their
final-year project progress using their Roll Number as the unique identifier,
and lets a class representative (admin) monitor all submissions in real time.

Built with **Node.js, Express, PostgreSQL (Neon), raw SQL via `pg`, and EJS** using
an MVC folder structure.

## Features

- Public student form: enter Roll Number, and the system auto-detects whether
  you're a returning student (auto-fills & locks Name/Supervisor, only lets you
  change status) or a first-time submitter (shows the full registration form).
- UPSERT logic (`INSERT ... ON CONFLICT (roll_number) DO UPDATE`) — no duplicate
  roll numbers are ever created.
- Session-based admin authentication with bcrypt-hashed passwords.
- Admin dashboard with summary cards (Total, Proposal, Chapter 1–5, Completed),
  a searchable/filterable/sortable/paginated student table, inline edit and
  delete (with confirmation), and Excel (.xlsx) export.
- Input validation on both client and server, centralized error handling,
  toast notifications, loading spinner on submit, 30-minute session timeout.

## Project Structure

```
/migrations           SQL migration file(s) for the Neon database
/src
  /config             DB pool + session store configuration
  /controllers        Request handlers (student + admin)
  /middleware         Auth guard + express-validator rule sets
  /models             Data-access layer (raw parameterized SQL via pg)
  /public              Static CSS/JS served to the browser
  /routes             Express routers
  /utils              Migration runner, admin seed script, async wrapper
  /views              EJS templates (student form, admin login/dashboard)
  app.js              Express app wiring
server.js             Entry point
```

## Prerequisites

- Node.js 18+
- A free [Neon](https://neon.tech) PostgreSQL project

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Neon project** at https://neon.tech, then copy the connection
   string from the Neon dashboard ("Connection Details"). It looks like:

   ```
   postgres://<user>:<password>@<host>/<dbname>?sslmode=require
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   ```
   DATABASE_URL=postgres://<user>:<password>@<host>/<dbname>?sslmode=require
   SESSION_SECRET=<a long random string>
   PORT=3000
   DEFAULT_ADMIN_USERNAME=admin
   DEFAULT_ADMIN_PASSWORD=admin123
   ```

4. **Run the database migration** (creates `students`, `admins`, and `session` tables)

   ```bash
   npm run migrate
   ```

5. **Seed the default admin account**

   ```bash
   npm run seed
   ```

6. **Start the app**

   ```bash
   npm start
   ```

   Or for auto-reload during development:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` for the student form and
   `http://localhost:3000/admin/login` for the admin dashboard.

## Default Admin Credentials

```
Username: admin
Password: admin123
```

Change `DEFAULT_ADMIN_PASSWORD` in `.env` **before** running `npm run seed` for
the first time in a real deployment, since the seed script only creates the
admin account if it doesn't already exist.

## API Endpoints

**Student**
- `POST /api/student/submit` — create or update a student record (UPSERT by roll number)
- `GET /api/student/:rollNumber` — look up an existing student

**Admin** (all require an authenticated session except `/admin/login`)
- `POST /admin/login`
- `GET /admin/dashboard`
- `GET /admin/students` — search/filter/sort/paginate (JSON)
- `GET /admin/students/export` — Excel export
- `POST /admin/student/update`
- `POST /admin/student/delete`

## Security Notes

- Admin passwords are hashed with bcrypt (12 salt rounds); plaintext passwords
  are never stored.
- All SQL queries use parameterized statements — no string-concatenated SQL.
- Sessions are stored server-side in Postgres (`connect-pg-simple`) with a
  30-minute idle timeout and `httpOnly` cookies.
- All admin routes are protected by `requireAdmin` middleware.

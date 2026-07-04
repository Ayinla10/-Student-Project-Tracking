-- Student Project Tracking System - initial schema
-- Safe to re-run: uses IF NOT EXISTS guards.

CREATE TABLE IF NOT EXISTS students (
    id            SERIAL PRIMARY KEY,
    roll_number   VARCHAR(50) NOT NULL UNIQUE,
    full_name     VARCHAR(150) NOT NULL,
    supervisor    VARCHAR(150) NOT NULL,
    status        VARCHAR(30) NOT NULL DEFAULT 'Proposal'
        CHECK (status IN ('Proposal', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Completed')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students (roll_number);
CREATE INDEX IF NOT EXISTS idx_students_supervisor ON students (supervisor);
CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);

CREATE TABLE IF NOT EXISTS admins (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update the updated_at column on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Session store table (created automatically by connect-pg-simple too,
-- but pre-creating it here keeps first boot fast and predictable).
CREATE TABLE IF NOT EXISTS "session" (
    "sid"    varchar NOT NULL COLLATE "default" PRIMARY KEY,
    "sess"   json NOT NULL,
    "expire" timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Audit trail for student self-service submissions.
-- Every POST /api/student/submit writes one row here, regardless of
-- whether it created or updated the student record. Kept independent of
-- the students table (no FK) so history survives even if a record is
-- later deleted by an admin.

CREATE TABLE IF NOT EXISTS submission_logs (
    id            SERIAL PRIMARY KEY,
    roll_number   VARCHAR(50) NOT NULL,
    action        VARCHAR(10) NOT NULL CHECK (action IN ('create', 'update')),
    full_name     VARCHAR(150),
    supervisor    VARCHAR(150),
    status        VARCHAR(30) NOT NULL,
    ip_address    VARCHAR(64),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_logs_roll_number ON submission_logs (roll_number);
CREATE INDEX IF NOT EXISTS idx_submission_logs_created_at ON submission_logs (created_at);

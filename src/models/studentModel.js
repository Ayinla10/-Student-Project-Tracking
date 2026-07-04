const pool = require('../config/db');

const STATUS_VALUES = [
  'Proposal',
  'Chapter 1',
  'Chapter 2',
  'Chapter 3',
  'Chapter 4',
  'Chapter 5',
  'Completed',
];

const SORTABLE_COLUMNS = {
  roll_number: 'roll_number',
  full_name: 'full_name',
  supervisor: 'supervisor',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
};

async function findByRollNumber(rollNumber) {
  const { rows } = await pool.query(
    'SELECT * FROM students WHERE roll_number = $1',
    [rollNumber]
  );
  return rows[0] || null;
}

// UPSERT: create the student on first submission, update status (and
// optionally name/supervisor) on every subsequent submission.
async function upsertStudent({ rollNumber, fullName, supervisor, status }) {
  const { rows } = await pool.query(
    `INSERT INTO students (roll_number, full_name, supervisor, status)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (roll_number)
     DO UPDATE SET
        status = EXCLUDED.status,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), students.full_name),
        supervisor = COALESCE(NULLIF(EXCLUDED.supervisor, ''), students.supervisor)
     RETURNING *`,
    [rollNumber, fullName || '', supervisor || '', status]
  );
  return rows[0];
}

async function updateStudent(id, { fullName, supervisor, status }) {
  const { rows } = await pool.query(
    `UPDATE students
     SET full_name = $1, supervisor = $2, status = $3
     WHERE id = $4
     RETURNING *`,
    [fullName, supervisor, status, id]
  );
  return rows[0] || null;
}

async function deleteStudent(id) {
  const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [id]);
  return rowCount > 0;
}

async function findAll({ search, supervisor, status, sortBy, sortDir, page, pageSize }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(full_name ILIKE $${params.length} OR roll_number ILIKE $${params.length})`);
  }
  if (supervisor) {
    params.push(supervisor);
    conditions.push(`supervisor = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderColumn = SORTABLE_COLUMNS[sortBy] || 'created_at';
  const orderDir = sortDir === 'asc' ? 'ASC' : 'DESC';

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM students ${whereClause}`,
    params
  );
  const total = countResult.rows[0].count;

  params.push(pageSize);
  params.push((page - 1) * pageSize);
  const { rows } = await pool.query(
    `SELECT * FROM students ${whereClause}
     ORDER BY ${orderColumn} ${orderDir}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows, total };
}

async function findAllUnpaged({ search, supervisor, status }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(full_name ILIKE $${params.length} OR roll_number ILIKE $${params.length})`);
  }
  if (supervisor) {
    params.push(supervisor);
    conditions.push(`supervisor = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM students ${whereClause} ORDER BY roll_number ASC`,
    params
  );
  return rows;
}

async function getSummary() {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*)::int AS count FROM students GROUP BY status`
  );
  const summary = { total: 0 };
  STATUS_VALUES.forEach((s) => { summary[s] = 0; });
  rows.forEach((r) => {
    summary[r.status] = r.count;
    summary.total += r.count;
  });
  return summary;
}

async function getSupervisors() {
  const { rows } = await pool.query(
    'SELECT DISTINCT supervisor FROM students ORDER BY supervisor ASC'
  );
  return rows.map((r) => r.supervisor);
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
  return rows[0] || null;
}

module.exports = {
  STATUS_VALUES,
  findByRollNumber,
  upsertStudent,
  updateStudent,
  deleteStudent,
  findAll,
  findAllUnpaged,
  getSummary,
  getSupervisors,
  findById,
};

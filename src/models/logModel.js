const pool = require('../config/db');

async function insertLog({ rollNumber, action, fullName, supervisor, status, ipAddress }) {
  await pool.query(
    `INSERT INTO submission_logs (roll_number, action, full_name, supervisor, status, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [rollNumber, action, fullName || null, supervisor || null, status, ipAddress || null]
  );
}

async function findByRollNumber(rollNumber) {
  const { rows } = await pool.query(
    `SELECT * FROM submission_logs WHERE roll_number = $1 ORDER BY created_at DESC LIMIT 100`,
    [rollNumber]
  );
  return rows;
}

module.exports = { insertLog, findByRollNumber };

const pool = require('../config/db');

async function findByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
  return rows[0] || null;
}

async function createAdmin(username, passwordHash) {
  const { rows } = await pool.query(
    'INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING RETURNING *',
    [username, passwordHash]
  );
  return rows[0] || null;
}

module.exports = { findByUsername, createAdmin };

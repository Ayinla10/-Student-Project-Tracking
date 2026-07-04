require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const adminModel = require('../models/adminModel');

// Creates the default admin account if it doesn't already exist.
// Safe to run multiple times (ON CONFLICT DO NOTHING in adminModel.createAdmin).
async function seed() {
  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

  const existing = await adminModel.findByUsername(username);
  if (existing) {
    console.log(`Admin "${username}" already exists, skipping seed.`);
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await adminModel.createAdmin(username, passwordHash);
  console.log(`Default admin created: username="${username}" password="${password}"`);
  console.log('Please change this password after first login.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

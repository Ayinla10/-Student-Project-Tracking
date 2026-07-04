const bcrypt = require('bcrypt');
const ExcelJS = require('exceljs');
const adminModel = require('../models/adminModel');
const studentModel = require('../models/studentModel');
const logModel = require('../models/logModel');

function loginPage(req, res) {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: null });
}

async function login(req, res) {
  const { username, password } = req.body;
  const admin = await adminModel.findByUsername(username.trim());

  const invalid = () => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    return res.status(401).render('admin/login', { error: 'Invalid username or password' });
  };

  if (!admin) return invalid();

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) return invalid();

  req.session.adminId = admin.id;
  req.session.username = admin.username;

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ message: 'Logged in', redirect: '/admin/dashboard' });
  }
  return res.redirect('/admin/dashboard');
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('spts.sid');
    res.redirect('/admin/login');
  });
}

function dashboard(req, res) {
  res.render('admin/dashboard', {
    username: req.session.username,
    statusValues: studentModel.STATUS_VALUES,
  });
}

// GET /admin/students - JSON API backing the dashboard table.
// Supports search, filter, sort, and pagination.
async function listStudents(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
  const search = (req.query.search || '').trim();
  const supervisor = (req.query.supervisor || '').trim();
  const status = (req.query.status || '').trim();
  const sortBy = req.query.sortBy || 'created_at';
  const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';

  const [{ rows, total }, summary, supervisors] = await Promise.all([
    studentModel.findAll({ search, supervisor, status, sortBy, sortDir, page, pageSize }),
    studentModel.getSummary(),
    studentModel.getSupervisors(),
  ]);

  res.json({
    students: rows.map(mapStudent),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    summary,
    supervisors,
  });
}

async function updateStudent(req, res) {
  const { id, fullName, supervisor, status } = req.body;
  const updated = await studentModel.updateStudent(id, {
    fullName: fullName.trim(),
    supervisor: supervisor.trim(),
    status: status.trim(),
  });
  if (!updated) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json({ message: 'Student updated successfully', student: mapStudent(updated) });
}

async function deleteStudent(req, res) {
  const { id } = req.body;
  const deleted = await studentModel.deleteStudent(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json({ message: 'Student deleted successfully' });
}

// GET /admin/students/:rollNumber/logs - submission audit trail for one student.
async function getStudentLogs(req, res) {
  const logs = await logModel.findByRollNumber(req.params.rollNumber.trim());
  res.json({
    logs: logs.map((l) => ({
      action: l.action,
      fullName: l.full_name,
      supervisor: l.supervisor,
      status: l.status,
      ipAddress: l.ip_address,
      createdAt: l.created_at,
    })),
  });
}

// GET /admin/students/export - Excel export of all matching records.
async function exportStudents(req, res) {
  const search = (req.query.search || '').trim();
  const supervisor = (req.query.supervisor || '').trim();
  const status = (req.query.status || '').trim();

  const rows = await studentModel.findAllUnpaged({ search, supervisor, status });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');
  sheet.columns = [
    { header: 'Roll Number', key: 'roll_number', width: 18 },
    { header: 'Full Name', key: 'full_name', width: 28 },
    { header: 'Supervisor', key: 'supervisor', width: 24 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Created At', key: 'created_at', width: 22 },
    { header: 'Updated At', key: 'updated_at', width: 22 },
  ];
  sheet.getRow(1).font = { bold: true };

  rows.forEach((r) => {
    sheet.addRow({
      roll_number: r.roll_number,
      full_name: r.full_name,
      supervisor: r.supervisor,
      status: r.status,
      created_at: new Date(r.created_at).toLocaleString(),
      updated_at: new Date(r.updated_at).toLocaleString(),
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
  await workbook.xlsx.write(res);
  res.end();
}

function mapStudent(row) {
  return {
    id: row.id,
    rollNumber: row.roll_number,
    fullName: row.full_name,
    supervisor: row.supervisor,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  loginPage,
  login,
  logout,
  dashboard,
  listStudents,
  updateStudent,
  deleteStudent,
  exportStudents,
  getStudentLogs,
};

const studentModel = require('../models/studentModel');
const logModel = require('../models/logModel');

// GET /api/student/:rollNumber
// Used by the frontend to check whether a roll number already exists,
// so the form can auto-fill name/supervisor and lock them for editing.
async function getStudent(req, res) {
  const { rollNumber } = req.params;
  const student = await studentModel.findByRollNumber(rollNumber.trim());
  if (!student) {
    return res.status(404).json({ exists: false });
  }
  return res.json({
    exists: true,
    student: {
      rollNumber: student.roll_number,
      fullName: student.full_name,
      supervisor: student.supervisor,
      status: student.status,
    },
  });
}

// POST /api/student/submit
// Core UPSERT behavior: create on first submission, update status on repeat submissions.
async function submitStudent(req, res) {
  const rollNumber = req.body.rollNumber.trim();
  const status = req.body.status.trim();
  const fullName = (req.body.fullName || '').trim();
  const supervisor = (req.body.supervisor || '').trim();

  const existing = await studentModel.findByRollNumber(rollNumber);

  if (!existing && (!fullName || !supervisor)) {
    return res.status(400).json({
      error: 'Full name and supervisor are required for first-time registration.',
    });
  }

  const student = await studentModel.upsertStudent({ rollNumber, fullName, supervisor, status });

  // Audit trail: every self-service submission is logged with the
  // submitter's IP so admins can spot suspicious changes to a record.
  await logModel.insertLog({
    rollNumber,
    action: existing ? 'update' : 'create',
    fullName: student.full_name,
    supervisor: student.supervisor,
    status,
    ipAddress: req.ip,
  });

  return res.status(existing ? 200 : 201).json({
    message: existing ? 'Project status updated successfully.' : 'Registered successfully.',
    student: {
      rollNumber: student.roll_number,
      fullName: student.full_name,
      supervisor: student.supervisor,
      status: student.status,
      updatedAt: student.updated_at,
    },
  });
}

module.exports = { getStudent, submitStudent };

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const {
  handleValidationErrors,
  loginRules,
  adminUpdateRules,
  adminDeleteRules,
} = require('../middleware/validators');

const router = express.Router();

router.get('/login', adminController.loginPage);
router.post('/login', loginRules, handleValidationErrors, asyncHandler(adminController.login));
router.get('/logout', adminController.logout);

router.get('/dashboard', requireAdmin, adminController.dashboard);
router.get('/students', requireAdmin, asyncHandler(adminController.listStudents));
router.get('/students/export', requireAdmin, asyncHandler(adminController.exportStudents));
router.post(
  '/student/update',
  requireAdmin,
  adminUpdateRules,
  handleValidationErrors,
  asyncHandler(adminController.updateStudent)
);
router.post(
  '/student/delete',
  requireAdmin,
  adminDeleteRules,
  handleValidationErrors,
  asyncHandler(adminController.deleteStudent)
);

module.exports = router;

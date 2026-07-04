const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const studentController = require('../controllers/studentController');
const {
  handleValidationErrors,
  rollNumberParamRules,
  submitStudentRules,
} = require('../middleware/validators');

const router = express.Router();

router.get(
  '/student/:rollNumber',
  rollNumberParamRules,
  handleValidationErrors,
  asyncHandler(studentController.getStudent)
);

router.post(
  '/student/submit',
  submitStudentRules,
  handleValidationErrors,
  asyncHandler(studentController.submitStudent)
);

module.exports = router;

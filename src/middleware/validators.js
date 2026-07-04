const { body, param, validationResult } = require('express-validator');
const { STATUS_VALUES } = require('../models/studentModel');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
}

const rollNumberParamRules = [
  param('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
];

const submitStudentRules = [
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required')
    .isLength({ max: 50 }).withMessage('Roll number is too long'),
  body('fullName').optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Full name is too long'),
  body('supervisor').optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Supervisor name is too long'),
  body('status').trim().notEmpty().withMessage('Project status is required')
    .isIn(STATUS_VALUES).withMessage('Invalid project status'),
];

const adminUpdateRules = [
  body('id').isInt({ min: 1 }).withMessage('Invalid student id'),
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 150 }),
  body('supervisor').trim().notEmpty().withMessage('Supervisor is required').isLength({ max: 150 }),
  body('status').trim().notEmpty().withMessage('Status is required').isIn(STATUS_VALUES).withMessage('Invalid project status'),
];

const adminDeleteRules = [
  body('id').isInt({ min: 1 }).withMessage('Invalid student id'),
];

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  handleValidationErrors,
  rollNumberParamRules,
  submitStudentRules,
  adminUpdateRules,
  adminDeleteRules,
  loginRules,
};

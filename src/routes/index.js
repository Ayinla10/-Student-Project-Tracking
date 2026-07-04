const express = require('express');
const router = express.Router();
const { STATUS_VALUES } = require('../models/studentModel');

router.get('/', (req, res) => {
  res.render('index', { statusValues: STATUS_VALUES });
});

router.use('/api', require('./studentRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;

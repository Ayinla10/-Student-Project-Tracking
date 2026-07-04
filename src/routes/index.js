const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index');
});

router.use('/api', require('./studentRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;

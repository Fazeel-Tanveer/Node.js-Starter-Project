const express = require('express');
const router = express.Router();
const staffRoutes = require('./staff.routes')

router.use('/staff', staffRoutes);

module.exports = router
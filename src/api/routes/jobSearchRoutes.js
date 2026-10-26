const express = require('express');
const router = express.Router();

const { searchJobs } = require('../controllers/jobSearchController');

// GET /api/jobs - Search and filter available jobs
router.get('/', searchJobs);

module.exports = router;
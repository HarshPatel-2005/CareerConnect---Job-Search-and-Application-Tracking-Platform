const express = require('express');
const router = express.Router();
const { getRecruiterJobs } = require('../controllers/recruiterController');
const { authenticateToken } = require('../middleware/authMiddleware');   // adjust file name to match

router.get('/jobs', authenticateToken, getRecruiterJobs);

module.exports = router;
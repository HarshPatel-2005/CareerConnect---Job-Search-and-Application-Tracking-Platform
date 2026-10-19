const express = require('express');
const router = express.Router();
const { getRecruiterJobs } = require('../controllers/recruiterController');
// Import your authentication middleware (e.g., ensureAuthenticated, verifyRecruiter)
// const { verifyToken } = require('../middleware/authMiddleware');

// router.get('/jobs', verifyToken, getRecruiterJobs);
router.get('/jobs', getRecruiterJobs); // Add middleware as appropriate for your app

module.exports = router;
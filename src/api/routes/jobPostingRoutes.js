const express = require('express');
const router = express.Router();
const { getJob, createJob, updateJob, updateJobStatus } = require('../controllers/jobPostingController');
const { authenticateToken } = require('../middleware/authMiddleware');   // adjust to your middleware file name

// Every route runs authenticateToken first, so req.user is filled in
router.post('/jobs', authenticateToken, createJob);
router.get('/jobs/:id', authenticateToken, getJob);
router.put('/jobs/:id', authenticateToken, updateJob);
router.patch('/jobs/:id/status', authenticateToken, updateJobStatus);

module.exports = router;

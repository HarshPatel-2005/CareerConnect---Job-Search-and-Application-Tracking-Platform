const express = require('express');
const router = express.Router();
const { setArchived } = require('../controllers/archiveController');
const { authenticateToken } = require('../middleware/authMiddleware');   // same as recruiterRoutes.js

// PATCH /api/recruiter/jobs/:id/archive
router.patch('/jobs/:id/archive', authenticateToken, setArchived);

module.exports = router;
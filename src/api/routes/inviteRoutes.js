const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const invite = require('../controllers/inviteController');

const router = express.Router();

// Mounted at /api/recruiter in app.js
router.use('/team', authenticateToken, invite.loadTeamContext);
router.use('/invite-code', authenticateToken, invite.loadTeamContext, invite.requireOwner);

router.get('/team', invite.getTeam);                                    // any recruiter in the company
router.delete('/team/:userId', invite.requireOwner, invite.kickMember); // owner only

router.get('/invite-code', invite.getInviteCode);                       // owner only
router.put('/invite-code', invite.setInviteCode);                       // owner only
router.post('/invite-code/regenerate', invite.regenerateInviteCode);    // owner only

module.exports = router;
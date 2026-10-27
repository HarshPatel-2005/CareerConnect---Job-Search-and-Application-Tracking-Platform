const express = require("express");
const router = express.Router();
const { registerUser, loginUser, generateDebugInviteCode } = require("../controllers/authController");
const { authenticateToken } = require('../middleware/authMiddleware');
const db = require('../../config/db');

router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        const [users] = await db.query('SELECT id, full_name, email, role, company_id FROM users WHERE id = ?', [req.user.id]);
        if (!users.length) return res.status(401).json({ error: 'Account no longer exists.' });
        res.json({ user: users[0] });
    } catch (error) { next(error); }
});

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/debug/generate-invite
router.post("/debug/generate-invite", generateDebugInviteCode);

module.exports = router;

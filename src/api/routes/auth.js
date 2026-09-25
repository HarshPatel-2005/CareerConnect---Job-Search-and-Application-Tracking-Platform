const express = require("express");
const router = express.Router();
const { registerUser, generateDebugInviteCode } = require("../controllers/authController");

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/debug/generate-invite
router.post("/debug/generate-invite", generateDebugInviteCode);

module.exports = router;
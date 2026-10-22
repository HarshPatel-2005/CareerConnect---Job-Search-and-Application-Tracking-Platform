const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updatePassword,
} = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/authMiddleware");

// --- PUBLIC ROUTES ---

// GET /api/profile/:id
router.get("/:id", getProfile);

// --- PROTECTED ROUTES ---

// Protect with JWT authentication
router.use(authenticateToken);

// PUT /api/profile/:id  -> update full_name and/or email
router.put("/:id", updateProfile);

// PUT /api/profile/:id/password -> change password (requires current password)
router.put("/:id/password", updatePassword);

module.exports = router;
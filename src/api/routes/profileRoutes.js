const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updatePassword,
    addExperience,
    deleteExperience,
    addSkill,
    deleteSkill
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

// Experience routes
router.post("/:id/experience", addExperience);
router.delete("/:id/experience/:expId", deleteExperience);

// Skill routes
router.post("/:id/skills", addSkill);
router.delete("/:id/skills/:skillId", deleteSkill);

module.exports = router;
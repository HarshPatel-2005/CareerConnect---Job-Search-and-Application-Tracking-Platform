const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updatePassword,
} = require("../controllers/profileController");

// GET /api/profile/:id
router.get("/:id", getProfile);

// PUT /api/profile/:id  -> update full_name and/or email
router.put("/:id", updateProfile);

// PUT /api/profile/:id/password -> change password (requires current password)
router.put("/:id/password", updatePassword);

module.exports = router;
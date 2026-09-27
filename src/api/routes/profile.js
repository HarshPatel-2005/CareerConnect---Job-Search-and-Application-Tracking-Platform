// Maps HTTP requests for /api/profile to the functions in profileController.js.
// Mounted in app.js with: app.use('/api/profile', require('./routes/profile'));

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updatePassword } = require('../controllers/profileController');

router.get('/', getProfile);              // GET  /api/profile          -> load current values
router.put('/', updateProfile);           // PUT  /api/profile          -> update name/email
router.put('/password', updatePassword);  // PUT  /api/profile/password -> change password

module.exports = router;
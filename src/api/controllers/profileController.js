const bcrypt = require('bcrypt');
const db = require('../../config/db');

// Helper to check if the authenticated user owns the resource they're trying to access (their own profile).
function isOwner(req) {
    return String(req.user.id) === String(req.params.id);
}

// GET /api/profile/:id
// Returns the user's name and email. password_hash is never sent to the client.
async function getProfile(req, res) {
    try {
        const { id } = req.params;

        // Enforce ownership check
        if (!isOwner(req)) {
            return res.status(403).json({ error: 'Forbidden: You can only access your own profile' });
        }

        const [rows] = await db.query(
            'SELECT id, full_name, email FROM users WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// PUT /api/profile/:id
// Updates full_name and/or email. Only the fields provided in the body are changed,
// which matches the UI editing one field (row) at a time.
async function updateProfile(req, res) {
    try {
        const { id } = req.params;
        const { full_name, email } = req.body;

        if (!isOwner(req)) {
            return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
        }

        if (!full_name && !email) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        const [existingUser] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Email has a UNIQUE constraint, so check for collisions with other users
        // before writing (gives a clean 409 instead of a raw SQL error).
        if (email) {
            const [emailInUse] = await db.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );
            if (emailInUse.length > 0) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }

        const fields = [];
        const values = [];

        if (full_name) {
            fields.push('full_name = ?');
            values.push(full_name);
        }
        if (email) {
            fields.push('email = ?');
            values.push(email);
        }
        values.push(id);

        await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

        return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// PUT /api/profile/:id/password
// Separate from updateProfile because it needs current-password verification
// and hashing, instead of a plain column update.
async function updatePassword(req, res) {
    try {
        const { id } = req.params;
        const { current_password, new_password, confirm_password } = req.body;

        if (!isOwner(req)) {
            return res.status(403).json({ error: 'Forbidden: You can only update your own password' });
        }

        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, id]);

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getProfile, updateProfile, updatePassword };
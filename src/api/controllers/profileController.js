const bcrypt = require('bcrypt');
const db = require('../../config/db');

// Helper to check if the authenticated user owns the resource they're trying to access (their own profile).
function isOwner(req) {
    return String(req.user.id) === String(req.params.id);
}

// GET /api/profile/:id
// Returns the user's public info. password_hash is never sent to the client.
async function getPublicProfile(req, res) {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT id, full_name, company_id, summary FROM users WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build the response object
        const profileData = {
            id: rows[0].id,
            full_name: rows[0].full_name,
            summary: rows[0].summary || null,
        };

        const companyId = rows[0].company_id;
        if (companyId) {
            const [companyRows] = await db.query(
                'SELECT name FROM companies WHERE id = ?',
                [companyId]
            );
            if (companyRows.length > 0) {
                profileData.company = companyRows[0].name;
            }
        }

        // Fetch experiences
        const [experiences] = await db.query(
            'SELECT id, company_name, title, start_date, end_date, details FROM experiences WHERE user_id = ? ORDER BY start_date DESC',
            [id]
        );
        profileData.experience = experiences.map(exp => ({
            ...exp,
            startDate: exp.start_date,
            endDate: exp.end_date || 'Present'
        }));

        // Fetch skills
        const [skills] = await db.query(
            'SELECT id, name, level FROM skills WHERE user_id = ?',
            [id]
        );
        profileData.skills = skills;

        return res.status(200).json(profileData);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// PUT /api/profile/:id
// Updates full_name and/or email, and/or summary. Only the fields provided in the body are changed,
// which matches the UI editing one field (row) at a time.
async function updateProfile(req, res) {
    try {
        const { id } = req.params;
        const { full_name, email, summary } = req.body;

        if (!isOwner(req)) {
            return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
        }

        if (!full_name && !email && summary === undefined) {
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
        if (summary !== undefined) {
            fields.push('summary = ?');
            values.push(summary);
        }
        values.push(id);

        await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

        return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /api/profile/:id/experience
async function addExperience(req, res) {
    try {
        const { id } = req.params;
        const { company_name, title, start_date, end_date, details } = req.body;

        if (!isOwner(req)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!company_name || !title || !start_date) { 
            return res.status(400).json({ error: 'Missing required experience fields' });
        }

        const [result] = await db.query(
            'INSERT INTO experiences (user_id, company_name, title, start_date, end_date, details) VALUES (?, ?, ?, ?, ?, ?)',
            [id, company_name, title, start_date, end_date || null, details || null]
        );

        return res.status(201).json({ message: 'Experience added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding experience:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// DELETE /api/profile/:id/experience/:expId
async function deleteExperience(req, res) {
    try {
        const { id, expId } = req.params;

        if (!isOwner(req)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await db.query('DELETE FROM experiences WHERE id = ? AND user_id = ?', [expId, id]);
        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting experience:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /api/profile/:id/skills
async function addSkill(req, res) {
    try {
        const { id } = req.params;
        const { name, level } = req.body;

        if (!isOwner(req)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Skill name is required' });
        }

        const [result] = await db.query(
            'INSERT INTO skills (user_id, name, level) VALUES (?, ?, ?)',
            [id, name, level || 'beginner']
        );

        return res.status(201).json({ message: 'Skill added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding skill:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// DELETE /api/profile/:id/skills/:skillId
async function deleteSkill(req, res) {
    try {
        const { id, skillId } = req.params;

        if (!isOwner(req)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await db.query('DELETE FROM skills WHERE id = ? AND user_id = ?', [skillId, id]);
        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting skill:', error);
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

module.exports = { getProfile: getPublicProfile, updateProfile, updatePassword, addExperience, deleteExperience, addSkill, deleteSkill };
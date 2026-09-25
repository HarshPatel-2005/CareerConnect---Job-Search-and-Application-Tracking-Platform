const bcrypt = require('bcrypt');
const db = require('../../config/db');

async function registerUser(req, res) {
    try {
        const { full_name, email, password, role, company_name, invite_code } = req.body;

        // Basic validation
        if (!full_name || !email || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if email is already in use
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        let companyId = null;
        let usedInviteCode = null;

        // Handle recruiter registration
        if (role === 'recruiter') {
            if (invite_code) {
                // Join existing company via invite code
                const [invites] = await db.query(
                    'SELECT company_id FROM invites WHERE code = ? AND is_used = FALSE', 
                    [invite_code]
                );

                if (invites.length === 0) {
                    return res.status(400).json({ error: 'Invalid invite code' });
                }

                companyId = invites[0].company_id;
                usedInviteCode = invite_code;
            } else if (company_name) {
                const [existingCompanies] = await db.query(
                    'SELECT id FROM companies WHERE name = ?', 
                    [company_name]
                );

                if (existingCompanies.length > 0) {
                    return res.status(409).json({ error: 'Company already exists. Ask your team for an invite code.' });
                }

                const [newCompany] = await db.query(
                    'INSERT INTO companies (name) VALUES (?)',
                    [company_name] 
                );

                companyId = newCompany.insertId;
            } else {
                return res.status(400).json({ error: 'Recruiters must provide either a company name or an invite code' });
            }
        }

        // Insert new user into the database
        const [newUser] = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, passwordHash, role, companyId]
        );

        // If they used an invite code, mark it as used
        if (usedInviteCode) {
            await db.query(
                'UPDATE invites SET is_used = TRUE WHERE code = ?',
                [usedInviteCode]
            );
        }

        // Send success response
        const responsePayload = {
            message: 'User registered successfully',
            userId: newUser.insertId,
        };

        if (companyId) {
            responsePayload.companyId = companyId;
        }

        return res.status(201).json(responsePayload);
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { registerUser };
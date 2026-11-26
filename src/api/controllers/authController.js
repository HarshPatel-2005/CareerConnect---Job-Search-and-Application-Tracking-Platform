const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateToken } = require('../utils/jwt');
const db = require('../../config/db');
const { findCompanyByInviteCode } = require('./inviteController');   // CHANGED: new helper

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
        let createdCompany = false;   // CHANGED: true when this user is creating the company (they become the owner)

        // Handle recruiter registration
        if (role === 'recruiter') {
            if (invite_code && String(invite_code).trim()) {
                // CHANGED: join an existing company with its single invite code.
                // The code is reusable, so nothing is marked as used.
                companyId = await findCompanyByInviteCode(db, invite_code);

                if (!companyId) {
                    return res.status(400).json({ error: 'Invalid invite code' });
                }
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
                createdCompany = true;
            } else {
                return res.status(400).json({ error: 'Recruiters must provide either a company name or an invite code' });
            }
        }

        // Insert new user into the database
        const [newUser] = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, passwordHash, role, companyId]
        );

        // CHANGED: the person who created the company is its owner (shown as CEO)
        if (createdCompany) {
            await db.query('UPDATE companies SET owner_id = ? WHERE id = ?', [newUser.insertId, companyId]);
        }

        // Generate JWT token for the new user
        const token = generateToken({
            id: newUser.insertId,
            email,
            role,
            company_id: companyId
        });

        // Send success response
        const responsePayload = {
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.insertId,
                full_name,
                email,
                role,
                company_id: companyId
            }
        };

        return res.status(201).json(responsePayload);
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Find user by email
        const [users] = await db.query(
            'SELECT id, full_name, email, password_hash, role, company_id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Compare entered password with stored hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken({ id: user.id, email: user.email, role: user.role, company_id: user.company_id });

        // Login successful
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                company_id: user.company_id
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}


// CHANGED: debug helper now sets the company's single invite code
// (the company_invites table is no longer used).
async function generateDebugInviteCode(req, res) {
    try {
        const { company_id } = req.body;

        if (!company_id) {
            return res.status(400).json({ error: 'Please provide a company_id' });
        }

        // Random 8-character alphanumeric invite code
        const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

        const [result] = await db.query(
            'UPDATE companies SET invite_code = ? WHERE id = ?',
            [inviteCode, company_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.status(201).json({
            message: 'Invite code set successfully',
            company_id: company_id,
            invite_code: inviteCode
        });
    } catch (error) {
        console.error('Error generating invite code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    registerUser,
    loginUser,
    generateDebugInviteCode
};
const crypto = require('crypto');
const db = require('../../config/db');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no look-alikes (0/O, 1/I)
const CODE_RULE = /^[A-Z0-9_-]{6,32}$/;               // what an owner may type

function makeCode() {
    let raw = '';
    for (let i = 0; i < 12; i++) raw += ALPHABET[crypto.randomInt(ALPHABET.length)];
    return raw.match(/.{4}/g).join('-');               // e.g. K7M2-Q9XP-4TWH
}

function normalizeCode(code) {
    return String(code || '').trim().toUpperCase();
}

/* ---------------------------------------------------------------
   Middleware: works out who is asking and whether they own the company.
   Reads the database every time, so a kicked recruiter loses access
   immediately. Sets req.team = { userId, companyId, ownerId, isOwner }
   --------------------------------------------------------------- */
async function loadTeamContext(req, res, next) {
    try {
        const [rows] = await db.query('SELECT id, role, company_id FROM users WHERE id = ?', [req.user.id]);
        const me = rows[0];
        if (!me || me.role !== 'recruiter' || !me.company_id) {
            return res.status(403).json({ error: 'Only recruiters in a company can use this.' });
        }

        const [[company]] = await db.query('SELECT owner_id FROM companies WHERE id = ?', [me.company_id]);
        let ownerId = company ? company.owner_id : null;

        if (!ownerId) {   // fallback for old companies without an owner: earliest recruiter
            const [first] = await db.query(
                "SELECT id FROM users WHERE company_id = ? AND role = 'recruiter' ORDER BY created_at, id LIMIT 1",
                [me.company_id]
            );
            ownerId = first.length ? first[0].id : null;
        }

        req.team = { userId: me.id, companyId: me.company_id, ownerId, isOwner: ownerId === me.id };
        next();
    } catch (error) { next(error); }
}

function requireOwner(req, res, next) {
    if (!req.team.isOwner) return res.status(403).json({ error: 'Only the company owner can do this.' });
    next();
}

/* GET /api/recruiter/team -> everyone in the company, CEO first */
async function getTeam(req, res, next) {
    try {
        const { companyId, ownerId, isOwner } = req.team;
        const [rows] = await db.query(
            "SELECT id, full_name, email FROM users WHERE company_id = ? AND role = 'recruiter' ORDER BY created_at, id",
            [companyId]
        );
        const members = rows.map(u => ({ id: u.id, full_name: u.full_name, email: u.email, is_owner: u.id === ownerId }));
        members.sort((a, b) => Number(b.is_owner) - Number(a.is_owner));
        res.json({ isOwner, members });
    } catch (error) { next(error); }
}

/* DELETE /api/recruiter/team/:userId (owner only) -> remove a recruiter from the company */
async function kickMember(req, res, next) {
    try {
        const targetId = Number(req.params.userId);
        if (targetId === req.team.userId) {
            return res.status(400).json({ error: 'You cannot remove yourself from your own company.' });
        }
        const [result] = await db.query(
            "UPDATE users SET company_id = NULL WHERE id = ? AND company_id = ? AND role = 'recruiter'",
            [targetId, req.team.companyId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Recruiter not found in your company.' });
        res.json({ ok: true });
    } catch (error) { next(error); }
}

/* ---------------- The company's single invite code ---------------- */

async function setRandomCode(companyId, onlyIfEmpty) {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const [result] = await db.query(
                'UPDATE companies SET invite_code = ? WHERE id = ?' + (onlyIfEmpty ? ' AND invite_code IS NULL' : ''),
                [makeCode(), companyId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error.code !== 'ER_DUP_ENTRY') throw error;   // collision: try another random code
        }
    }
    throw new Error('Could not generate a unique invite code.');
}

async function readCode(companyId) {
    const [[row]] = await db.query('SELECT invite_code FROM companies WHERE id = ?', [companyId]);
    return row ? row.invite_code : null;
}

/* GET /api/recruiter/invite-code (owner only) -> the code; created automatically if missing */
async function getInviteCode(req, res, next) {
    try {
        let code = await readCode(req.team.companyId);
        if (!code) {
            await setRandomCode(req.team.companyId, true);
            code = await readCode(req.team.companyId);
        }
        res.json({ code });
    } catch (error) { next(error); }
}

/* PUT /api/recruiter/invite-code (owner only) body: { code } -> the owner's own code */
async function setInviteCode(req, res, next) {
    try {
        const code = normalizeCode(req.body && req.body.code);
        if (!CODE_RULE.test(code)) {
            return res.status(400).json({ error: 'Use 6 to 32 letters, numbers, dashes or underscores.' });
        }
        try {
            await db.query('UPDATE companies SET invite_code = ? WHERE id = ?', [code, req.team.companyId]);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That code is already taken. Try another.' });
            throw error;
        }
        res.json({ code });
    } catch (error) { next(error); }
}

/* POST /api/recruiter/invite-code/regenerate (owner only) -> a new random code */
async function regenerateInviteCode(req, res, next) {
    try {
        await setRandomCode(req.team.companyId, false);
        res.json({ code: await readCode(req.team.companyId) });
    } catch (error) { next(error); }
}

/* ---------------------------------------------------------------
   Helper for the REGISTER controller:
   returns the company id for a valid code, or null.
   --------------------------------------------------------------- */
async function findCompanyByInviteCode(conn, rawCode) {
    const code = normalizeCode(rawCode);
    if (!code) return null;
    const [rows] = await conn.query('SELECT id FROM companies WHERE invite_code = ?', [code]);
    return rows.length ? rows[0].id : null;
}

module.exports = {
    loadTeamContext, requireOwner,
    getTeam, kickMember,
    getInviteCode, setInviteCode, regenerateInviteCode,
    findCompanyByInviteCode
};
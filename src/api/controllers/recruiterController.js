const db = require('../../config/db');

const getRecruiterJobs = async (req, res) => {
    try {

        const companyId = req.user?.company_id;
        if (req.user?.role !== 'recruiter' || !companyId) return res.status(403).json({ error: 'Recruiter account required' });

        // CHANGED: ?archived=true returns archived jobs, otherwise only active jobs
        const archived = req.query.archived === 'true';

        const [rows] = await db.query(
            `SELECT id, title, location, status, created_at, archived_at,
                    candidates_count, awaiting_count, reviewed_count, contacting_count, hired_count 
             FROM jobs WHERE company_id = ? AND archived = ? ORDER BY created_at DESC`,
            [companyId, archived]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getRecruiterJobs };
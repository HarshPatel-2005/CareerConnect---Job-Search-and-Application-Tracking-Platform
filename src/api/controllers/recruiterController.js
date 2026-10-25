const db = require('../../config/db');

const getRecruiterJobs = async (req, res) => {
    try {

        const companyId = req.user?.company_id;

        const [rows] = await db.query(
            `SELECT id, title, location, status, created_at, 
                    candidates_count, awaiting_count, reviewed_count, contacting_count, hired_count 
             FROM jobs WHERE company_id = ? ORDER BY created_at DESC`,
            [companyId]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getRecruiterJobs };
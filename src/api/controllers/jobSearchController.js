const db = require('../../config/db');

// GET /api/jobs
// Search and filter available jobs
const searchJobs = async (req, res) => {
    try {
        const { search, location, job_type } = req.query;

        let sql = `
            SELECT
                jobs.id,
                jobs.title,
                jobs.location,
                jobs.country,
                jobs.language,
                jobs.job_type,
                jobs.description,
                jobs.openings,
                jobs.created_at,
                companies.name AS company_name
            FROM jobs
            JOIN companies ON jobs.company_id = companies.id
            WHERE jobs.status = 'open'
        `;

        const params = [];

        // Search by job title, description, or company name
        if (search && search.trim()) {
            sql += `
                AND (
                    jobs.title LIKE ?
                    OR jobs.description LIKE ?
                    OR companies.name LIKE ?
                )
            `;

            const keyword = `%${search.trim()}%`;
            params.push(keyword, keyword, keyword);
        }

        // Filter by location
        if (location && location.trim()) {
            sql += ` AND jobs.location LIKE ?`;
            params.push(`%${location.trim()}%`);
        }

        // Filter by job type
        if (job_type && job_type.trim()) {
            sql += ` AND jobs.job_type = ?`;
            params.push(job_type.trim());
        }

        sql += ` ORDER BY jobs.created_at DESC, jobs.id DESC`;

        const [jobs] = await db.query(sql, params);

        res.status(200).json({ jobs });
    } catch (error) {
        console.error('Error searching jobs:', error);
        res.status(500).json({
            error: 'Unable to search jobs'
        });
    }
};

module.exports = { searchJobs };
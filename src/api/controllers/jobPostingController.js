const db = require('../../config/db');

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'temporary', 'internship', 'co_op'];

// Only recruiters who belong to a company may use these routes.
// Returns the recruiter's company_id, or sends a 403 and returns null.
function getCompanyId(req, res) {
    if (req.user?.role !== 'recruiter' || !req.user.company_id) {
        res.status(403).json({ error: 'Recruiter account required' });
        return null;
    }
    return req.user.company_id;
}

// Cleans the form data. Returns { job } when valid, or { error } when not.
function readJobBody(body) {
    const job = {
        title: String(body.title || '').trim(),
        location: String(body.location || '').trim(),
        openings: parseInt(body.openings, 10),
        country: String(body.country || '').trim(),
        language: String(body.language || '').trim(),
        job_type: body.job_type,
        description: String(body.description || '').trim() || null
    };

    if (!job.title || !job.location) return { error: 'Title and location are required' };
    if (!(job.openings >= 1)) return { error: 'Openings must be at least 1' };
    if (!job.country || !job.language) return { error: 'Country and language are required' };
    if (!JOB_TYPES.includes(job.job_type)) return { error: 'Invalid job type' };

    return { job };
}

// GET /jobs/:id  -> one job, to fill the edit form
const getJob = async (req, res) => {
    try {
        const companyId = getCompanyId(req, res);
        if (!companyId) return;

        const [rows] = await db.query(
            `SELECT id, title, location, openings, country, language, job_type, description
             FROM jobs WHERE id = ? AND company_id = ?`,
            [req.params.id, companyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /jobs  -> create a job under the recruiter's company
const createJob = async (req, res) => {
    try {
        const companyId = getCompanyId(req, res);
        if (!companyId) return;

        const { job, error } = readJobBody(req.body);
        if (error) return res.status(400).json({ error });

        const [result] = await db.query(
            `INSERT INTO jobs (company_id, title, location, openings, country, language, job_type, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, job.title, job.location, job.openings, job.country, job.language, job.job_type, job.description]
        );

        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /jobs/:id  -> update a job, only if it belongs to the recruiter's company
const updateJob = async (req, res) => {
    try {
        const companyId = getCompanyId(req, res);
        if (!companyId) return;

        const { job, error } = readJobBody(req.body);
        if (error) return res.status(400).json({ error });

        const [result] = await db.query(
            `UPDATE jobs
             SET title = ?, location = ?, openings = ?, country = ?, language = ?, job_type = ?, description = ?
             WHERE id = ? AND company_id = ?`,
            [job.title, job.location, job.openings, job.country, job.language, job.job_type, job.description,
             req.params.id, companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ message: 'Job updated' });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getJob, createJob, updateJob };
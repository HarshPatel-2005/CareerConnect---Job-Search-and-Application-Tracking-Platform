const express = require('express');
const fs = require('fs');
const path = require('path');
const defaultDb = require('../../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

function publicApplication(row) {
    return { ...row, applied_at: new Date(Number(row.applied_at)).toISOString() };
}

function createJobsRouter({ store, uploadDir, db = defaultDb }) {
    const router = express.Router();
    router.use(authenticateToken);
    router.use((req, res, next) => {
        if (req.user.role !== 'job_seeker' && !(req.method === 'GET' && req.user.role === 'recruiter')) {
            return res.status(403).json({ error: 'A job seeker account is required.' });
        }
        const id = Number(req.user.id || req.user.userId);
        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(403).json({ error: 'Invalid account.' });
        }
        req.applicantId = id;
        next();
    });
    router.param('id', (req, res, next, id) => {
        if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
            return res.status(400).json({ error: 'Invalid job ID.' });
        }
        next();
    });

    router.get('/:id', async (req, res, next) => {
        try {
            const [jobs] = await db.query(`
                SELECT j.id, j.title, j.location, j.status, j.description,
                       j.job_type, j.country, j.language, j.openings, c.name AS company_name
                FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.id = ?`, [req.params.id]);
            if (!jobs.length) return res.status(404).json({ error: 'Job not found.' });
            const [applications] = await db.query(`
                SELECT id, job_id, resume_id, resume_name, status, UNIX_TIMESTAMP(applied_at) * 1000 AS applied_at
                FROM applications WHERE job_id = ? AND user_id = ?`, [req.params.id, req.applicantId]);
            res.json({ job: jobs[0], application: applications[0] ? publicApplication(applications[0]) : null });
        } catch (error) { next(error); }
    });

    router.post('/:id/apply', async (req, res, next) => {
        const resumeId = req.body?.resume_id;
        if (typeof resumeId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resumeId)) {
            return res.status(400).json({ error: 'Select a saved resume.' });
        }
        let connection;
        try {
            // SQLite TEXT IDs can be stored as "1" or "1.0" depending on
            // whether older upload requests bound the JWT ID as text or number.
            const resume = store.get(resumeId, String(req.applicantId)) || store.get(resumeId, req.applicantId);
            if (!resume) return res.status(404).json({ error: 'Saved resume not found.' });
            // Read synchronously with metadata lookup so a resume replacement cannot
            // interleave and change the file being submitted in this process.
            let content;
            try {
                content = fs.readFileSync(path.join(uploadDir, path.basename(resume.stored_name)));
            } catch (error) {
                if (error.code === 'ENOENT') return res.status(409).json({ error: 'Resume file is missing. Upload it again before applying.' });
                throw error;
            }
            connection = await db.getConnection();
            await connection.beginTransaction();
            // Serialize applications with job status changes and counter updates.
            const [jobs] = await connection.query('SELECT id, status FROM jobs WHERE id = ? FOR UPDATE', [req.params.id]);
            if (!jobs.length) {
                await connection.rollback();
                return res.status(404).json({ error: 'Job not found.' });
            }
            const [existing] = await connection.query(
                'SELECT id FROM applications WHERE user_id = ? AND job_id = ?', [req.applicantId, req.params.id]);
            if (existing.length) {
                await connection.rollback();
                return res.status(409).json({ error: 'You have already applied to this job.', code: 'ALREADY_APPLIED' });
            }
            if (jobs[0].status !== 'open') {
                await connection.rollback();
                return res.status(409).json({ error: 'This job is no longer accepting applications.' });
            }
            const [inserted] = await connection.query(`
                INSERT INTO applications (user_id, job_id, resume_id, resume_name, resume_mime_type, resume_content)
                VALUES (?, ?, ?, ?, ?, ?)`,
            [req.applicantId, req.params.id, resume.id, resume.original_name, resume.mime_type, content]);
            await connection.query(`UPDATE jobs SET candidates_count = candidates_count + 1,
                awaiting_count = awaiting_count + 1 WHERE id = ?`, [req.params.id]);
            const [rows] = await connection.query(`
                SELECT id, job_id, resume_id, resume_name, status, UNIX_TIMESTAMP(applied_at) * 1000 AS applied_at FROM applications WHERE id = ?`, [inserted.insertId]);
            await connection.commit();
            res.status(201).json({ application: publicApplication(rows[0]) });
        } catch (error) {
            if (connection) await connection.rollback();
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'You have already applied to this job.', code: 'ALREADY_APPLIED' });
            }
            next(error);
        } finally {
            if (connection) connection.release();
        }
    });

    router.use((error, _req, res, _next) => {
        console.error('Jobs request failed:', error);
        res.status(500).json({ error: 'Unable to load jobs or submit an application right now.' });
    });
    return router;
}

module.exports = { createJobsRouter };

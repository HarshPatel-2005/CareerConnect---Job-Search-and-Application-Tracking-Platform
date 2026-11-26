const express = require('express');
const defaultDb = require('../../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateDeadlineReminders } = require('../services/deadlineReminders');

function createSavedJobsRouter({ db = defaultDb } = {}) {
    const router = express.Router();
    router.use(authenticateToken);
    router.use((req, res, next) => {
        if (req.user.role !== 'job_seeker') return res.status(403).json({ error: 'Job seeker account required.' });
        if (!Number.isSafeInteger(Number(req.user.id)) || Number(req.user.id) < 1) {
            return res.status(403).json({ error: 'Invalid account.' });
        }
        next();
    });
    router.param('id', (req, res, next, id) => {
        if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
            return res.status(400).json({ error: 'Invalid job ID.' });
        }
        next();
    });
    router.get('/', async (req, res) => {
        const [jobs] = await db.query(`
            SELECT j.id, j.title, j.location, j.status, c.name AS company_name,
                   DATE_FORMAT(j.deadline, '%Y-%m-%d') AS deadline,
                   (j.deadline < UTC_DATE()) AS expired
            FROM saved_jobs s JOIN jobs j ON j.id = s.job_id JOIN companies c ON c.id = j.company_id
            WHERE s.user_id = ? ORDER BY s.saved_at DESC, j.id DESC`, [req.user.id]);
        res.json({ jobs });
    });
    router.put('/:id', async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // Saving and any eligible reminder become visible together.
            await connection.query(`INSERT INTO saved_jobs (user_id, job_id)
                SELECT ?, id FROM jobs WHERE id = ?
                ON DUPLICATE KEY UPDATE job_id = saved_jobs.job_id`, [req.user.id, req.params.id]);
            const [saved] = await connection.query('SELECT job_id FROM saved_jobs WHERE user_id = ? AND job_id = ?', [req.user.id, req.params.id]);
            if (!saved.length) {
                await connection.rollback();
                return res.status(404).json({ error: 'Job not found.' });
            }
            await generateDeadlineReminders(connection, { userId: req.user.id, jobId: req.params.id });
            await connection.commit();
            res.json({ saved: true });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally { connection.release(); }
    });
    router.delete('/:id', async (req, res) => {
        await db.query('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [req.user.id, req.params.id]);
        res.status(204).end();
    });
    router.use((error, _req, res, _next) => {
        console.error('Saved jobs request failed:', error);
        res.status(500).json({ error: 'Unable to load or update saved jobs right now.' });
    });
    return router;
}

module.exports = { createSavedJobsRouter };

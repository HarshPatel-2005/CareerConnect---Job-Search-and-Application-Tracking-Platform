const express = require('express');
const defaultDb = require('../../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

function createNotificationsRouter({ db = defaultDb } = {}) {
    const router = express.Router();
    router.use(authenticateToken);
    router.use((req, res, next) => {
        if (!['job_seeker', 'recruiter'].includes(req.user.role)
            || !Number.isSafeInteger(Number(req.user.id)) || Number(req.user.id) < 1) {
            return res.status(403).json({ error: 'Invalid account.' });
        }
        next();
    });
    router.get('/unread-count', async (req, res) => {
        const [rows] = await db.query('SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND read_at IS NULL', [req.user.id]);
        res.json({ unread_count: Number(rows[0].unread_count) });
    });
    router.get('/', async (req, res) => {
        const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
        const before = req.query.before === undefined ? null : Number(req.query.before);
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100
            || (before !== null && (!Number.isSafeInteger(before) || before < 1))) {
            return res.status(400).json({ error: 'Invalid notification pagination.' });
        }
        const [notifications] = await db.query(`
            SELECT n.id, n.job_id, n.type, j.title, c.name AS company_name,
                   DATE_FORMAT(n.deadline, '%Y-%m-%d') AS deadline,
                   n.read_at, n.created_at
            FROM notifications n JOIN jobs j ON j.id = n.job_id JOIN companies c ON c.id = j.company_id
            WHERE n.user_id = ? ${before === null ? '' : 'AND n.id < ?'}
            ORDER BY n.id DESC LIMIT ?`, before === null ? [req.user.id, limit + 1] : [req.user.id, before, limit + 1]);
        const more = notifications.length > limit;
        const page = notifications.slice(0, limit);
        res.json({ notifications: page, next_before: more ? page.at(-1).id : null });
    });
    router.patch('/read-all', async (req, res) => {
        await db.query('UPDATE notifications SET read_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND read_at IS NULL', [req.user.id]);
        res.status(204).end();
    });
    router.patch('/:id/read', async (req, res) => {
        if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
            return res.status(400).json({ error: 'Invalid notification ID.' });
        }
        const [result] = await db.query(`UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP(3))
            WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'Notification not found.' });
        res.status(204).end();
    });
    router.use((error, _req, res, _next) => {
        console.error('Notifications request failed:', error);
        res.status(500).json({ error: 'Unable to load or update notifications right now.' });
    });
    return router;
}

module.exports = { createNotificationsRouter };

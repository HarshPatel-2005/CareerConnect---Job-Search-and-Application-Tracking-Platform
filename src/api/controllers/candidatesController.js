const db = require('../../config/db');

const statuses = ['applied', 'under_review', 'interview', 'offered', 'rejected'];
const metadata = `a.id, a.job_id, a.user_id, a.resume_name, a.status,
    UNIX_TIMESTAMP(a.applied_at) * 1000 AS applied_at`;
const publicRecord = row => ({ ...row, applied_at: new Date(Number(row.applied_at)).toISOString() });

// GET /api/candidates/job/:id
// Recruiters may only view applicants to their own company's postings.
const getJobCandidates = async (req, res) => {
    if (req.user.role !== 'recruiter' || !req.user.company_id) {
        return res.status(403).json({ error: 'Recruiter account required.' });
    }
    try {
        const [jobs] = await db.query(
            'SELECT id, title FROM jobs WHERE id = ? AND company_id = ?',
            [req.params.id, req.user.company_id]
        );
        if (!jobs.length) return res.status(404).json({ error: 'Job not found.' });

        const [rows] = await db.query(`SELECT ${metadata}, u.full_name, u.email
            FROM applications a JOIN users u ON u.id = a.user_id
            WHERE a.job_id = ? ORDER BY a.applied_at DESC, a.id DESC`, [req.params.id]);

        res.json({ job: jobs[0], applications: rows.map(publicRecord) });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ error: 'Unable to load candidates right now.' });
    }
};

// PATCH /api/candidates/:id/status   body: { status }
// Changes one application's status. When the number of Offered applications
// reaches the job's openings, the job is closed and every other pending
// application is marked Rejected, all in one transaction.
const updateCandidateStatus = async (req, res) => {
    if (req.user.role !== 'recruiter' || !req.user.company_id) {
        return res.status(403).json({ error: 'Recruiter account required.' });
    }
    if (!statuses.includes(req.body?.status)) {
        return res.status(400).json({ error: 'Invalid application status.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [applications] = await connection.query(`SELECT a.job_id FROM applications a
            JOIN jobs j ON j.id = a.job_id WHERE a.id = ? AND j.company_id = ?`, [req.params.id, req.user.company_id]);
        if (!applications.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Application not found.' });
        }

        const jobId = applications[0].job_id;
        const [jobRows] = await connection.query('SELECT openings FROM jobs WHERE id = ? FOR UPDATE', [jobId]);
        await connection.query('UPDATE applications SET status = ? WHERE id = ?', [req.body.status, req.params.id]);

        let jobClosed = false;
        let autoRejected = 0;
        if (req.body.status === 'offered') {
            const [offeredRows] = await connection.query(
                "SELECT COUNT(*) AS n FROM applications WHERE job_id = ? AND status = 'offered'", [jobId]);
            if (Number(offeredRows[0].n) >= jobRows[0].openings) {
                const [rejected] = await connection.query(
                    "UPDATE applications SET status = 'rejected' WHERE job_id = ? AND status NOT IN ('offered', 'rejected')", [jobId]);
                autoRejected = rejected.affectedRows;
                await connection.query("UPDATE jobs SET status = 'closed' WHERE id = ?", [jobId]);
                jobClosed = true;
            }
        }

        // Recompute the dashboard counts from the source records.
        const [counts] = await connection.query(`SELECT COUNT(*) AS total,
            SUM(status = 'applied') AS awaiting, SUM(status IN ('under_review', 'rejected')) AS reviewed,
            SUM(status = 'interview') AS contacting, SUM(status = 'offered') AS hired
            FROM applications WHERE job_id = ?`, [jobId]);
        const c = counts[0];
        await connection.query(`UPDATE jobs SET candidates_count = ?, awaiting_count = ?, reviewed_count = ?,
            contacting_count = ?, hired_count = ? WHERE id = ?`,
            [c.total, c.awaiting || 0, c.reviewed || 0, c.contacting || 0, c.hired || 0, jobId]);

        await connection.commit();
        res.json({ status: req.body.status, job_closed: jobClosed, auto_rejected: autoRejected });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error updating candidate status:', error);
        res.status(500).json({ error: 'Unable to update the application right now.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { getJobCandidates, updateCandidateStatus };
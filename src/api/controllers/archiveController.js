const db = require('../../config/db');

// PATCH /api/recruiter/jobs/:id/archive   body: { archived: true | false }
const setArchived = async (req, res) => {
    try {
        const companyId = req.user?.company_id;
        if (req.user?.role !== 'recruiter' || !companyId) {
            return res.status(403).json({ error: 'Recruiter account required' });
        }

        const archived = req.body.archived === true;

        // Step 1: whose job is this?
        const [rows] = await db.query('SELECT company_id FROM jobs WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Job not found.' });
        if (String(rows[0].company_id) !== String(companyId)) {
            return res.status(403).json({ error: 'You can only archive your own company\'s postings.' });
        }

        // Step 2: it's theirs, so apply the change (company_id kept as a second guard)
        await db.query(
            `UPDATE jobs
             SET archived = ?, archived_at = ${archived ? 'CURRENT_TIMESTAMP' : 'NULL'}
             WHERE id = ? AND company_id = ?`,
            [archived, req.params.id, companyId]
        );
        res.json({ id: req.params.id, archived });
    } catch (error) {
        console.error('Error updating archive state:', error);
        res.status(500).json({ error: 'Unable to update archive state.' });
    }
};

module.exports = { setArchived };
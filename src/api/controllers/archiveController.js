const db = require('../../config/db');

// PATCH /api/recruiter/jobs/:id/archive   body: { archived: true | false }
const setArchived = async (req, res) => {
    try {
        const companyId = req.user?.company_id;
        if (req.user?.role !== 'recruiter' || !companyId) {
            return res.status(403).json({ error: 'Recruiter account required' });
        }

        const archived = req.body.archived === true;
        const [result] = await db.query(
            `UPDATE jobs
             SET archived = ?, archived_at = ${archived ? 'CURRENT_TIMESTAMP' : 'NULL'}
             WHERE id = ? AND company_id = ?`,
            [archived, req.params.id, companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Job not found.' });
        }
        res.json({ id: req.params.id, archived });
    } catch (error) {
        console.error('Error updating archive state:', error);
        res.status(500).json({ error: 'Unable to update archive state.' });
    }
};

module.exports = { setArchived };
const aiFeedbackService = require('../services/aiResumeService');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const KNOWN_ERRORS = new Map([
    ['JOB_NOT_FOUND', [404, 'Job not found']],
    ['JOB_NOT_OPEN', [409, 'Job is not open for feedback']],
    ['RESUME_NOT_FOUND', [404, 'Resume not found']],
    ['RESUME_FILE_MISSING', [409, 'Resume file is missing. Upload it again before requesting feedback.']],
    ['JOB_MISSING_REQUIRED_SKILLS', [422, 'This job posting has no required skills listed, so feedback is unavailable.']]
]);

async function getJobFeedback(req, res, { store, uploadDir, db }) {
    const resume_id = req.body?.resume_id;
    if (typeof resume_id !== 'string' || !UUID_PATTERN.test(resume_id)) {
        return res.status(400).json({ error: 'A valid resume_id is required in the request body.' });
    }

    try {
        const feedback = await aiFeedbackService.generateJobFeedback({
            jobId: req.params.id,
            userId: req.applicantId ?? req.user?.id ?? req.user?.userId ,
            resumeId: resume_id,
            store,
            uploadDir,
            db
        });

        return res.status(200).json({
            ...feedback,
            disclaimer: 'AI-Generated Content'
        });
    } catch (error) {
        const message = String(error?.message ?? '');

        if (KNOWN_ERRORS.has(message)) {
            const [status, text] = KNOWN_ERRORS.get(message);
            return res.status(status).json({ error: text });
        }

        if(/timeout|timed out/i.test(message)) {
            return res.status(504).json({ error: 'AI service timed out. Please try again later.' });
        }

        console.error('Error generating job feedback:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getJobFeedback
};
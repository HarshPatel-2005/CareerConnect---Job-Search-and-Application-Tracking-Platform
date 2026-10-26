const express = require('express');
const path = require('path');
const { createResumeRouter } = require('./routes/resumesRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const jobPostingRoutes = require('./routes/jobPostingRoutes');   // NEW
const { createJobsRouter } = require('./routes/jobsRoutes');
const jobSearchRoutes = require('./routes/jobSearchRoutes');

function createApp(options = {}) {
    const app = express();

    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/applications', require('./routes/applicationsRoutes'));
    // Keep legacy/bookmarked paths useful while using a single page per workflow.
    app.get('/jobs.html', (_req, res) => res.redirect('/job-search.html'));
    app.get('/cadidates-dashboard.html', (req, res) => res.redirect('/candidates-dashboard.html' + (req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '')));
    app.use(express.static(path.join(__dirname, '../public')));
    const resumes = createResumeRouter(options.resume || {});
    app.use('/api/resumes', resumes);
    // Public search must run before the authenticated details/apply router.
    app.use('/api/jobs', jobSearchRoutes);
    app.use('/api/jobs', createJobsRouter({
        store: resumes.resumeStore,
        uploadDir: resumes.uploadDir,
        ...options.applications
    }));

    app.use('/api/recruiter', recruiterRoutes);
    app.use('/api/recruiter', jobPostingRoutes);                 // NEW

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });

    app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
    app.use((error, _req, res, _next) => {
        if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON request.' });
        console.error('Request failed:', error);
        res.status(500).json({ error: 'Unable to complete the request right now.' });
    });
    return app;
}

const app = createApp();
module.exports = app;
module.exports.createApp = createApp;

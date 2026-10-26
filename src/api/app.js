const express = require('express');
const path = require('path');
const { createResumeRouter } = require('./routes/resumesRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const jobPostingRoutes = require('./routes/jobPostingRoutes');   // NEW
const jobSearchRoutes = require('./routes/jobSearchRoutes');

function createApp(options = {}) {
    const app = express();

    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../public')));

    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/resumes', createResumeRouter(options.resume || {}));

    app.use('/api/recruiter', recruiterRoutes);
    app.use('/api/recruiter', jobPostingRoutes);                 // NEW
    app.use('/api/jobs', jobSearchRoutes);

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });

    return app;
}

const app = createApp();
module.exports = app;
module.exports.createApp = createApp;
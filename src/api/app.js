const express = require('express');
const path = require('path');
const { createResumeRouter } = require('./routes/resumes');

function createApp(options = {}) {
    const app = express();

    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../public')));

    app.use('/api/resumes', createResumeRouter(options.resume || {}));

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });

    return app;
}

const app = createApp();
module.exports = app;
module.exports.createApp = createApp;

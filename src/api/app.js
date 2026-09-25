const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');


const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ===== API routes =====

app.use('/api/auth', authRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});


module.exports = app;
const { verifyToken } = require("../utils/jwt");

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Expected format: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // Attach the decoded user info to the request object
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = {
    authenticateToken
};
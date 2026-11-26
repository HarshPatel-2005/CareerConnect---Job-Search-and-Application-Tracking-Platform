const app = require('./app');
const { startDeadlineReminders } = require('./services/deadlineReminders');
const db = require('../config/db');
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
});
const stopReminders = startDeadlineReminders();
let stopping = false;
async function shutdown() {
    if (stopping) return;
    stopping = true;
    server.close(async () => {
        await stopReminders();
        await db.end();
    });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

const defaultDb = require('../../config/db');

const REMINDER_DAYS = 3;

// One atomic insert and a unique event key make retries and multiple servers safe.
// Date-only deadlines remain open through the end of the named day in UTC.
async function generateDeadlineReminders(db = defaultDb, savedJob = null) {
    const [result] = await db.query(`
        INSERT INTO notifications (user_id, job_id, type, deadline)
        SELECT s.user_id, s.job_id, 'deadline_reminder', j.deadline
        FROM saved_jobs s
        JOIN users u ON u.id = s.user_id AND u.role = 'job_seeker'
        JOIN jobs j ON j.id = s.job_id
        WHERE j.status = 'open'
          AND j.deadline BETWEEN UTC_DATE() AND DATE_ADD(UTC_DATE(), INTERVAL ? DAY)
          AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.user_id = s.user_id AND a.job_id = s.job_id)
          ${savedJob ? 'AND s.user_id = ? AND s.job_id = ?' : ''}
        ON DUPLICATE KEY UPDATE id = notifications.id`,
    savedJob ? [REMINDER_DAYS, savedJob.userId, savedJob.jobId] : [REMINDER_DAYS]);
    return result.affectedRows;
}

function startDeadlineReminders({ db = defaultDb, intervalMs = 60000, onError = console.error } = {}) {
    let pending;
    const run = () => {
        if (!pending) {
            pending = generateDeadlineReminders(db)
                .catch(error => onError('Deadline reminders failed:', error))
                .finally(() => { pending = null; });
        }
        return pending;
    };
    run();
    const timer = setInterval(run, intervalMs);
    timer.unref();
    return async () => { clearInterval(timer); await pending; };
}

module.exports = { generateDeadlineReminders, startDeadlineReminders, REMINDER_DAYS };

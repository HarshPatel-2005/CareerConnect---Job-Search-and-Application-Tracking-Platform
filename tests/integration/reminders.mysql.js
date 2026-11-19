// Uses a disposable schema so reminder generation never changes real users' notifications.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const request = require('supertest');
const mysql = require('mysql2/promise');
const adminDb = require('../../src/config/db');
const { generateToken } = require('../../src/api/utils/jwt');
const { createSavedJobsRouter } = require('../../src/api/routes/savedJobsRoutes');
const { createNotificationsRouter } = require('../../src/api/routes/notificationsRoutes');
const { generateDeadlineReminders } = require('../../src/api/services/deadlineReminders');

async function run() {
    const schemaName = `careerconnect_reminders_test_${crypto.randomBytes(8).toString('hex')}`;
    let db;
    try {
        await adminDb.query(`CREATE DATABASE \`${schemaName}\``);
        db = mysql.createPool({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '', database: schemaName });
        const schema = fs.readFileSync(path.join(__dirname, '../../db/init.sql'), 'utf8')
            .replace(/^CREATE DATABASE.*;\r?\n/m, '').replace(/^USE .*;\r?\n/m, '');
        for (const sql of schema.split(';').filter(sql => sql.trim())) await db.query(sql);
        const makeApp = () => {
            const app = express(); app.use(express.json());
            app.use('/api/saved-jobs', createSavedJobsRouter({ db }));
            app.use('/api/notifications', createNotificationsRouter({ db }));
            return app;
        };
        const app = makeApp();
        const [company] = await db.query("INSERT INTO companies (name) VALUES ('Reminder fixture')");
        const users = [];
        for (const role of ['job_seeker', 'job_seeker', 'recruiter']) {
            const [user] = await db.query('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['Fixture', `${crypto.randomUUID()}@example.invalid`, 'not-a-password', role]);
            users.push({ id: user.insertId, authorization: `Bearer ${generateToken({ id: user.insertId, role })}` });
        }
        const [owner, other, recruiter] = users;
        const jobs = {};
        for (const [name, days, status] of [
            ['today', 0, 'open'], ['three', 3, 'open'], ['four', 4, 'open'], ['expired', -1, 'open'],
            ['none', null, 'open'], ['paused', 2, 'paused'], ['closed', 2, 'closed'],
            ['applied', 1, 'open'], ['removed', 4, 'open'],
            ['archived', 2, 'open'], ['archived_later', 4, 'open']
        ]) {
            const [job] = await db.query(`INSERT INTO jobs (company_id, title, location, status, deadline)
                VALUES (?, ?, 'Montreal', ?, ${days === null ? 'NULL' : 'DATE_ADD(UTC_DATE(), INTERVAL ? DAY)'})`,
            days === null ? [company.insertId, name, status] : [company.insertId, name, status, days]);
            jobs[name] = job.insertId;
        }
        await db.query('UPDATE jobs SET archived = TRUE WHERE id = ?', [jobs.archived]);
        const save = (job, user = owner) => request(app).put(`/api/saved-jobs/${job}`).set('Authorization', user.authorization);
        const count = async user => (await request(app).get('/api/notifications/unread-count').set('Authorization', user.authorization)).body.unread_count;
        await db.query(`INSERT INTO applications (user_id, job_id, resume_id, resume_name, resume_mime_type, resume_content)
            VALUES (?, ?, ?, 'test.pdf', 'application/pdf', ?)`, [owner.id, jobs.applied, crypto.randomUUID(), Buffer.from('%PDF-')]);
        const saves = await Promise.all([save(jobs.today), save(jobs.today)]);
        assert.deepEqual(saves.map(res => res.status), [200, 200]);
        for (const job of Object.values(jobs)) assert.equal((await save(job)).status, 200);
        const [[archivedImmediate]] = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE job_id = ?', [jobs.archived]);
        assert.equal(archivedImmediate.count, 0, 'Saving an archived open job must not create an immediate reminder');
        assert.equal((await save(jobs.today, other)).status, 200);
        assert.equal((await save(jobs.today, recruiter)).status, 403);
        assert.equal((await save(999999)).status, 404);
        assert.equal((await request(app).delete(`/api/saved-jobs/${jobs.removed}`).set('Authorization', owner.authorization)).status, 204);
        await db.query('UPDATE jobs SET deadline = DATE_ADD(UTC_DATE(), INTERVAL 1 DAY) WHERE id = ?', [jobs.removed]);
        const saved = await request(makeApp()).get('/api/saved-jobs').set('Authorization', owner.authorization);
        assert.equal(saved.body.jobs.length, Object.keys(jobs).length - 1, 'Saves survive app recreation and are unique');
        assert.equal(saved.body.jobs.find(job => job.id === jobs.expired).expired, 1);
        assert.match(saved.body.jobs.find(job => job.id === jobs.today).deadline, /^\d{4}-\d{2}-\d{2}$/);
        assert.equal(await count(owner), 2, 'Eligible reminders exist as soon as save requests complete, without running the scheduler');
        assert.equal(await count(other), 1);
        // Saving one posting must not generate reminders for other saved postings.
        await db.query('UPDATE jobs SET deadline = DATE_ADD(UTC_DATE(), INTERVAL 2 DAY) WHERE id = ?', [jobs.four]);
        await save(jobs.today);
        assert.equal(await count(owner), 2, 'Immediate checks are scoped to the saved job');
        await db.query('UPDATE jobs SET deadline = DATE_ADD(UTC_DATE(), INTERVAL 4 DAY) WHERE id = ?', [jobs.four]);
        // A previously saved posting can be archived before its deadline enters the window.
        await db.query('UPDATE jobs SET archived = TRUE, deadline = DATE_ADD(UTC_DATE(), INTERVAL 1 DAY) WHERE id = ?', [jobs.archived_later]);

        // Retry concurrent transactions if MySQL chooses one as a deadlock victim.
        const concurrent = await Promise.allSettled([generateDeadlineReminders(db), generateDeadlineReminders(db)]);
        for (const result of concurrent) {
            if (result.status === 'rejected') {
                assert.equal(result.reason.code, 'ER_LOCK_DEADLOCK');
                await generateDeadlineReminders(db);
            }
        }
        await generateDeadlineReminders(db);
        const [[archivedScheduled]] = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE job_id IN (?, ?)', [jobs.archived, jobs.archived_later]);
        assert.equal(archivedScheduled.count, 0, 'Scheduled checks must exclude archived jobs, including jobs archived after saving');
        const [records] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY job_id', [owner.id]);
        assert.deepEqual(records.map(row => row.job_id), [jobs.today, jobs.three], 'Only open, unapplied saved jobs due in 0–3 days receive reminders');
        assert.equal(await count(owner), 2); assert.equal(await count(other), 1);
        const first = await request(app).get('/api/notifications?limit=1').set('Authorization', owner.authorization);
        assert.equal(first.body.notifications.length, 1); assert.ok(first.body.next_before);
        const second = await request(app).get(`/api/notifications?limit=1&before=${first.body.next_before}`).set('Authorization', owner.authorization);
        assert.equal(second.body.notifications.length, 1); assert.equal(second.body.next_before, null);
        assert.notEqual(first.body.notifications[0].id, second.body.notifications[0].id);
        const notificationId = records[0].id;
        assert.equal((await request(app).patch(`/api/notifications/${notificationId}/read`).set('Authorization', other.authorization)).status, 404);
        for (let i = 0; i < 2; i++) {
            assert.equal((await request(app).patch(`/api/notifications/${notificationId}/read`).set('Authorization', owner.authorization)).status, 204);
        }
        assert.equal(await count(owner), 1);
        assert.equal((await request(app).patch('/api/notifications/read-all').set('Authorization', owner.authorization)).status, 204);
        assert.equal(await count(owner), 0); assert.equal(await count(other), 1);
        await request(app).delete(`/api/saved-jobs/${jobs.today}`).set('Authorization', owner.authorization);
        await save(jobs.today);
        await generateDeadlineReminders(db);
        assert.equal(await count(owner), 0, 'Resaving and scheduler retries must not reissue read reminders');
        await db.query('UPDATE jobs SET deadline = DATE_ADD(UTC_DATE(), INTERVAL 3 DAY) WHERE id = ?', [jobs.four]);
        assert.equal(await count(owner), 0, 'A job saved further ahead has no reminder until it enters the window');
        await generateDeadlineReminders(db);
        assert.equal(await count(owner), 1, 'Scheduled checks still generate reminders when a saved job enters the window');
        await request(app).patch('/api/notifications/read-all').set('Authorization', owner.authorization);
        await db.query('UPDATE jobs SET deadline = DATE_ADD(UTC_DATE(), INTERVAL 1 DAY) WHERE id = ?', [jobs.today]);
        await generateDeadlineReminders(db);
        assert.equal(await count(owner), 1, 'A changed deadline receives its own reminder');
        await db.query('DELETE FROM jobs WHERE id = ?', [jobs.today]);
        assert.equal(await count(owner), 0, 'Deleted postings remove related reminders and saves');
        console.log('PASS: fresh schema, immediate reminders on save, scoped checks, concurrent saves, scheduled catch-up, persistence, ownership, UTC date boundaries, excluded jobs, reminder deduplication, pagination, read state, resaves, changed deadlines, and cascade cleanup.');
    } finally {
        if (db) await db.end();
        // The target is always a generated test schema, never the configured application database.
        await adminDb.query(`DROP DATABASE IF EXISTS \`${schemaName}\``);
    }
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => adminDb.end());

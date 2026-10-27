// Opt-in integration check against the configured, migrated local MySQL DB.
// Only generated fixture rows are removed; existing application data is untouched.
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const request = require('supertest');
const db = require('../../src/config/db');
const { createApp } = require('../../src/api/app');
const { generateToken } = require('../../src/api/utils/jwt');
const ResumeStore = require('../../src/api/db/resumeStore');

async function run() {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'careerconnect-mysql-check-'));
    const store = new ResumeStore(path.join(directory, 'resumes.sqlite'));
    const app = createApp({ resume: { store, uploadDir: directory } });
    let userId, companyId, jobId;
    try {
        const [company] = await db.query('INSERT INTO companies (name) VALUES (?)', [`Integration ${crypto.randomUUID()}`]);
        companyId = company.insertId;
        const [user] = await db.query(`INSERT INTO users (full_name, email, password_hash, role)
            VALUES (?, ?, ?, 'job_seeker')`, ['Integration fixture', `${crypto.randomUUID()}@example.invalid`, 'not-a-login-password']);
        userId = user.insertId;
        const [job] = await db.query('INSERT INTO jobs (company_id, title, location) VALUES (?, ?, ?)', [companyId, 'Integration fixture', 'Montreal']);
        jobId = job.insertId;
        const authorization = `Bearer ${generateToken({ id: userId, role: 'job_seeker' })}`;
        const file = Buffer.from('%PDF-1.7\nApplication integration fixture');
        const uploaded = await request(app).post('/api/resumes').set('Authorization', authorization)
            .attach('resume', file, { filename: 'integration.pdf', contentType: 'application/pdf' });
        assert.equal(uploaded.status, 201);
        const resumeId = uploaded.body.resume.id;
        const start = Date.now();
        const results = await Promise.all([1, 2].map(() => request(app).post(`/api/jobs/${jobId}/apply`)
            .set('Authorization', authorization).send({ resume_id: resumeId })));
        assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
        const submitted = results.find(result => result.status === 201).body.application;
        assert.ok(Math.abs(Date.parse(submitted.applied_at) - start) < 10000, 'Timestamp must be current UTC time');
        const details = await request(app).get(`/api/jobs/${jobId}`).set('Authorization', authorization);
        assert.deepEqual(details.body.application, submitted);
        // The unique index must protect the table even if callers bypass the API.
        await assert.rejects(db.query(`INSERT INTO applications
            (user_id, job_id, resume_id, resume_name, resume_mime_type, resume_content)
            VALUES (?, ?, ?, ?, ?, ?)`, [userId, jobId, resumeId, 'duplicate.pdf', 'application/pdf', file]),
        { code: 'ER_DUP_ENTRY' });
        const removed = await request(app).delete(`/api/resumes/${resumeId}`).set('Authorization', authorization);
        assert.equal(removed.status, 204);
        const [records] = await db.query('SELECT resume_content FROM applications WHERE user_id = ? AND job_id = ?', [userId, jobId]);
        assert.equal(records.length, 1);
        assert.deepEqual(records[0].resume_content, file);
        const [counters] = await db.query('SELECT candidates_count, awaiting_count FROM jobs WHERE id = ?', [jobId]);
        assert.equal(counters[0].candidates_count, 1);
        assert.equal(counters[0].awaiting_count, 1);
        console.log('PASS: real upload, concurrent apply (201/409), DB uniqueness, UTC timestamp, details, counters, and retained resume snapshot.');
    } finally {
        if (userId && jobId) await db.query('DELETE FROM applications WHERE user_id = ? AND job_id = ?', [userId, jobId]);
        if (jobId) await db.query('DELETE FROM jobs WHERE id = ?', [jobId]);
        if (userId) await db.query('DELETE FROM users WHERE id = ?', [userId]);
        if (companyId) await db.query('DELETE FROM companies WHERE id = ?', [companyId]);
        store.close();
        fs.rmSync(directory, { recursive: true, force: true });
    }
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
}).finally(() => db.end());

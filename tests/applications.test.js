process.env.JWT_SECRET = 'applications-test-secret';
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/api/app');
const ResumeStore = require('../src/api/db/resumeStore');

const resumeId = 'ee7470ab-89ad-4076-887d-31a658632f81';
const pdf = Buffer.from('%PDF-1.7\nSaved resume');
const application = { id: 12, job_id: 5, resume_id: resumeId, resume_name: 'CV.pdf', applied_at: '2026-10-26T01:00:00.000Z' };
const storedApplication = { ...application, applied_at: Date.parse(application.applied_at) };
let directory, store, app, connection, db;
const token = (overrides = {}) => jwt.sign({ id: 1, role: 'job_seeker', ...overrides }, process.env.JWT_SECRET);
const apply = (body = { resume_id: resumeId }, bearer = token(), id = '5') => request(app)
    .post(`/api/jobs/${id}/apply`).set('Authorization', `Bearer ${bearer}`).send(body);

beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'careerconnect-applications-'));
    store = new ResumeStore(path.join(directory, 'resumes.sqlite'));
    fs.writeFileSync(path.join(directory, 'stored.pdf'), pdf);
    store.create({ id: resumeId, user_id: '1', original_name: 'CV.pdf', stored_name: 'stored.pdf',
        mime_type: 'application/pdf', size_bytes: pdf.length, created_at: '2026-10-26', updated_at: '2026-10-26' });
    connection = {
        beginTransaction: jest.fn().mockResolvedValue(), commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(), release: jest.fn(), query: jest.fn()
    };
    db = { getConnection: jest.fn().mockResolvedValue(connection), query: jest.fn() };
    app = createApp({ resume: { store, uploadDir: directory }, applications: { db } });
});
afterEach(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
});
function successfulQueries() {
    connection.query.mockResolvedValueOnce([[{ id: 5, status: 'open' }]])
        .mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 12 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[storedApplication]]);
}

test('records the authenticated applicant, saved resume snapshot and timestamp atomically', async () => {
    successfulQueries();
    const result = await apply({ resume_id: resumeId, user_id: 999, applied_at: '1900-01-01' });
    expect(result.status).toBe(201);
    expect(result.body.application).toEqual(application);
    const insertion = connection.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO applications'));
    expect(insertion[1]).toEqual([1, '5', resumeId, 'CV.pdf', 'application/pdf', pdf]);
    expect(connection.query.mock.calls.some(([sql]) => sql.includes('awaiting_count + 1'))).toBe(true);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
});
test('requires authentication', async () => {
    expect((await request(app).post('/api/jobs/5/apply').send({ resume_id: resumeId })).status).toBe(401);
    expect((await apply(undefined, 'invalid')).status).toBe(403);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test('blocks recruiter accounts', async () => {
    expect((await apply(undefined, token({ role: 'recruiter' }))).status).toBe(403);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test.each([{}, { resume_id: 42 }, { resume_id: '../file' }])('rejects invalid resume selection %j', async body => {
    expect((await apply(body)).status).toBe(400);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test.each(['0', '-1', '1abc', '9007199254740992'])('rejects invalid job ID %s', async id => {
    expect((await apply(undefined, token(), id)).status).toBe(400);
});
test('does not allow another user to apply using someone else’s resume', async () => {
    expect((await apply(undefined, token({ id: 2 }))).status).toBe(404);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test('handles missing saved files without recording an application', async () => {
    fs.unlinkSync(path.join(directory, 'stored.pdf'));
    expect((await apply()).status).toBe(409);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test('returns 404 for an unknown job', async () => {
    connection.query.mockResolvedValueOnce([[]]);
    expect((await apply()).status).toBe(404);
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
});
test.each(['paused', 'closed'])('rejects %s jobs', async status => {
    connection.query.mockResolvedValueOnce([[{ id: 5, status }]]).mockResolvedValueOnce([[]]);
    expect((await apply()).status).toBe(409);
    expect(connection.query).toHaveBeenCalledTimes(2);
    expect(connection.rollback).toHaveBeenCalled();
});
test('rejects an existing application without incrementing counters', async () => {
    connection.query.mockResolvedValueOnce([[{ id: 5, status: 'open' }]])
        .mockResolvedValueOnce([[{ id: 12 }]]);
    const result = await apply();
    expect(result.status).toBe(409);
    expect(result.body.code).toBe('ALREADY_APPLIED');
    expect(connection.query).toHaveBeenCalledTimes(2);
    expect(connection.rollback).toHaveBeenCalled();
});
test('maps the database uniqueness constraint to a duplicate response', async () => {
    connection.query.mockResolvedValueOnce([[{ id: 5, status: 'open' }]])
        .mockResolvedValueOnce([[]]).mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    const result = await apply();
    expect(result.status).toBe(409);
    expect(result.body.code).toBe('ALREADY_APPLIED');
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
});
test('rolls back an insert when updating job counters fails', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    connection.query.mockResolvedValueOnce([[{ id: 5, status: 'open' }]])
        .mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 12 }])
        .mockRejectedValueOnce(new Error('Database unavailable'));
    const result = await apply();
    expect(result.status).toBe(500);
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    log.mockRestore();
});
test('job details return only the current applicant’s submission', async () => {
    db.query.mockResolvedValueOnce([[{ id: 5, title: 'Developer' }]]).mockResolvedValueOnce([[storedApplication]]);
    const result = await request(app).get('/api/jobs/5').set('Authorization', `Bearer ${token()}`);
    expect(result.status).toBe(200);
    expect(result.body.application).toEqual(application);
    expect(db.query.mock.calls[1][1]).toEqual(['5', 1]);
});
test('job details remain protected after mounting public search', async () => {
    const result = await request(app).get('/api/jobs/5');
    expect(result.status).toBe(401);
    expect(db.query).not.toHaveBeenCalled();
});
test('restored login and new job pages are served', async () => {
    for (const url of ['/login.html', '/jobs.html', '/job-search.html', '/job-details.html']) {
        expect((await request(app).get(url).redirects(1)).status).toBe(200);
    }
});

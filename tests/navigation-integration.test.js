process.env.JWT_SECRET = 'navigation-integration-secret';
const request = require('supertest');
const jwt = require('jsonwebtoken');
jest.mock('../src/config/db', () => ({ query: jest.fn(), getConnection: jest.fn() }));
const db = require('../src/config/db');
const app = require('../src/api/app');
const auth = (overrides = {}) => `Bearer ${jwt.sign({ id: 10, role: 'job_seeker', ...overrides }, process.env.JWT_SECRET)}`;
beforeEach(() => jest.resetAllMocks());

test('session endpoint returns only the current account identity', async () => {
    const user = { id: 10, full_name: 'Same Name', email: 'unique@example.invalid', role: 'job_seeker', company_id: null };
    db.query.mockResolvedValueOnce([[user]]);
    const res = await request(app).get('/api/auth/me').set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(user);
    expect(db.query.mock.calls[0][1]).toEqual([10]);
});
test('deleted accounts cannot retain an active session', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/auth/me').set('Authorization', auth());
    expect(res.status).toBe(401);
});
test('settings expose email only to the profile owner', async () => {
    db.query.mockResolvedValueOnce([[{ id: 10, full_name: 'Test', email: 'owner@example.invalid', summary: null }]])
        .mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/profile/10').set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('owner@example.invalid');
});
test('job seekers cannot access recruiter job lists', async () => {
    const res = await request(app).get('/api/recruiter/jobs').set('Authorization', auth());
    expect(res.status).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
});
test('job status changes are scoped to the recruiter company', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).patch('/api/recruiter/jobs/4/status')
        .set('Authorization', auth({ role: 'recruiter', company_id: 7 })).send({ status: 'paused' });
    expect(res.status).toBe(200);
    expect(db.query.mock.calls[0][1]).toEqual(['paused', '4', 7]);
});
test('invalid job statuses cannot be stored', async () => {
    const res = await request(app).patch('/api/recruiter/jobs/4/status')
        .set('Authorization', auth({ role: 'recruiter', company_id: 7 })).send({ status: 'invalid' });
    expect(res.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
});
test('job seekers see only their own application history', async () => {
    db.query.mockResolvedValueOnce([[{ id: 2, status: 'under_review', applied_at: 1793059200000 }]]);
    const res = await request(app).get('/api/applications').set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(res.body.applications[0].status).toBe('under_review');
    expect(db.query.mock.calls[0][1]).toEqual([10]);
});
test('another company cannot read applications for a posting', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/applications/job/4')
        .set('Authorization', auth({ role: 'recruiter', company_id: 8 }));
    expect(res.status).toBe(404);
    expect(db.query.mock.calls[0][1]).toEqual(['4', 8]);
});
test('another applicant cannot download the submitted resume', async () => {
    db.query.mockResolvedValueOnce([[{ user_id: 99, company_id: 7 }]]);
    const res = await request(app).get('/api/applications/2/resume').set('Authorization', auth());
    expect(res.status).toBe(404);
});
test('the owning company can download the exact submitted file', async () => {
    const file = Buffer.from('%PDF-1.7\nSubmitted resume');
    db.query.mockResolvedValueOnce([[{ user_id: 99, company_id: 7, resume_name: 'CV.pdf', resume_mime_type: 'application/pdf', resume_content: file }]]);
    const res = await request(app).get('/api/applications/2/resume')
        .set('Authorization', auth({ role: 'recruiter', company_id: 7 }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual(file);
});
test('status updates and candidate counts commit together', async () => {
    const connection = { beginTransaction: jest.fn(), rollback: jest.fn(), release: jest.fn(), commit: jest.fn(), query: jest.fn() };
    connection.query.mockResolvedValueOnce([[{ job_id: 4 }]])
        .mockResolvedValueOnce([[{ id: 4 }]]).mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ total: 1, awaiting: 0, reviewed: 1, contacting: 0, hired: 0 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
    db.getConnection.mockResolvedValueOnce(connection);
    const res = await request(app).patch('/api/applications/2/status')
        .set('Authorization', auth({ role: 'recruiter', company_id: 7 })).send({ status: 'under_review' });
    expect(res.status).toBe(200);
    expect(connection.query.mock.calls[0][1]).toEqual(['2', 7]);
    expect(connection.query.mock.calls[4][1]).toEqual([1, 0, 1, 0, 0, 4]);
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
});
test('job seekers cannot change application statuses', async () => {
    const res = await request(app).patch('/api/applications/2/status')
        .set('Authorization', auth()).send({ status: 'offered' });
    expect(res.status).toBe(403);
    expect(db.getConnection).not.toHaveBeenCalled();
});

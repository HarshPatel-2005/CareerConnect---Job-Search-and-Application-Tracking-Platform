process.env.JWT_SECRET = 'archive-test-secret';
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Replace the real database with a fake whose query() we control.
// Adjust these paths so they match your project.
jest.mock('../src/config/db', () => ({ query: jest.fn() }));
const db = require('../src/config/db');
const archiveRoutes = require('../src/api/routes/archiveRoutes');

const app = express();
app.use(express.json());
app.use('/api/recruiter', archiveRoutes);

const token = (overrides = {}) =>
    jwt.sign({ id: 1, role: 'recruiter', company_id: 7, ...overrides }, process.env.JWT_SECRET);
const patch = (body = { archived: true }, bearer = token(), id = '5') =>
    request(app).patch(`/api/recruiter/jobs/${id}/archive`)
        .set('Authorization', `Bearer ${bearer}`).send(body);

// Query 1 looks up the job's owner; query 2 applies the update.
const ownedByMyCompany = () => db.query.mockResolvedValueOnce([[{ company_id: 7 }]]);
const updateSucceeds = () => db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

beforeEach(() => db.query.mockReset());

test('archives a posting and stamps archived_at', async () => {
    ownedByMyCompany(); updateSucceeds();
    const result = await patch({ archived: true });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ id: '5', archived: true });
    const [sql, params] = db.query.mock.calls[1];
    expect(sql).toContain('archived_at = CURRENT_TIMESTAMP');
    expect(params).toEqual([true, '5', 7]);
});
test('restores a posting and clears archived_at', async () => {
    ownedByMyCompany(); updateSucceeds();
    const result = await patch({ archived: false });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ id: '5', archived: false });
    const [sql, params] = db.query.mock.calls[1];
    expect(sql).toContain('archived_at = NULL');
    expect(params).toEqual([false, '5', 7]);
});
test.each([{}, { archived: 'true' }, { archived: 1 }, { archived: null }])(
    'only a real boolean true archives; %j is treated as restore', async body => {
        ownedByMyCompany(); updateSucceeds();
        const result = await patch(body);
        expect(result.status).toBe(200);
        expect(result.body.archived).toBe(false);
    });
test('requires authentication', async () => {
    expect((await request(app).patch('/api/recruiter/jobs/5/archive').send({ archived: true })).status).toBe(401);
    expect((await patch(undefined, 'invalid')).status).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
});
test('blocks job seeker accounts', async () => {
    expect((await patch(undefined, token({ role: 'job_seeker' }))).status).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
});
test('blocks recruiters who have no company', async () => {
    expect((await patch(undefined, token({ company_id: undefined }))).status).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
});
test.each([true, false])('returns 403 and changes nothing for another company’s posting (archived: %s)', async archived => {
    db.query.mockResolvedValueOnce([[{ company_id: 99 }]]);
    const result = await patch({ archived });
    expect(result.status).toBe(403);
    expect(db.query).toHaveBeenCalledTimes(1);   // the lookup only; no UPDATE ran
});
test('ignores a company_id sent in the body', async () => {
    db.query.mockResolvedValueOnce([[{ company_id: 99 }]]);
    expect((await patch({ archived: true, company_id: 7 })).status).toBe(403);
    expect(db.query).toHaveBeenCalledTimes(1);
});
test('returns 404 for an unknown posting', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const result = await patch();
    expect(result.status).toBe(404);
    expect(db.query).toHaveBeenCalledTimes(1);
});
test('returns 500 when the database fails', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.query.mockRejectedValueOnce(new Error('Database unavailable'));
    const result = await patch();
    expect(result.status).toBe(500);
    log.mockRestore();
});
// Set the secret BEFORE the app is loaded, so the app and this test
// always sign and verify with the same value.
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/api/app');

jest.mock('../src/config/db', () => ({
    query: jest.fn(),
    getConnection: jest.fn()
}));

const db = require('../src/config/db');
const JWT_SECRET = process.env.JWT_SECRET;

function createToken(overrides = {}, options = {}) {
    const payload = {
        id: 1,
        email: 'recruiter@example.com',
        role: 'recruiter',
        company_id: 7,
        ...overrides
    };
    return jwt.sign(payload, options.secret || JWT_SECRET, { expiresIn: options.expiresIn || '1h' });
}

let connection;

beforeEach(() => {
    jest.clearAllMocks();
    connection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn(),
        query: jest.fn()
    };
    db.getConnection.mockResolvedValue(connection);
});

// ----------------------------------------------------------------------
// GET /api/candidates/job/:id
// ----------------------------------------------------------------------
describe('GET /api/candidates/job/:id', () => {
    const storedApplication = {
        id: 12, job_id: 5, user_id: 3, resume_name: 'CV.pdf', status: 'applied',
        applied_at: Date.parse('2026-10-26T01:00:00.000Z'),
        full_name: 'Sam Seeker', email: 'sam@example.com'
    };

    it('returns 401 when no token is sent', async () => {
        const res = await request(app).get('/api/candidates/job/5');

        expect(res.statusCode).toBe(401);
        expect(db.query).not.toHaveBeenCalled();
    });

    it('returns 403 for a token signed with the wrong secret', async () => {
        const token = createToken({}, { secret: 'wrong_secret' });

        const res = await request(app)
            .get('/api/candidates/job/5')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
        expect(db.query).not.toHaveBeenCalled();
    });

    it('returns 403 for a job_seeker token', async () => {
        const token = createToken({ role: 'job_seeker', company_id: null });

        const res = await request(app)
            .get('/api/candidates/job/5')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/recruiter account required/i);
        expect(db.query).not.toHaveBeenCalled();
    });

    it('looks the job up by BOTH the id and the company_id from the token', async () => {
        const token = createToken({ company_id: 7 });
        db.query.mockResolvedValueOnce([[{ id: 5, title: 'Developer' }]]).mockResolvedValueOnce([[]]);

        await request(app)
            .get('/api/candidates/job/5')
            .set('Authorization', `Bearer ${token}`);

        expect(db.query.mock.calls[0][0]).toMatch(/WHERE id = \? AND company_id = \?/);
        expect(db.query.mock.calls[0][1]).toEqual(['5', 7]);
    });

    it('returns 404 when the job belongs to another company or does not exist', async () => {
        const token = createToken();
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .get('/api/candidates/job/999')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Job not found.' });
        expect(db.query).toHaveBeenCalledTimes(1);   // applicants are never queried
    });

    it('returns the job and its applicants with an ISO applied_at date (200 OK)', async () => {
        const token = createToken();
        db.query
            .mockResolvedValueOnce([[{ id: 5, title: 'Developer' }]])
            .mockResolvedValueOnce([[storedApplication]]);

        const res = await request(app)
            .get('/api/candidates/job/5')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.job).toEqual({ id: 5, title: 'Developer' });
        expect(res.body.applications).toHaveLength(1);
        expect(res.body.applications[0]).toMatchObject({
            id: 12, full_name: 'Sam Seeker', email: 'sam@example.com', status: 'applied',
            applied_at: '2026-10-26T01:00:00.000Z'
        });
    });

    it('returns an empty list when nobody has applied', async () => {
        const token = createToken();
        db.query.mockResolvedValueOnce([[{ id: 5, title: 'Developer' }]]).mockResolvedValueOnce([[]]);

        const res = await request(app)
            .get('/api/candidates/job/5')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.applications).toEqual([]);
    });

    it('returns 500 when the database fails', async () => {
        const token = createToken();
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        db.query.mockRejectedValueOnce(new Error('DB down'));

        const res = await request(app)
            .get('/api/candidates/job/5')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
        spy.mockRestore();
    });
});

// ----------------------------------------------------------------------
// PATCH /api/candidates/:id/status
// ----------------------------------------------------------------------
describe('PATCH /api/candidates/:id/status', () => {
    const patch = (status, token = createToken(), id = '12') =>
        request(app)
            .patch(`/api/candidates/${id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status });

    const countsRow = { total: 2, awaiting: 1, reviewed: 0, contacting: 0, hired: 1 };

    it('returns 401 when no token is sent', async () => {
        const res = await request(app).patch('/api/candidates/12/status').send({ status: 'offered' });

        expect(res.statusCode).toBe(401);
        expect(db.getConnection).not.toHaveBeenCalled();
    });

    it('returns 403 for a job_seeker token', async () => {
        const res = await patch('offered', createToken({ role: 'job_seeker', company_id: null }));

        expect(res.statusCode).toBe(403);
        expect(db.getConnection).not.toHaveBeenCalled();
    });

    it('returns 400 for an invalid status and never opens a connection', async () => {
        const res = await patch('hired');   // not one of the allowed statuses

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid application status/i);
        expect(db.getConnection).not.toHaveBeenCalled();
    });

    it('returns 404 when the application belongs to another company', async () => {
        connection.query.mockResolvedValueOnce([[]]);

        const res = await patch('offered');

        expect(res.statusCode).toBe(404);
        expect(connection.rollback).toHaveBeenCalledTimes(1);
        expect(connection.commit).not.toHaveBeenCalled();
        expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('looks the application up by BOTH the id and the company_id from the token', async () => {
        connection.query.mockResolvedValueOnce([[]]);

        await patch('offered', createToken({ company_id: 7 }));

        expect(connection.query.mock.calls[0][1]).toEqual(['12', 7]);
    });

    it('does not close the job while openings remain', async () => {
        connection.query
            .mockResolvedValueOnce([[{ job_id: 5 }]])          // find application
            .mockResolvedValueOnce([[{ openings: 2 }]])        // lock job
            .mockResolvedValueOnce([{ affectedRows: 1 }])      // update status
            .mockResolvedValueOnce([[{ n: 1 }]])               // count offered
            .mockResolvedValueOnce([[countsRow]])              // recount
            .mockResolvedValueOnce([{ affectedRows: 1 }]);     // update job counts

        const res = await patch('offered');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'offered', job_closed: false, auto_rejected: 0 });
        expect(connection.query.mock.calls.some(([sql]) => sql.includes("'closed'"))).toBe(false);
        expect(connection.commit).toHaveBeenCalledTimes(1);
        expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('closes the job and rejects the other pending applications when openings are filled', async () => {
        connection.query
            .mockResolvedValueOnce([[{ job_id: 5 }]])          // find application
            .mockResolvedValueOnce([[{ openings: 1 }]])        // lock job
            .mockResolvedValueOnce([{ affectedRows: 1 }])      // update status
            .mockResolvedValueOnce([[{ n: 1 }]])               // count offered (1 >= 1)
            .mockResolvedValueOnce([{ affectedRows: 2 }])      // reject the others
            .mockResolvedValueOnce([{ affectedRows: 1 }])      // close the job
            .mockResolvedValueOnce([[countsRow]])              // recount
            .mockResolvedValueOnce([{ affectedRows: 1 }]);     // update job counts

        const res = await patch('offered');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'offered', job_closed: true, auto_rejected: 2 });

        const sqls = connection.query.mock.calls.map(([sql]) => sql);
        expect(sqls.some(sql => sql.includes("SET status = 'rejected'") && sql.includes("NOT IN ('offered', 'rejected')"))).toBe(true);
        expect(sqls.some(sql => sql.includes("UPDATE jobs SET status = 'closed'"))).toBe(true);
        expect(connection.commit).toHaveBeenCalledTimes(1);
    });

    it('does not check openings when the new status is not "offered"', async () => {
        connection.query
            .mockResolvedValueOnce([[{ job_id: 5 }]])          // find application
            .mockResolvedValueOnce([[{ openings: 1 }]])        // lock job
            .mockResolvedValueOnce([{ affectedRows: 1 }])      // update status
            .mockResolvedValueOnce([[countsRow]])              // recount
            .mockResolvedValueOnce([{ affectedRows: 1 }]);     // update job counts

        const res = await patch('interview');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'interview', job_closed: false, auto_rejected: 0 });
        expect(connection.query.mock.calls.some(([sql]) => sql.includes('COUNT(*) AS n'))).toBe(false);
    });

    it('rolls back and returns 500 when a query fails mid-transaction', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        connection.query
            .mockResolvedValueOnce([[{ job_id: 5 }]])
            .mockResolvedValueOnce([[{ openings: 1 }]])
            .mockRejectedValueOnce(new Error('DB down'));

        const res = await patch('offered');

        expect(res.statusCode).toBe(500);
        expect(connection.rollback).toHaveBeenCalledTimes(1);
        expect(connection.commit).not.toHaveBeenCalled();
        expect(connection.release).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});
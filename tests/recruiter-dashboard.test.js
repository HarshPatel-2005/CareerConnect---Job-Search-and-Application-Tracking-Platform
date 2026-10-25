// Set the secret BEFORE the app is loaded, so the app and this test
// always sign and verify with the same value.
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/api/app');

jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

const db = require('../src/config/db');
const JWT_SECRET = process.env.JWT_SECRET;

function createRecruiterToken(userId = 1, companyId = 7, options = {}) {
    return jwt.sign(
        { id: userId, email: 'recruiter@example.com', role: 'recruiter', company_id: companyId },
        options.secret || JWT_SECRET,
        { expiresIn: options.expiresIn || '1h' }
    );
}

const sampleJobs = [
    {
        id: 10, title: 'Backend Developer', location: 'Montreal', status: 'open',
        created_at: '2026-10-01T12:00:00.000Z',
        candidates_count: 5, awaiting_count: 2, reviewed_count: 1,
        contacting_count: 1, hired_count: 1
    },
    {
        id: 11, title: 'QA Intern', location: 'Toronto', status: 'paused',
        created_at: '2026-09-15T12:00:00.000Z',
        candidates_count: 0, awaiting_count: 0, reviewed_count: 0,
        contacting_count: 0, hired_count: 0
    }
];

describe('GET /api/recruiter/jobs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('authentication', () => {
        it('returns 401 when no Authorization header is sent', async () => {
            const res = await request(app).get('/api/recruiter/jobs');

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toMatch(/no token provided/i);
            expect(db.query).not.toHaveBeenCalled();
        });

        it('returns 401 when the header has no token after "Bearer"', async () => {
            const res = await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', 'Bearer');

            expect(res.statusCode).toBe(401);
            expect(db.query).not.toHaveBeenCalled();
        });

        it('returns 401 when the token is sent without the "Bearer " prefix', async () => {
            const token = createRecruiterToken(1, 7);

            const res = await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', token); // raw token, no prefix

            expect(res.statusCode).toBe(401);
            expect(db.query).not.toHaveBeenCalled();
        });

        it('returns 403 for a token signed with the wrong secret', async () => {
            const token = createRecruiterToken(1, 7, { secret: 'wrong_secret' });

            const res = await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toMatch(/invalid or expired/i);
            expect(db.query).not.toHaveBeenCalled();
        });

        it('returns 403 for an expired token', async () => {
            const token = createRecruiterToken(1, 7, { expiresIn: '-1s' });

            const res = await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
            expect(db.query).not.toHaveBeenCalled();
        });

        it('returns 403 for a garbage token string', async () => {
            const res = await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', 'Bearer not.a.real.token');

            expect(res.statusCode).toBe(403);
            expect(db.query).not.toHaveBeenCalled();
        });
    });

    describe('fetching jobs', () => {
        it('returns the jobs for the recruiter company (200 OK)', async () => {
            const token = createRecruiterToken(1, 7);
            db.query.mockResolvedValueOnce([sampleJobs]);

            const res = await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(sampleJobs);
        });

        it('queries the database with the company_id from the token', async () => {
            const token = createRecruiterToken(1, 7);
            db.query.mockResolvedValueOnce([[]]);

            await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE company_id = ?'),
                [7]
            );
        });

        it('returns an empty array when the company has no jobs', async () => {
            const token = createRecruiterToken(1, 7);
            db.query.mockResolvedValueOnce([[]]);

            const res = await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('returns 500 when the database fails', async () => {
            const token = createRecruiterToken(1, 7);
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
            db.query.mockRejectedValueOnce(new Error('DB down'));

            const res = await request(app)
                .get('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            spy.mockRestore();
        });
    });
});
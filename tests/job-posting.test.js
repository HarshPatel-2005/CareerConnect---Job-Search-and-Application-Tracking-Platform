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

// Builds a signed token. Pass overrides to change the role or drop company_id.
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

// A form body that passes every validation rule.
const validBody = {
    title: 'Backend Developer',
    location: 'Montreal',
    openings: 3,
    country: 'Canada',
    language: 'English',
    job_type: 'co_op',
    description: 'Build APIs.'
};

const savedJob = {
    id: 5,
    title: 'Backend Developer',
    location: 'Montreal',
    openings: 3,
    country: 'Canada',
    language: 'English',
    job_type: 'co_op',
    description: 'Build APIs.'
};

describe('Job posting routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ------------------------------------------------------------------
    // Middleware: every route is behind authenticateToken
    // ------------------------------------------------------------------
    describe('authentication (all three routes)', () => {
        const routes = [
            ['POST', 'post', '/api/recruiter/jobs'],
            ['GET', 'get', '/api/recruiter/jobs/5'],
            ['PUT', 'put', '/api/recruiter/jobs/5']
        ];

        it.each(routes)('%s returns 401 when no token is sent', async (label, method, url) => {
            const res = await request(app)[method](url).send(validBody);

            expect(res.statusCode).toBe(401);
            expect(db.query).not.toHaveBeenCalled();
        });

        it.each(routes)('%s returns 403 for a token with the wrong secret', async (label, method, url) => {
            const token = createToken({}, { secret: 'wrong_secret' });

            const res = await request(app)[method](url)
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(403);
            expect(db.query).not.toHaveBeenCalled();
        });

        it.each(routes)('%s returns 403 for an expired token', async (label, method, url) => {
            const token = createToken({}, { expiresIn: '-1s' });

            const res = await request(app)[method](url)
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(403);
            expect(db.query).not.toHaveBeenCalled();
        });
    });

    // ------------------------------------------------------------------
    // Controller guard: getCompanyId() (recruiter role + company_id)
    // ------------------------------------------------------------------
    describe('recruiter-only guard (all three routes)', () => {
        const routes = [
            ['POST', 'post', '/api/recruiter/jobs'],
            ['GET', 'get', '/api/recruiter/jobs/5'],
            ['PUT', 'put', '/api/recruiter/jobs/5']
        ];

        it.each(routes)('%s returns 403 for a job_seeker token', async (label, method, url) => {
            const token = createToken({ role: 'job_seeker', company_id: null });

            const res = await request(app)[method](url)
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toMatch(/recruiter account required/i);
            expect(db.query).not.toHaveBeenCalled();
        });

        it.each(routes)('%s returns 403 for a recruiter with no company_id', async (label, method, url) => {
            const token = createToken({ company_id: undefined });

            const res = await request(app)[method](url)
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toMatch(/recruiter account required/i);
            expect(db.query).not.toHaveBeenCalled();
        });
    });

    // ------------------------------------------------------------------
    // GET /api/recruiter/jobs/:id
    // ------------------------------------------------------------------
    describe('GET /api/recruiter/jobs/:id', () => {
        it('returns the job (200 OK)', async () => {
            const token = createToken();
            db.query.mockResolvedValueOnce([[savedJob]]);

            const res = await request(app)
                .get('/api/recruiter/jobs/5')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(savedJob);
        });

        it('looks the job up by BOTH the id and the company_id from the token', async () => {
            const token = createToken({ company_id: 7 });
            db.query.mockResolvedValueOnce([[savedJob]]);

            await request(app)
                .get('/api/recruiter/jobs/5')
                .set('Authorization', `Bearer ${token}`);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE id = ? AND company_id = ?'),
                ['5', 7]   // URL params are strings
            );
        });

        it('returns 404 when no row matches (missing job, or another company)', async () => {
            const token = createToken();
            db.query.mockResolvedValueOnce([[]]);

            const res = await request(app)
                .get('/api/recruiter/jobs/999')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({ error: 'Job not found' });
        });

        it('returns 500 when the database fails', async () => {
            const token = createToken();
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
            db.query.mockRejectedValueOnce(new Error('DB down'));

            const res = await request(app)
                .get('/api/recruiter/jobs/5')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            spy.mockRestore();
        });
    });

    // ------------------------------------------------------------------
    // POST /api/recruiter/jobs
    // ------------------------------------------------------------------
    describe('POST /api/recruiter/jobs', () => {
        it('creates the job and returns its new id (201 Created)', async () => {
            const token = createToken();
            db.query.mockResolvedValueOnce([{ insertId: 99 }]);

            const res = await request(app)
                .post('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(201);
            expect(res.body).toEqual({ id: 99 });
        });

        it('inserts the company_id from the token, then the fields in column order', async () => {
            const token = createToken({ company_id: 7 });
            db.query.mockResolvedValueOnce([{ insertId: 99 }]);

            await request(app)
                .post('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO jobs'),
                [7, 'Backend Developer', 'Montreal', 3, 'Canada', 'English', 'co_op', 'Build APIs.']
            );
        });

        it('ignores a company_id sent in the body (cannot post for another company)', async () => {
            const token = createToken({ company_id: 7 });
            db.query.mockResolvedValueOnce([{ insertId: 99 }]);

            await request(app)
                .post('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...validBody, company_id: 999 });

            const params = db.query.mock.calls[0][1];
            expect(params[0]).toBe(7);
            expect(params).not.toContain(999);
        });

        it('trims text, turns the openings string into a number, and saves an empty description as null', async () => {
            const token = createToken();
            db.query.mockResolvedValueOnce([{ insertId: 99 }]);

            await request(app)
                .post('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...validBody,
                    title: '  Backend Developer  ',
                    location: '  Montreal ',
                    openings: '3',          // the form sends a string
                    description: '   '
                });

            expect(db.query).toHaveBeenCalledWith(
                expect.any(String),
                [7, 'Backend Developer', 'Montreal', 3, 'Canada', 'English', 'co_op', null]
            );
        });

        it.each([
            ['title is missing',        { title: '' },            /title and location/i],
            ['title is only spaces',    { title: '   ' },         /title and location/i],
            ['location is missing',     { location: '' },         /title and location/i],
            ['openings is 0',           { openings: 0 },          /openings must be at least 1/i],
            ['openings is not a number',{ openings: 'abc' },      /openings must be at least 1/i],
            ['country is missing',      { country: '' },          /country and language/i],
            ['language is missing',     { language: '' },         /country and language/i],
            ['job_type is not allowed', { job_type: 'freelance' },/invalid job type/i],
            ['job_type is missing',     { job_type: undefined },  /invalid job type/i]
        ])('returns 400 when %s', async (label, change, message) => {
            const token = createToken();

            const res = await request(app)
                .post('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...validBody, ...change });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(message);
            expect(db.query).not.toHaveBeenCalled();
        });

        it.each(['full_time', 'part_time', 'contract', 'temporary', 'internship', 'co_op'])(
            'accepts job_type "%s"',
            async (jobType) => {
                const token = createToken();
                db.query.mockResolvedValueOnce([{ insertId: 1 }]);

                const res = await request(app)
                    .post('/api/recruiter/jobs')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ ...validBody, job_type: jobType });

                expect(res.statusCode).toBe(201);
            }
        );

        it('returns 500 when the database fails', async () => {
            const token = createToken();
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
            db.query.mockRejectedValueOnce(new Error('DB down'));

            const res = await request(app)
                .post('/api/recruiter/jobs')
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            spy.mockRestore();
        });
    });

    // ------------------------------------------------------------------
    // PUT /api/recruiter/jobs/:id
    // ------------------------------------------------------------------
    describe('PUT /api/recruiter/jobs/:id', () => {
        it('updates the job (200 OK)', async () => {
            const token = createToken();
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .put('/api/recruiter/jobs/5')
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({ message: 'Job updated' });
        });

        it('sends the fields first, then the job id and company_id from the token', async () => {
            const token = createToken({ company_id: 7 });
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await request(app)
                .put('/api/recruiter/jobs/5')
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE id = ? AND company_id = ?'),
                ['Backend Developer', 'Montreal', 3, 'Canada', 'English', 'co_op', 'Build APIs.', '5', 7]
            );
        });

        it('returns 404 when nothing was updated (missing job, or another company)', async () => {
            const token = createToken();
            db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            const res = await request(app)
                .put('/api/recruiter/jobs/999')
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({ error: 'Job not found' });
        });

        it('returns 400 for invalid data and never touches the database', async () => {
            const token = createToken();

            const res = await request(app)
                .put('/api/recruiter/jobs/5')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...validBody, openings: 0 });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(/openings must be at least 1/i);
            expect(db.query).not.toHaveBeenCalled();
        });

        it('returns 500 when the database fails', async () => {
            const token = createToken();
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
            db.query.mockRejectedValueOnce(new Error('DB down'));

            const res = await request(app)
                .put('/api/recruiter/jobs/5')
                .set('Authorization', `Bearer ${token}`)
                .send(validBody);

            expect(res.statusCode).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            spy.mockRestore();
        });
    });
});
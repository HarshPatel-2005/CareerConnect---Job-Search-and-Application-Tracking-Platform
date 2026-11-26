process.env.JWT_SECRET = 'job-deadlines-test';
const request = require('supertest');
const jwt = require('jsonwebtoken');
jest.mock('../src/config/db', () => ({ query: jest.fn() }));
const app = require('../src/api/app');
const db = require('../src/config/db');
const authorization = `Bearer ${jwt.sign({ id: 1, role: 'recruiter', company_id: 7 }, process.env.JWT_SECRET)}`;
const validBody = { title: 'Developer', location: 'Montreal', openings: 1, country: 'Canada', language: 'English', job_type: 'full_time' };
beforeEach(() => jest.resetAllMocks());

test.each(['2028-02-29', '2026-11-30', '', null])('accepts an optional deadline %j', async deadline => {
    db.query.mockResolvedValueOnce([{ insertId: 99 }]);
    const res = await request(app).post('/api/recruiter/jobs')
        .set('Authorization', authorization).send({ ...validBody, deadline });
    expect(res.status).toBe(201);
    expect(db.query.mock.calls[0][1].at(-1)).toBe(deadline || null);
});

test.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '2026-11-30T00:00:00Z', 42, {}])(
    'rejects invalid deadlines on create and update: %j', async deadline => {
        for (const [method, url] of [['post', '/api/recruiter/jobs'], ['put', '/api/recruiter/jobs/5']]) {
            const res = await request(app)[method](url).set('Authorization', authorization).send({ ...validBody, deadline });
            expect(res.status).toBe(400);
        }
        expect(db.query).not.toHaveBeenCalled();
    }
);

test('allows a recruiter to change or clear a deadline', async () => {
    for (const deadline of ['2027-01-01', null]) {
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const res = await request(app).put('/api/recruiter/jobs/5')
            .set('Authorization', authorization).send({ ...validBody, deadline });
        expect(res.status).toBe(200);
        expect(db.query.mock.calls.at(-1)[1].slice(-3)).toEqual([deadline, '5', 7]);
    }
});

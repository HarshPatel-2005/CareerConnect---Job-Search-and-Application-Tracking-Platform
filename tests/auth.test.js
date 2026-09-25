const request = require('supertest');
const app = require('../src/api/app');


// Mock database pool so tests run without hitting the actual database
jest.mock('../src/config/db', () => {
    query: jest.fn()
});

const db = require('../src/config/db');

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new Job Seeker successfully (201 Created)', async () => {
        // Mock db check: Email does not exist
        db.query.mockResolvedValueOnce([[]]);
        // Mock db insert: Successful insertion
        db.query.mockResolvedValueOnce([{ insertId: 1 }]);

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                full_name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'Password123!',
                role: 'job_seeker'
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');
        expect(res.body).toHaveProperty('userId', 1);
    });

    it('should return 400 Bad Request for missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'missing_name@example.com',
                password: 'Password123!',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should return 409 Conflict if email already in use', async () => {
        // Mock db check: Email already exists
        db.query.mockResolvedValueOnce([[{ id: 99, email: 'john.doe@example.com' }]]);

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                full_name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'Password123!',
            });

        expect(res.statusCode).toBe(409);
        expect(res.body).toHaveProperty('error', 'Email already in use');
    });
})
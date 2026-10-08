const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/api/app');


// Mock database pool so tests run without hitting the actual database
jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

const db = require('../src/config/db');

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ======= General & Job Seeker Tests =======
    it('should register a new Job Seeker successfully and return a JWT token (201 Created)', async () => {
        db.query.mockResolvedValueOnce([[]]);               // Email check
        db.query.mockResolvedValueOnce([{ insertId: 1 }]);  // Insert user

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
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toEqual({
            id: 1,
            full_name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'job_seeker',
            company_id: null
        });
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
                role: 'job_seeker'
            });

        expect(res.statusCode).toBe(409);
        expect(res.body).toHaveProperty('error', 'Email already in use');
    });

    // ======= Recruiter Tests (Create Company) =======
    it('should register a Recruiter and issue JWT with company id and create a new company (201 Created)', async () => {
        db.query.mockResolvedValueOnce([[]]);               // Email check
        db.query.mockResolvedValueOnce([[]]);               // Company name check
        db.query.mockResolvedValueOnce([{ insertId: 10 }]); // Insert into company
        db.query.mockResolvedValueOnce([{ insertId: 2 }]);  // Insert into users

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                full_name: 'Alice Recruiter',
                email: 'alice@techcorp.com',
                password: 'Password123!',
                role: 'recruiter',
                company_name: 'TechCorp'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toEqual({
            id: 2,
            full_name: 'Alice Recruiter',
            email: 'alice@techcorp.com',
            role: 'recruiter',
            company_id: 10
        });
    });

    it('should return 409 if recruiter tries to create a company that already exists', async () => {
        db.query.mockResolvedValueOnce([[]]);                               // Mock db 1: Email check (empty)
        db.query.mockResolvedValueOnce([[{ id: 10, name: 'TechCorp' }]]);   // Mock db 2: Company exists

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                full_name: 'Alice Recruiter',
                email: 'alice2@techcorp.com',
                password: 'Password123!',
                role: 'recruiter',
                company_name: 'TechCorp'
            });

        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/Company already exists/i);
    });

    // ======= Recruiter Tests (Join Company) =======
    it('should register a Recruiter joining via invite code and issue JWT with company id (201 Created)', async () => {
        db.query.mockResolvedValueOnce([[]]);                   // Email check (empty)
        db.query.mockResolvedValueOnce([[{ company_id: 10 }]]); // Invite code is valid
        db.query.mockResolvedValueOnce([{ insertId: 3 }]);      // Insert user
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);  // Update invite to is_used = TRUE

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                full_name: 'Bob Recruiter',
                email: 'bob@techcorp.com',
                password: 'Password123!',
                role: 'recruiter',
                invite_code: 'VALID-CODE-123'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toEqual({
            id: 3,
            full_name: 'Bob Recruiter',
            email: 'bob@techcorp.com',
            role: 'recruiter',
            company_id: 10
        });
    });

    it('should return 400 if recruiter uses an invalid or used invite code', async () => {
        db.query.mockResolvedValueOnce([[]]); // Mock 1: Email check (empty)
        db.query.mockResolvedValueOnce([[]]); // Mock 2: Invite code not found or already used

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                full_name: 'Mallory',
                email: 'mallory@techcorp.com',
                password: 'Password123!',
                role: 'recruiter',
                invite_code: 'INVALID-CODE'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/Invalid invite code/i);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should authenticate user with valid credentials and return a JWT (200 OK)', async () => {
        const hashedPassword = await bcrypt.hash('Password123!', 10);
        const mockUser = {
            id: 1,
            full_name: 'John Doe',
            email: 'john.doe@example.com',
            password_hash: hashedPassword,
            role: 'job_seeker',
            company_id: null
        };

        db.query.mockResolvedValueOnce([[mockUser]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'john.doe@example.com',
                password: 'Password123!'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Login successful');
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
        expect(res.body.user.id).toBe(mockUser.id);
    });

    it('should return 401 Unauthorized if user email does not exist', async () => {
        db.query.mockResolvedValueOnce([[]]); // Mock db: No user found

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'Password123!'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should return 400 Bad Request if email or password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'john@example.com' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});
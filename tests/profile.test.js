const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../src/api/app');

jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

const db = require('../src/config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

function createToken(userId, email = 'user@example.com', role = 'job_seeker') {
    return jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

describe('Profile Endpoints & JWT Security', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/profile/:id', () => {
        it('should return 401 Unauthorized if no Bearer token is provided', async () => {
            const res = await request(app).get('/api/profile/1');
            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 403 Forbidden if user attempts to view another user profile', async () => {
            const token = createToken(1); // User ID = 1

            const res = await request(app)
                .get('/api/profile/2') // Accessing User ID = 2
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toMatch(/only access your own profile/i);
        });

        it('should return profile data for authenticated owner (200 OK)', async () => {
            const token = createToken(1);
            db.query.mockResolvedValueOnce([[{
                id: 1,
                full_name: 'John Doe',
                email: 'user@example.com',
                role: 'job_seeker',
                company_id: null
            }]]);

            const res = await request(app)
                .get('/api/profile/1')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                id: 1,
                full_name: 'John Doe',
                email: 'user@example.com',
                role: 'job_seeker',
                company_id: null
            });
        });
    });

    describe('PUT /api/profile/:id', () => {
        it('should return 403 Forbidden if attempting to update another user profile', async () => {
            const token = createToken(1);

            const res = await request(app)
                .put('/api/profile/2')
                .set('Authorization', `Bearer ${token}`)
                .send({ full_name: 'Hacker Name' });

            expect(res.statusCode).toBe(403);
        });

        it('should update profile info successfully for owner (200 OK)', async () => {
            const token = createToken(1);
            db.query.mockResolvedValueOnce([[{ id: 1 }]]); // Existing user check
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update query

            const res = await request(app)
                .put('/api/profile/1')
                .set('Authorization', `Bearer ${token}`)
                .send({ full_name: 'John Updated' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Profile updated successfully');
        });
    });

    describe('PUT /api/profile/:id/password', () => {
        it('should update password when current password matches', async () => {
            const token = createToken(1);
            const currentHash = await bcrypt.hash('OldPassword123!', 10);

            db.query.mockResolvedValueOnce([[{ password_hash: currentHash }]]); // Password lookup
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Password update

            const res = await request(app)
                .put('/api/profile/1/password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    current_password: 'OldPassword123!',
                    new_password: 'NewPassword123!',
                    confirm_password: 'NewPassword123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Password updated successfully');
        });

        it('should return 401 Unauthorized if current password is incorrect', async () => {
            const token = createToken(1);
            const currentHash = await bcrypt.hash('CorrectPassword!', 10);

            db.query.mockResolvedValueOnce([[{ password_hash: currentHash }]]);

            const res = await request(app)
                .put('/api/profile/1/password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    current_password: 'WrongPassword!',
                    new_password: 'NewPassword123!',
                    confirm_password: 'NewPassword123!'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toMatch(/Current password is incorrect/i);
        });
    });
});
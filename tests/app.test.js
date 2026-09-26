const request = require('supertest');
const app = require('../src/api/app');

describe('GET /health', () => {
    it('should return 200 OK with status and uptime', async () => {
        const res = await request(app).get('/health');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(typeof res.body.uptime).toBe('number');
    });
});

describe('feature pages', () => {
    it('serves a home page linking registration and resume management', async () => {
        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('/register.html');
        expect(res.text).toContain('/resumes.html');
    });

    it.each(['/register.html', '/resumes.html'])('serves %s', async (page) => {
        const res = await request(app).get(page);
        expect(res.statusCode).toBe(200);
    });
});

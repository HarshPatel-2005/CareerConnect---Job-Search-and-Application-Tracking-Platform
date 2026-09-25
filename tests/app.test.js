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
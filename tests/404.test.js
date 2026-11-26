const request = require('supertest');
const { createApp } = require('../src/api/app');

describe('404 handling in the app', () => {
    let app;

    beforeAll(() => {
        app = createApp();
    });

    describe('unknown non-API paths (content negotiation)', () => {
        test('returns the HTML 404 page for browsers', async () => {
            const res = await request(app)
                .get('/DOES_NOT_EXIST')
                .set('Accept', 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8');
            
            expect(res.status).toBe(404);
            expect(res.headers['content-type']).toMatch(/text\/html/);
        });

        test('returns JSON 404 for API requests', async () => {
            const res = await request(app)
                .get('/api/DOES_NOT_EXIST')
                .set('Accept', 'application/json');
            
            expect(res.status).toBe(404);
            expect(res.headers['content-type']).toMatch(/application\/json/);
        });

        test('returns plain text 404 for other requests', async () => {
            const res = await request(app)
                .get('/DOES_NOT_EXIST')
                .set('Accept', 'text/plain');
            
            expect(res.status).toBe(404);
            expect(res.headers['content-type']).toMatch(/text\/plain/);
        });

        test('returns 404 for non-GET methods too', async () => {
            const res = await request(app)
                .post('/DOES_NOT_EXIST')
                .set('Accept', 'application/json')
                .send({ some: 'data' });
            
            expect(res.status).toBe(404);
        });

        test('returns 404 for missing static assets', async () => {
            const res = await request(app).get('/missing-stylesheet.css');
            expect(res.status).toBe(404);
        });
    });
});
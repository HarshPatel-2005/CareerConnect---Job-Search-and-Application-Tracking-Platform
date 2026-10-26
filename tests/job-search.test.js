
const request = require('supertest');
const app = require('../src/api/app');

// Mock database so tests do not change real data
jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

const db = require('../src/config/db');

const sampleJob = {
    id: 1,
    title: 'Software Developer Intern',
    company_name: 'CareerConnect Demo Company',
    location: 'Montreal',
    country: 'Canada',
    language: 'English',
    job_type: 'internship',
    description: 'Help develop and test web applications.',
    openings: 2
};

describe('Job Search - GET /api/jobs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // AT-06.1: Matching jobs
    test('returns available jobs when no filters are provided', async () => {
        db.query.mockResolvedValueOnce([[sampleJob]]);

        const response = await request(app).get('/api/jobs');

        expect(response.statusCode).toBe(200);
        expect(response.body.jobs).toEqual([sampleJob]);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("jobs.status = 'open'"),
            []
        );
    });

    test('searches jobs by keyword', async () => {
        db.query.mockResolvedValueOnce([[sampleJob]]);

        const response = await request(app)
            .get('/api/jobs')
            .query({ search: 'Software' });

        expect(response.statusCode).toBe(200);
        expect(response.body.jobs).toEqual([sampleJob]);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('jobs.title LIKE ?'),
            ['%Software%', '%Software%', '%Software%']
        );
    });

    test('filters jobs by location', async () => {
        db.query.mockResolvedValueOnce([[sampleJob]]);

        const response = await request(app)
            .get('/api/jobs')
            .query({ location: 'Montreal' });

        expect(response.statusCode).toBe(200);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('jobs.location LIKE ?'),
            ['%Montreal%']
        );
    });

    test('filters jobs by job type', async () => {
        db.query.mockResolvedValueOnce([[sampleJob]]);

        const response = await request(app)
            .get('/api/jobs')
            .query({ job_type: 'internship' });

        expect(response.statusCode).toBe(200);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('jobs.job_type = ?'),
            ['internship']
        );
    });

    test('combines keyword, location and job type filters', async () => {
        db.query.mockResolvedValueOnce([[sampleJob]]);

        const response = await request(app)
            .get('/api/jobs')
            .query({
                search: 'Software',
                location: 'Montreal',
                job_type: 'internship'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.jobs).toHaveLength(1);

        expect(db.query).toHaveBeenCalledWith(
            expect.any(String),
            [
                '%Software%',
                '%Software%',
                '%Software%',
                '%Montreal%',
                'internship'
            ]
        );
    });

    // AT-06.2: No matching jobs
    test('returns an empty list when no jobs match', async () => {
        db.query.mockResolvedValueOnce([[]]);

        const response = await request(app)
            .get('/api/jobs')
            .query({
                search: 'Nurse',
                location: 'Montreal'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ jobs: [] });

        expect(db.query).toHaveBeenCalledWith(
            expect.any(String),
            ['%Nurse%', '%Nurse%', '%Nurse%', '%Montreal%']
        );
    });

    test('returns an empty list when the job type does not match', async () => {
        db.query.mockResolvedValueOnce([[]]);

        const response = await request(app)
            .get('/api/jobs')
            .query({ job_type: 'full_time' });

        expect(response.statusCode).toBe(200);
        expect(response.body.jobs).toEqual([]);
    });

    // Error handling
    test('returns 500 when the database fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error')
            .mockImplementation(() => {});

        try {
            db.query.mockRejectedValueOnce(
                new Error('Database unavailable')
            );

            const response = await request(app).get('/api/jobs');

            expect(response.statusCode).toBe(500);
            expect(response.body).toEqual({
                error: 'Unable to search jobs'
            });
        } finally {
            consoleSpy.mockRestore();
        }
    });
});

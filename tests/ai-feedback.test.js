process.env.JWT_SECRET = 'ai-feedback-test-secret';

// Mock the AI service to avoid real API calls during tests
jest.mock('../src/api/services/aiResumeService', () => ({
    parseResumeWithAI: jest.fn(),
    generateJobFeedback: jest.fn()
}));

const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/api/app');
const aiService = require('../src/api/services/aiResumeService');

const resumeId = 'ee7470ab-89ad-4076-887d-31a658632f81';

const mockAIResponse = {
    strengths: [
        'Strong alignment with Node.js (advanced) and relational database experience from Tech Corp.',
    ],
    missing_skills: [
        'React (frontend framework required by posting)',
        'Docker (containerization listed in requirements)'
    ],
    suggestions: [
        'Quantify API latency or throughput improvements in your Tech Corp Software Engineer role.',
        'Highlight any frontend or containerized deployment exposure if applicable.'
    ]
};

let directory, app, db;

const token = (overrides = {}) => jwt.sign({ id: 1, role: 'job_seeker', ...overrides }, process.env.JWT_SECRET);

const NO_BODY = Symbol('no body');
const postFeedback = ({ body = { resume_id: resumeId }, bearer = token(), id = '5' } = {}) => {
    const req = request(app).post(`/api/jobs/${id}/feedback`);
    if (bearer !== null) req.set('Authorization', `Bearer ${bearer}`);
    return body === NO_BODY ? req : req.send(body);
};


beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'careerconnect-ai-feedback-'));

    db = {
        query: jest.fn(),
        getConnection: jest.fn()
    };

    aiService.generateJobFeedback.mockReset().mockResolvedValue(mockAIResponse);

    app = createApp({
        resume: { 
            uploadDir: directory,
            store: { get: jest.fn(), list: jest.fn(), create: jest.fn(), replace: jest.fn(), delete: jest.fn(), close: jest.fn() } 
        },
        applications: { db },
    });
});


afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
});

describe('POST /api/jobs/:id/feedback', () => {
    // Auth & role guards
    test('requires authentication', async () => {
        const unauth = await postFeedback({ bearer: null });
        expect(unauth.status).toBe(401);

        const badToken = await postFeedback({ bearer: 'invalid' });
        expect(badToken.status).toBe(403);

        expect(db.query).not.toHaveBeenCalled();
        expect(aiService.generateJobFeedback).not.toHaveBeenCalled();
    });

    test('blocks recruiter accounts from generating applicant feedback', async () => {
        const res = await postFeedback({ bearer: token({ role: 'recruiter' }) });
        expect(res.status).toBe(403);
        expect(db.query).not.toHaveBeenCalled();
        expect(aiService.generateJobFeedback).not.toHaveBeenCalled();
    });

    test.each(['0', '-1', '1abc', '9007199254740992'])('rejects invalid job ID %s', async (invalidId) => {
        const res = await postFeedback({ id: invalidId });
        expect(res.status).toBe(400);
        expect(aiService.generateJobFeedback).not.toHaveBeenCalled();
    });

    // Request body validation
    test('returns 400 when the request has no body at all', async () => {
        const res = await postFeedback({ body: NO_BODY });
        expect(res.status).toBe(400);
        expect(aiService.generateJobFeedback).not.toHaveBeenCalled();
    });

    test.each([
        ['missing', {}],
        ['an empty string', { resume_id: '' }],
        ['null', { resume_id: null }],
        ['a number', { resume_id: 123 }],
        ['not a UUID', { resume_id: 'not-a-uuid' }]
    ])('returns 400 when resume_id is %s', async (_label, body) => {
        const res = await postFeedback({ body });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(aiService.generateJobFeedback).not.toHaveBeenCalled();
    });

    // Preconditions (the service signals these by throwing; the controller maps them to HTTP statuses)
    test.each([
        ['JOB_NOT_FOUND', 404],
        ['JOB_NOT_OPEN', 409],            // paused or closed postings
        ['RESUME_NOT_FOUND', 404],        // missing, or owned by another user
        ['RESUME_FILE_MISSING', 409],
    ])('maps service error %s to %i', async (code, status) => {
        aiService.generateJobFeedback.mockRejectedValueOnce(new Error(code));

        const res = await postFeedback();
        expect(res.status).toBe(status);
        expect(res.body).toHaveProperty('error');
    });

    // AI feedback generation
    test('passes the job, user, resume and dependencies to the service and returns its feedback', async () => {
        const res = await postFeedback({ id: '5' });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(mockAIResponse);
        expect(res.body.disclaimer).toBe('AI-Generated Content');

        expect(aiService.generateJobFeedback).toHaveBeenCalledTimes(1);
        expect(aiService.generateJobFeedback).toHaveBeenCalledWith({
            jobId: '5',
            userId: 1,
            resumeId,
            store: expect.anything(),
            uploadDir: expect.any(String),
            db
        });
    });

    test('accepts tokens that carry the user id as userId instead of id', async () => {
        const bearer = jwt.sign({ userId: 7, role: 'job_seeker' }, process.env.JWT_SECRET);

        const res = await postFeedback({ bearer });
        expect(res.status).toBe(200);
        expect(aiService.generateJobFeedback).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
    });

    test.each([
        'AI service timeout',
        'Headers Timeout Error',
        'The request timed out'
    ])('maps "%s" to 504 Gateway Timeout', async (message) => {
        aiService.generateJobFeedback.mockRejectedValueOnce(new Error(message));

        const res = await postFeedback();
        expect(res.status).toBe(504);
        expect(res.body).toHaveProperty('error');
    });

    describe('unexpected failures', () => {
        let consoleError;
        beforeEach(() => { consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}); });
        afterEach(() => { consoleError.mockRestore(); });

        test('maps generic AI failures to 500 without leaking internal details', async () => {
            aiService.generateJobFeedback.mockRejectedValueOnce(new Error('AI connection refused at 127.0.0.1:11434'));

            const res = await postFeedback();
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(consoleError).toHaveBeenCalled();
        });

        test('maps rejections that are not Error objects to 500', async () => {
            aiService.generateJobFeedback.mockRejectedValueOnce(undefined);

            const res = await postFeedback();
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
        });
    });
});

// required_skills is a JSON column: mysql2 hands back an array, other drivers a string.
describe('parseRequiredSkills', () => {
    const { parseRequiredSkills } = jest.requireActual('../src/api/services/aiResumeService');

    test.each([
        ['an already-parsed array (mysql2 JSON column)', ['Node.js', ' React ', '', 42]],
        ['a JSON string', '["Node.js"," React ","",42]']
    ])('returns the cleaned skill list when stored as %s', (_label, raw) => {
        expect(parseRequiredSkills(raw)).toEqual(['Node.js', 'React']);
    });

    test.each([[null], [undefined], [''], ['[]'], [[]], ['not json'], ['{"a":1}']])(
        'returns [] when nothing usable is stored (%p)', (raw) => {
            expect(parseRequiredSkills(raw)).toEqual([]);
        });
});

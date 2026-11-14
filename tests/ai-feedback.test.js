process.env.JWT_SECRET = 'ai-feedback-test-secret';
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/api/app');

const resumeId = 'ee7470ab-89ad-4076-887d-31a658632f81';
const pdf = Buffer.from('%PDF-1.7\nSample resume for AI feedback');
let directory, store, app, connection, db, aiServiceMock;

const token = (overrides = {}) => jwt.sign({ id: 1, role: 'job_seeker', ...overrides }, process.env.JWT_SECRET);
const getFeedback = (body = { resume_id: resumeId }, bearer = token(), id = '5') => request(app)
    .post(`/api/jobs/${id}/feedback`)
    .set('Authorization', `Bearer ${bearer}`).send(body);

const mockParsedProfile = {
    id: resumeId,
    user_id: '1',
    original_name: 'CV.pdf',
    parsed_content: {
        skills: [
            { name: 'Node.js', proficiency: 'advanced' },
            { name: 'React', proficiency: 'intermediate' }
        ],
        job_history: [
            {
                company_name: 'Tech Corp',
                title: 'Software Engineer',
                start_date: '2023-01',
                end_date: null,
                is_current: true,
                details: 'Build REST APIs and optimized database queries.'
            }
        ]
    }
};

const mockJobPosting = {
    id: 5,
    status: 'open',
    title: 'Senior Full-Stack Engineer',
    description: 'Looking for an engineer experienced in Node.js, React, and Docker',
    required_skills: JSON.stringify(['Node.js', 'React', 'Docker'])
};

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

beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'careerconnect-ai-feedback-'));

    store = {
        get: jest.fn().mockImplementation(async (id, userId) => String(userId) === '1' ? {
            id: resumeId,
            user_id: '1',
            original_name: 'CV.pdf',
            stored_name: 'stored.pdf',
            mime_type: 'application/pdf',
            size_bytes: pdf.length,
            created_at: '2026-10-26',
            updated_at: '2026-10-26',
        } : null),
        create: jest.fn().mockResolvedValue(),
        list: jest.fn().mockResolvedValue([]),
        replace: jest.fn().mockResolvedValue(),
        delete: jest.fn().mockResolvedValue(true),
        close: jest.fn()
    };

    fs.writeFileSync(path.join(directory, 'stored.pdf'), pdf);

    connection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn(),
        query: jest.fn()
    };

    db = {
        query: jest.fn(),
        getConnection: jest.fn().mockResolvedValue(connection)
    };

    aiServiceMock = {
        generateJobFeedback: jest.fn().mockResolvedValue(mockAIResponse)
    };

    app = createApp({
        resume: { store, uploadDir: directory },
        applications: { db },
        aiService: aiServiceMock,
        profileService: {
            getParsedProfile: jest.fn().mockResolvedValue(mockParsedProfile)
        }
    });
});

afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
    jest.clearAllMocks();
});

function successfulJobQuery() {
    connection.query.mockResolvedValueOnce([[mockJobPosting]]);
}

describe('POST /api/jobs/:id/feedback', () => {
    // Auth & Role Guards
    test('requires authentication', async () => {
        const unauth = await request(app).post('/api/jobs/5/feedback').send({});
        expect (unauth.status).toBe(401);

        const badToken = await getFeedback('5', 'invalid');
        expect(badToken.status).toBe(403);
        expect(db.query).not.toHaveBeenCalled();
        expect(aiServiceMock.generateJobFeedback).not.toHaveBeenCalled();
    });

    test('blocks recruiter accounts from generating applicant feedback', async () => {
        const res = await getFeedback('5', token({ role: 'recruiter' }));
        expect(res.status).toBe(403);
        expect(db.query).not.toHaveBeenCalled();
        expect(aiServiceMock.generateJobFeedback).not.toHaveBeenCalled();
    });

    test.each(['0', '-1', '1abc', '9007199254740992'])(
        'rejects invalid job ID %s', 
        async (invalidId) => {
            const res = await getFeedback(invalidId);
            expect(res.status).toBe(400);
            expect(aiServiceMock.generateJobFeedback).not.toHaveBeenCalled();
        }
    );

    // Precondition Checks (Job existence, active status)
    test('returns 404 when the job posting does not exist', async () => {
        db.query.mockResolvedValueOnce([[]]); // No job found

        const res = await getFeedback('999');
        expect(res.status).toBe(404);
        expect(aiServiceMock.generateJobFeedback).not.toHaveBeenCalled();
    });

    test.each(['paused', 'closed'])(
        'rejects feedback requests for %s job postings',
        async (status) => {
            db.query.mockResolvedValueOnce([[{ ...mockJobPosting, status }]]); // Job found but not open

            const res = await getFeedback('5');
            expect(res.status).toBe(409);
            expect(aiServiceMock.generateJobFeedback).not.toHaveBeenCalled();
        }
    );

    test('returns 400 when for missing or invalid resume selection', async () => {
        const result = await getFeedback();
        store.get.mockResolvedValueOnce(null); // Simulate missing resume
        expect([404, 400]).toContain(result.status);
        expect(aiServiceMock.generateJobFeedback).not.toHaveBeenCalled();
    });

    // AI Feedback Generation
    test('successfully generates AI feedback aggregating profile, selected resume, and job posting', async () => {
        successfulJobQuery();

        // Mock user profile skills & job history queries
        app.profileService.getParsedProfile.mockResolvedValueOnce(mockParsedProfile);

        const result = await getFeedback({resume_id: resumeId});

        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty('strengths');
        expect(result.body).toHaveProperty('missing_skills');
        expect(result.body).toHaveProperty('suggestions');

        expect(aiServiceMock.generateJobFeedback).toHaveBeenCalledTimes(1);
        const aiCallArg = aiServiceMock.generateJobFeedback.mock.calls[0][0];
        expect(aiCallArg).toHaveProperty('jobDescription');
        expect(aiCallArg).toHaveProperty('resumeText');
        expect(aiCallArg).toHaveProperty('userProfile');
    });

    test('gracefully handles AI service timeouts with 504 Gateway Timeout', async () => {
        successfulJobQuery();
        db.query.mockResolvedValueOnce([[mockParsedProfile]]); // Mock profile retrieval
        aiServiceMock.generateJobFeedback.mockRejectedValueOnce(new Error('AI service timeout'));

        const result = await getFeedback();

        expect(result.status).toBe(504);
        expect(result.body).toHaveProperty('error');
    });

    test('gracefully handles AI model generation failures with 500 Internal Server Error', async () => {
        successfulJobQuery();
        db.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce();
        aiServiceMock.generateJobFeedback.mockRejectedValueOnce(new Error('AI connection refused'));

        const result = await getFeedback();

        expect(result.status).toBe(500);
        expect(result.body).toHaveProperty('error');
    });
})
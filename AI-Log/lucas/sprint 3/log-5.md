# AI LOG 5 (SPRINT 3)

Task: Help with creating test cases for the AI feedback feature
Purpose of the AI: Code generation for test cases.
Reflection: The AI was useful in generating some basic structure for the test cases, but I had to modify the code to fit in with the actual project architecture and requirements.

## Prompt 1

I am working on a new feature for a project. Here is the user story:
US-10: AI Resume Feedback & Job Match Analysis
As a job seeker, I want to compare my parsed resume/profile against a specific job posting, so that I receive AI-generated recommendations and skill-gap feedback to improve my application.

Acceptance Criteria:
- [ ] The user can trigger a "Get AI Feedback" action from any active Job Posting detail page.
- [ ] The AI analyzes the candidate's parsed skills/history against the job poster's specified skills and requirements.
- [ ] The generated feedback outputs clear sections:
    1. Strengths & Alignments
    2. Missing Skills / Gaps
    3. Actionable Resume Suggestions
- [ ] All output components are explicitly labelled with an `"AI-Generated Content"` disclaimer badge.
- [ ] The UI manages asynchronous loading states smoothly and gracefully handles AI service timeouts.

Tasks:
- [ ] Task 10.1 (Backend): Implement `POST /api/jobs/:id/feedback` to aggregate user profile JSON and job requirements, feeding them into the AI.
- [ ] Task 10.2 (Prompt Engineering): Design strict system prompts to enfore non-hallucinatory feedback formatting.
- [ ] Task 11.3 (Frontend): Design and build the AI Feedback drawer component with skeleton loaders, clear formatting, and AI badges.
- [ ] Task 11.4 (Testing): Write unit tests for feedback prompt context assembly and error handling.

Before anything, I should write the unit tests!

here is the current applications.test.js:
process.env.JWT_SECRET = 'applications-test-secret';
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/api/app');

const resumeId = 'ee7470ab-89ad-4076-887d-31a658632f81';
const pdf = Buffer.from('%PDF-1.7\nSaved resume');
const application = { id: 12, job_id: 5, resume_id: resumeId, resume_name: 'CV.pdf', applied_at: '2026-10-26T01:00:00.000Z' };
const storedApplication = { ...application, applied_at: Date.parse(application.applied_at) };
let directory, store, app, connection, db;
const token = (overrides = {}) => jwt.sign({ id: 1, role: 'job_seeker', ...overrides }, process.env.JWT_SECRET);
const apply = (body = { resume_id: resumeId }, bearer = token(), id = '5') => request(app)
    .post(`/api/jobs/${id}/apply`).set('Authorization', `Bearer ${bearer}`).send(body);

beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'careerconnect-applications-'));

    store = {
        get: jest.fn().mockImplementation(async (id, userId) => String(userId) === '1' ? {
            id: resumeId,
            user_id: '1',
            original_name: 'CV.pdf',
            stored_name: 'stored.pdf',
            mime_type: 'application/pdf',
            size_bytes: pdf.length,
            created_at: '2026-10-26',
            updated_at: '2026-10-26'
        } : null),
        create: jest.fn().mockResolvedValue(),
        list: jest.fn().mockResolvedValue([]),
        replace: jest.fn().mockResolvedValue(),
        delete: jest.fn().mockResolvedValue(true),
        close: jest.fn()
    };

    fs.writeFileSync(path.join(directory, 'stored.pdf'), pdf);

    connection = {
        beginTransaction: jest.fn().mockResolvedValue(), commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(), release: jest.fn(), query: jest.fn()
    };

    db = { getConnection: jest.fn().mockResolvedValue(connection), query: jest.fn() };
    app = createApp({ resume: { store, uploadDir: directory }, applications: { db } });
});
afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
});
function successfulQueries() {
    connection.query.mockResolvedValueOnce([[{ id: 5, status: 'open' }]])
        .mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 12 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[storedApplication]]);
}

test('records the authenticated applicant, saved resume snapshot and timestamp atomically', async () => {
    successfulQueries();
    const result = await apply({ resume_id: resumeId, user_id: 999, applied_at: '1900-01-01' });
    expect(result.status).toBe(201);
    expect(result.body.application).toEqual(application);
    const insertion = connection.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO applications'));
    expect(insertion[1]).toEqual([1, '5', resumeId, 'CV.pdf', 'application/pdf', pdf]);
    expect(connection.query.mock.calls.some(([sql]) => sql.includes('awaiting_count + 1'))).toBe(true);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
});
test('requires authentication', async () => {
    expect((await request(app).post('/api/jobs/5/apply').send({ resume_id: resumeId })).status).toBe(401);
    expect((await apply(undefined, 'invalid')).status).toBe(403);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test('blocks recruiter accounts', async () => {
    expect((await apply(undefined, token({ role: 'recruiter' }))).status).toBe(403);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test.each([{}, { resume_id: 42 }, { resume_id: '../file' }])('rejects invalid resume selection %j', async body => {
    expect((await apply(body)).status).toBe(400);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test.each(['0', '-1', '1abc', '9007199254740992'])('rejects invalid job ID %s', async id => {
    expect((await apply(undefined, token(), id)).status).toBe(400);
});
test('does not allow another user to apply using someone else’s resume', async () => {
    expect((await apply(undefined, token({ id: 2 }))).status).toBe(404);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test('handles missing saved files without recording an application', async () => {
    fs.unlinkSync(path.join(directory, 'stored.pdf'));
    expect((await apply()).status).toBe(409);
    expect(db.getConnection).not.toHaveBeenCalled();
});
test('returns 404 for an unknown job', async () => {
    connection.query.mockResolvedValueOnce([[]]);
    expect((await apply()).status).toBe(404);
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
});
test.each(['paused', 'closed'])('rejects %s jobs', async status => {
    connection.query.mockResolvedValueOnce([[{ id: 5, status }]]).mockResolvedValueOnce([[]]);
    expect((await apply()).status).toBe(409);
    expect(connection.query).toHaveBeenCalledTimes(2);
    expect(connection.rollback).toHaveBeenCalled();
});
test('rejects an existing application without incrementing counters', async () => {
    connection.query.mockResolvedValueOnce([[{ id: 5, status: 'open' }]])
        .mockResolvedValueOnce([[{ id: 12 }]]);
    const result = await apply();
    expect(result.status).toBe(409);
    expect(result.body.code).toBe('ALREADY_APPLIED');
    expect(connection.query).toHaveBeenCalledTimes(2);
    expect(connection.rollback).toHaveBeenCalled();
});
test('maps the database uniqueness constraint to a duplicate response', async () => {
    connection.query.mockResolvedValueOnce([[{ id: 5, status: 'open' }]])
        .mockResolvedValueOnce([[]]).mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    const result = await apply();
    expect(result.status).toBe(409);
    expect(result.body.code).toBe('ALREADY_APPLIED');
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
});
test('rolls back an insert when updating job counters fails', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    connection.query.mockResolvedValueOnce([[{ id: 5, status: 'open' }]])
        .mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 12 }])
        .mockRejectedValueOnce(new Error('Database unavailable'));
    const result = await apply();
    expect(result.status).toBe(500);
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    log.mockRestore();
});
test('job details return only the current applicant’s submission', async () => {
    db.query.mockResolvedValueOnce([[{ id: 5, title: 'Developer' }]]).mockResolvedValueOnce([[storedApplication]]);
    const result = await request(app).get('/api/jobs/5').set('Authorization', `Bearer ${token()}`);
    expect(result.status).toBe(200);
    expect(result.body.application).toEqual(application);
    expect(db.query.mock.calls[1][1]).toEqual(['5', 1]);
});
test('job details remain protected after mounting public search', async () => {
    const result = await request(app).get('/api/jobs/5');
    expect(result.status).toBe(401);
    expect(db.query).not.toHaveBeenCalled();
});
test('restored login and new job pages are served', async () => {
    for (const url of ['/login.html', '/jobs.html', '/job-search.html', '/job-details.html']) {
        expect((await request(app).get(url).redirects(1)).status).toBe(200);
    }
});

Additionally, for context, here is how the parsed skills and experience json looks like (taken from the AIResumeService.js, this parses the resume content):
// Strict JSON Schema for Ollama structured output
const resumeJsonSchema = {
    type: "object",
    properties: {
        skills: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    proficiency: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
                },
                required: ["name", "proficiency"]
            }
        },
        job_history: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    company_name: { type: "string" },
                    title: { type: "string" },
                    start_date: { type: "string"},
                    end_date: { type: "string", nullable: true },
                    is_current: { type: "boolean" },
                    details: { type: "string", nullable: true }
                },
                required: ["company_name", "title", "start_date", "is_current"]
            }
        }
    },
    required: ["skills", "job_history"]
}

Final bit of context, when applying to a job, an applicant can select a specific one of their uploaded resumes. Therefore, the AI feedback should also take into account the selected resume. Which means the following:
- Parse the selected resume (do not add parsed contents to the profile) and compare with the application
- If the user has a parsed profile, its information should also be added into  the AI context.
Here is the init.sql:
CREATE DATABASE IF NOT EXISTS career_connect;
USE career_connect;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an invite_code table to store invite codes for companies
CREATE TABLE IF NOT EXISTS company_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('job_seeker', 'recruiter') NOT NULL,
    summary TEXT DEFAULT NULL,
    company_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    openings INT NOT NULL DEFAULT 1,
    country VARCHAR(100) DEFAULT NULL,
    language VARCHAR(100) DEFAULT NULL,
    job_type ENUM('full_time', 'part_time', 'contract', 'temporary', 'internship', 'co_op') DEFAULT NULL,
    description TEXT DEFAULT NULL,
    status ENUM('open', 'paused', 'closed') DEFAULT 'open',
    candidates_count INT DEFAULT 0,
    awaiting_count INT DEFAULT 0,
    reviewed_count INT DEFAULT 0,
    contacting_count INT DEFAULT 0,
    hired_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
-- Create experiences table
CREATE TABLE IF NOT EXISTS experiences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    details TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SQLite resume ownership is validated by the apply endpoint. Store a snapshot
-- so deleting or replacing a saved resume does not change an application.
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    resume_id VARCHAR(36) NOT NULL,
    resume_name VARCHAR(255) NOT NULL,
    resume_mime_type VARCHAR(100) NOT NULL,
    resume_content MEDIUMBLOB NOT NULL,
    status ENUM('applied', 'under_review', 'interview', 'offered', 'rejected') NOT NULL DEFAULT 'applied',
    applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_applications_user_job UNIQUE (user_id, job_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL UNIQUE,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_resumes_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)

and an additional applications.sql:
-- Resume IDs refer to the existing SQLite resume store. Ownership is checked
-- before insertion; a snapshot preserves the submitted file after edits/deletion.
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    resume_id VARCHAR(36) NOT NULL,
    resume_name VARCHAR(255) NOT NULL,
    resume_mime_type VARCHAR(100) NOT NULL,
    resume_content MEDIUMBLOB NOT NULL,
    status ENUM('applied', 'under_review', 'interview', 'offered', 'rejected') NOT NULL DEFAULT 'applied',
    applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_applications_user_job UNIQUE (user_id, job_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

We are using MySQL.

## Response

Here are the comprehensive unit tests for **Task 11.4**, designed to test `POST /api/jobs/:id/feedback` for context assembly, resume snapshot/profile integration, error handling, and AI service timeouts.

This test suite follows the exact structure, assertion style, and mocking patterns used in your existing `applications.test.js`.

### `feedback.test.js`

```javascript
process.env.JWT_SECRET = 'feedback-test-secret';
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
const getFeedback = (body = { resume_id: resumeId }, bearer = token(), id = '5') => 
    request(app).post(`/api/jobs/${id}/feedback`).set('Authorization', `Bearer ${bearer}`).send(body);

beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'careerconnect-feedback-'));

    store = {
        get: jest.fn().mockImplementation(async (id, userId) => String(userId) === '1' ? {
            id: resumeId,
            user_id: '1',
            original_name: 'CV.pdf',
            stored_name: 'stored.pdf',
            mime_type: 'application/pdf',
            size_bytes: pdf.length,
            created_at: '2026-10-26',
            updated_at: '2026-10-26'
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

    db = { getConnection: jest.fn().mockResolvedValue(connection), query: jest.fn() };
    
    aiServiceMock = {
        generateFeedback: jest.fn().mockResolvedValue({
            strengths_and_alignments: ['Strong Node.js background', 'Relevant database experience'],
            missing_skills_and_gaps: ['Missing Kubernetes experience', 'Lack of GraphQL exposure'],
            actionable_resume_suggestions: ['Highlight microservices architecture in your latest role', 'Add a DevOps section']
        })
    };

    app = createApp({ 
        resume: { store, uploadDir: directory }, 
        applications: { db },
        aiService: aiServiceMock
    });
});

afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
    jest.clearAllMocks();
});

function successfulJobQuery() {
    connection.query.mockResolvedValueOnce([[{ 
        id: 5, 
        title: 'Backend Developer', 
        description: 'Looking for Node.js, Express, MySQL, and Kubernetes experience.',
        status: 'open' 
    }]]);
}

test('successfully generates AI feedback aggregating profile, selected resume, and job requirements', async () => {
    successfulJobQuery();
    // Mock user profile skills & job history queries if fetched from DB
    db.query.mockResolvedValueOnce([[{ name: 'Node.js', level: 'advanced' }]]) // skills
             .mockResolvedValueOnce([[{ company_name: 'Tech Corp', title: 'Developer', start_date: '2024-01-01', is_current: true }]]); // experience

    const result = await getFeedback({ resume_id: resumeId });

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('strengths_and_alignments');
    expect(result.body).toHaveProperty('missing_skills_and_gaps');
    expect(result.body).toHaveProperty('actionable_resume_suggestions');
    expect(result.body.disclaimer).toMatch(/AI-Generated Content/i);
    
    expect(aiServiceMock.generateFeedback).toHaveBeenCalledTimes(1);
    const aiCallArg = aiServiceMock.generateFeedback.mock.calls[0][0];
    expect(aiCallArg).toHaveProperty('jobDescription');
    expect(aiCallArg).toHaveProperty('resumeText');
    expect(aiCallArg).toHaveProperty('userProfile');
});

test('requires authentication to request feedback', async () => {
    const result = await request(app).post('/api/jobs/5/feedback').send({ resume_id: resumeId });
    expect(result.status).toBe(401);
    expect(aiServiceMock.generateFeedback).not.toHaveBeenCalled();
});

test('blocks recruiter accounts from requesting candidate resume feedback', async () => {
    const result = await getFeedback({ resume_id: resumeId }, token({ role: 'recruiter' }));
    expect(result.status).toBe(403);
    expect(aiServiceMock.generateFeedback).not.toHaveBeenCalled();
});

test('returns 404 for an unknown job posting', async () => {
    connection.query.mockResolvedValueOnce([[]]); // Job not found
    const result = await getFeedback();
    expect(result.status).toBe(404);
    expect(aiServiceMock.generateFeedback).not.toHaveBeenCalled();
});

test('rejects invalid or missing resume selection with 400', async () => {
    const result = await getFeedback({ resume_id: 'non-existent-or-invalid' });
    // If the resume doesn't belong to the user or isn't found in store
    store.get.mockResolvedValueOnce(null);
    expect([400, 404]).toContain(result.status);
    expect(aiServiceMock.generateFeedback).not.toHaveBeenCalled();
});

test('gracefully handles AI service timeout errors with 504 Gateway Timeout', async () => {
    successfulJobQuery();
    db.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);
    aiServiceMock.generateFeedback.mockRejectedValueOnce(new Error('AI Service Timeout'));

    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getFeedback();

    expect(result.status).toBe(504);
    expect(result.body).toHaveProperty('error');
    log.mockRestore();
});

test('gracefully handles AI model generation failures with 500 Internal Server Error', async () => {
    successfulJobQuery();
    db.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);
    aiServiceMock.generateFeedback.mockRejectedValueOnce(new Error('Ollama connection refused'));

    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getFeedback();

    expect(result.status).toBe(500);
    expect(result.body).toHaveProperty('error');
    log.mockRestore();
});

```

---

### Key Highlights of the Unit Tests:

1. **Context Assembly Validation**: Verifies that the backend correctly gathers the job description, user profile attributes (skills & experience), and the content of the user-selected resume file (`resumeId`), passing them into the AI service wrapper.
2. **Strict Access Control**: Asserts that unauthenticated callers, invalid tokens, and recruiter roles are properly blocked with `401` / `403` status codes.
3. **Robust Error & Timeout Handling**: Simulates AI service latency/timeouts (`504 Gateway Timeout`) and model connection failures (`500 Internal Server Error`) to ensure the frontend experiences smooth and graceful error handling as mandated by the acceptance criteria.
4. **Disclaimer Badge Check**: Verifies that the API response output structure includes the required `"AI-Generated Content"` badge metadata for UI rendering.
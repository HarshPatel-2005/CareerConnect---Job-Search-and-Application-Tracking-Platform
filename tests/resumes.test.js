const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/api/app');
const ResumeStore = require('../src/api/db/resumeStore');

const PDF = Buffer.from('%PDF-1.7\nCareerConnect test resume');
const DOCX = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

let tempDir;
let app;
let store;
let userAToken;
let userBToken;

function createToken(userId, email = 'user@example.com', role = 'job_seeker') {
    return jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'careerconnect-resumes-'));
    store = new ResumeStore(path.join(tempDir, 'resumes.sqlite'));
    app = createApp({
        resume: {
            uploadDir: path.join(tempDir, 'uploads'),
            store,
            maxSize: 100
        }
    });

    userAToken = createToken('user-a-id', 'user-a@example.com', 'job_seeker');
    userBToken = createToken('user-b-id', 'user-b@example.com', 'job_seeker');
});

afterEach(() => {
    store.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
});

async function uploadPdf(name = 'resume.pdf', token = userAToken) {
    return request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .attach('resume', PDF, {
            filename: name,
            contentType: 'application/pdf'
        });
}

describe('resume management (JWT Protected)', () => {
    it('rejects requests without a valid JWT', async () => {
        const res = await request(app).get('/api/resumes');
        expect(res.status).toBe(401);
    });

    it('uploads and lists a PDF resume for authenticated user', async () => {
        const uploaded = await uploadPdf();
        expect(uploaded.status).toBe(201);
        expect(uploaded.body.resume.name).toBe('resume.pdf');

        const listed = await request(app)
            .get('/api/resumes')
            .set('Authorization', `Bearer ${userAToken}`);

        expect(listed.status).toBe(200);
        expect(listed.body.resumes).toHaveLength(1);
        expect(listed.body.resumes[0].id).toBe(uploaded.body.resume.id);
    });

    it('accepts a DOCX resume with a valid ZIP signature', async () => {
        const response = await request(app)
            .post('/api/resumes')
            .set('Authorization', `Bearer ${userAToken}`)
            .attach('resume', DOCX, {
                filename: 'resume.docx',
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
        expect(response.status).toBe(201);
    });

    it('rejects unsupported file types and oversized files', async () => {
        const unsupported = await request(app)
            .post('/api/resumes')
            .set('Authorization', `Bearer ${userAToken}`)
            .attach('resume', Buffer.from('hello'), {
                filename: 'resume.txt', contentType: 'text/plain'
            });

        expect(unsupported.status).toBe(400);

        const oversized = await request(app)
            .post('/api/resumes')
            .set('Authorization', `Bearer ${userAToken}`)
            .attach('resume', Buffer.concat([PDF, Buffer.alloc(100)]), {
                filename: 'large.pdf', contentType: 'application/pdf'
            });
        expect(oversized.status).toBe(400);
        expect(oversized.body.error).toMatch(/no larger/i);
    });

    it('rejects a renamed file whose content is not a PDF', async () => {
        const response = await request(app)
            .post('/api/resumes')
            .set('Authorization', `Bearer ${userAToken}`)
            .attach('resume', Buffer.from('not really a pdf'), {
                filename: 'fake.pdf', contentType: 'application/pdf'
            });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/content/i);
    });

    it('replaces the stored file and keeps the resume id', async () => {
        const uploaded = await uploadPdf('old.pdf');
        const id = uploaded.body.resume.id;
        const replaced = await request(app)
            .put(`/api/resumes/${id}`)
            .set('Authorization', `Bearer ${userAToken}`)
            .attach('resume', PDF, {
                filename: 'new.pdf', contentType: 'application/pdf'
            });

        expect(replaced.status).toBe(200);
        expect(replaced.body.resume.id).toBe(id);
        expect(replaced.body.resume.name).toBe('new.pdf');
        expect(fs.readdirSync(path.join(tempDir, 'uploads'))).toHaveLength(1);
    });

    it('downloads and deletes a resume', async () => {
        const uploaded = await uploadPdf();
        const id = uploaded.body.resume.id;

        const downloaded = await request(app)
        .get(`/api/resumes/${id}/download`)
        .set('Authorization', `Bearer ${userAToken}`);

        expect(downloaded.status).toBe(200);
        expect(downloaded.headers['content-disposition']).toContain('resume.pdf');

        const deleted = await request(app)
            .delete(`/api/resumes/${id}`)
            .set('Authorization', `Bearer ${userAToken}`);
        expect(deleted.status).toBe(204);

        const relisted = await request(app)
            .get('/api/resumes')
            .set('Authorization', `Bearer ${userAToken}`);
        expect(relisted.body.resumes).toHaveLength(0);

        const downloadAfterDelete = await request(app)
            .get(`/api/resumes/${id}/download`)
            .set('Authorization', `Bearer ${userAToken}`);
        expect(downloadAfterDelete.status).toBe(404);
    });

    it('keeps resumes isolated between users via JWT context', async () => {
        // User A uploads a resume
        const uploaded = await uploadPdf('private.pdf', userAToken);
        const id = uploaded.body.resume.id;

        // User B should not see User A's resume
        const userBList = await request(app)
            .get('/api/resumes')
            .set('Authorization', `Bearer ${userBToken}`);
        expect(userBList.body.resumes).toHaveLength(0);

        // User B should not be able to delete User A's resume
        const userBDelete = await request(app)
            .delete(`/api/resumes/${id}`)
            .set('Authorization', `Bearer ${userBToken}`);
        expect(userBDelete.status).toBe(404);
    });
});

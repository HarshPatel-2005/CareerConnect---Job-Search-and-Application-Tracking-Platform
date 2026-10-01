const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../src/api/app');

const PDF = Buffer.from('%PDF-1.7\nCareerConnect test resume');
const DOCX = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
let tempDir;
let app;
let store;

class MemoryResumeStore {
    constructor() {
        this.resumes = new Map();
    }

    list(userId) {
        return [...this.resumes.values()].filter((resume) => resume.user_id === userId);
    }

    get(id, userId) {
        const resume = this.resumes.get(id);
        return resume?.user_id === userId ? resume : null;
    }

    create(resume) {
        this.resumes.set(resume.id, { ...resume });
        return this.get(resume.id, resume.user_id);
    }

    replace(id, userId, changes) {
        const resume = this.get(id, userId);
        if (!resume) return null;
        this.resumes.set(id, { ...resume, ...changes });
        return this.get(id, userId);
    }

    delete(id, userId) {
        return this.get(id, userId) ? this.resumes.delete(id) : false;
    }
}

const asUser = (testRequest, id = 1) => testRequest.set('x-user-id', String(id));

beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'careerconnect-resumes-'));
    store = new MemoryResumeStore();
    app = createApp({
        resume: {
            uploadDir: path.join(tempDir, 'uploads'),
            store,
            maxSize: 100
        }
    });
});

afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
});

async function uploadPdf(name = 'resume.pdf') {
    return asUser(request(app).post('/api/resumes')).attach('resume', PDF, {
        filename: name,
        contentType: 'application/pdf'
    });
}

describe('resume management', () => {
    it('uploads and lists a PDF resume', async () => {
        const uploaded = await uploadPdf();
        expect(uploaded.status).toBe(201);
        expect(uploaded.body.resume.name).toBe('resume.pdf');

        const listed = await asUser(request(app).get('/api/resumes'));
        expect(listed.status).toBe(200);
        expect(listed.body.resumes).toHaveLength(1);
        expect(listed.body.resumes[0].id).toBe(uploaded.body.resume.id);
    });

    it('accepts a DOCX resume with a valid ZIP signature', async () => {
        const response = await asUser(request(app).post('/api/resumes')).attach('resume', DOCX, {
            filename: 'resume.docx',
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        expect(response.status).toBe(201);
    });

    it('rejects unsupported file types and oversized files', async () => {
        const unsupported = await asUser(request(app).post('/api/resumes')).attach('resume', Buffer.from('hello'), {
            filename: 'resume.txt', contentType: 'text/plain'
        });
        expect(unsupported.status).toBe(400);

        const oversized = await asUser(request(app).post('/api/resumes')).attach('resume', Buffer.concat([PDF, Buffer.alloc(100)]), {
            filename: 'large.pdf', contentType: 'application/pdf'
        });
        expect(oversized.status).toBe(400);
        expect(oversized.body.error).toMatch(/no larger/i);
    });

    it('rejects a renamed file whose content is not a PDF', async () => {
        const response = await asUser(request(app).post('/api/resumes')).attach('resume', Buffer.from('not really a pdf'), {
            filename: 'fake.pdf', contentType: 'application/pdf'
        });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/content/i);
    });

    it('replaces the stored file and keeps the resume id', async () => {
        const uploaded = await uploadPdf('old.pdf');
        const id = uploaded.body.resume.id;
        const replaced = await asUser(request(app).put(`/api/resumes/${id}`)).attach('resume', PDF, {
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

        const downloaded = await asUser(request(app).get(`/api/resumes/${id}/download`));
        expect(downloaded.status).toBe(200);
        expect(downloaded.headers['content-disposition']).toContain('resume.pdf');

        expect((await asUser(request(app).delete(`/api/resumes/${id}`))).status).toBe(204);
        expect((await asUser(request(app).get('/api/resumes'))).body.resumes).toHaveLength(0);
        expect((await asUser(request(app).get(`/api/resumes/${id}/download`))).status).toBe(404);
    });

    it('keeps resumes isolated between users', async () => {
        const uploaded = await asUser(request(app).post('/api/resumes'), 1)
            .attach('resume', PDF, { filename: 'private.pdf', contentType: 'application/pdf' });
        const id = uploaded.body.resume.id;

        expect((await asUser(request(app).get('/api/resumes'), 2)).body.resumes).toHaveLength(0);
        expect((await asUser(request(app).delete(`/api/resumes/${id}`), 2)).status).toBe(404);
    });

    it('requires a logged-in user', async () => {
        const response = await request(app).get('/api/resumes');
        expect(response.status).toBe(401);
    });
});

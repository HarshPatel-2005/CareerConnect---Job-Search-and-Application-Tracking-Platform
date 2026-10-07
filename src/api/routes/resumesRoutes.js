const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const ResumeStore = require('../db/resumeStore');
const { authenticateToken } = require('../middleware/authMiddleware');

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILES = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

function publicResume(resume) {
    return {
        id: resume.id,
        name: resume.original_name,
        mimeType: resume.mime_type,
        size: resume.size_bytes,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at,
        downloadUrl: `/api/resumes/${resume.id}/download`
    };
}

function hasValidSignature(filePath, extension) {
    const descriptor = fs.openSync(filePath, 'r');
    const signature = Buffer.alloc(5);
    const bytesRead = fs.readSync(descriptor, signature, 0, signature.length, 0);
    fs.closeSync(descriptor);

    if (extension === '.pdf') {
        return bytesRead >= 5 && signature.subarray(0, 5).toString() === '%PDF-';
    }

    return bytesRead >= 4 && signature[0] === 0x50 && signature[1] === 0x4b &&
        signature[2] === 0x03 && signature[3] === 0x04;
}

function createResumeRouter(options = {}) {
    const router = express.Router();
    const root = path.resolve(__dirname, '../../..');
    const uploadDir = path.resolve(options.uploadDir || path.join(root, 'uploads/resumes'));
    const dbPath = path.resolve(options.dbPath || path.join(root, 'data/careerconnect.sqlite'));
    const maxSize = options.maxSize || Number(process.env.RESUME_MAX_SIZE_BYTES) || DEFAULT_MAX_SIZE;
    const store = options.store || new ResumeStore(dbPath);

    fs.mkdirSync(uploadDir, { recursive: true });

    // Enforce JWT authentication for all routes in this router
    router.use(authenticateToken);

    const upload = multer({
        storage: multer.diskStorage({
            destination: uploadDir,
            filename: (_req, file, callback) => {
                const extension = path.extname(file.originalname).toLowerCase();
                callback(null, `${crypto.randomUUID()}${extension}`);
            }
        }),
        limits: { fileSize: maxSize, files: 1 },
        fileFilter: (_req, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase();
            const expectedMime = ALLOWED_FILES[extension];
            if (!expectedMime || file.mimetype !== expectedMime) {
                return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'resume'));
            }
            callback(null, true);
        }
    });

    const userId = (req) => req.get('x-user-id') || 'demo-job-seeker';
    const removeUploadedFile = (file) => {
        if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    };

    function validateUploadedFile(req, res) {
        if (!req.file) {
            res.status(400).json({ error: 'Choose a PDF or DOCX resume to upload.' });
            return false;
        }
        const extension = path.extname(req.file.originalname).toLowerCase();
        if (!hasValidSignature(req.file.path, extension)) {
            removeUploadedFile(req.file);
            res.status(400).json({ error: 'The file content does not match a valid PDF or DOCX file.' });
            return false;
        }
        return true;
    }

    router.get('/', (req, res) => {
        res.json({ resumes: store.list(userId(req)).map(publicResume), maxSize });
    });

    router.post('/', upload.single('resume'), (req, res, next) => {
        if (!validateUploadedFile(req, res)) return;
        const now = new Date().toISOString();
        try {
            const record = store.create({
                id: crypto.randomUUID(),
                user_id: userId(req),
                original_name: path.basename(req.file.originalname),
                stored_name: req.file.filename,
                mime_type: req.file.mimetype,
                size_bytes: req.file.size,
                created_at: now,
                updated_at: now
            });
            res.status(201).json({ resume: publicResume(record) });
        } catch (error) {
            removeUploadedFile(req.file);
            next(error);
        }
    });

    router.put('/:id', upload.single('resume'), (req, res, next) => {
        if (!validateUploadedFile(req, res)) return;
        const existing = store.get(req.params.id, userId(req));
        if (!existing) {
            removeUploadedFile(req.file);
            return res.status(404).json({ error: 'Resume not found.' });
        }

        try {
            const record = store.replace(req.params.id, userId(req), {
                original_name: path.basename(req.file.originalname),
                stored_name: req.file.filename,
                mime_type: req.file.mimetype,
                size_bytes: req.file.size,
                updated_at: new Date().toISOString()
            });
            fs.rmSync(path.join(uploadDir, existing.stored_name), { force: true });
            res.json({ resume: publicResume(record) });
        } catch (error) {
            removeUploadedFile(req.file);
            next(error);
        }
    });

    router.get('/:id/download', (req, res) => {
        const resume = store.get(req.params.id, userId(req));
        if (!resume) return res.status(404).json({ error: 'Resume not found.' });
        res.download(path.join(uploadDir, resume.stored_name), resume.original_name);
    });

    router.delete('/:id', (req, res, next) => {
        const resume = store.get(req.params.id, userId(req));
        if (!resume) return res.status(404).json({ error: 'Resume not found.' });

        try {
            fs.rmSync(path.join(uploadDir, resume.stored_name), { force: true });
            store.delete(req.params.id, userId(req));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    });

    router.use((error, _req, res, _next) => {
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: `Resume must be no larger than ${Math.round(maxSize / 1024 / 1024)} MB.` });
            }
            return res.status(400).json({ error: 'Only PDF and DOCX files are accepted.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Unable to manage resumes right now.' });
    });

    return router;
}

module.exports = { createResumeRouter, DEFAULT_MAX_SIZE };

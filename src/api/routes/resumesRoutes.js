const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const ResumeStore = require('../db/resumeStore');
const ResumeController = require('../controllers/resumeController');
const { authenticateToken } = require('../middleware/authMiddleware');

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILES = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

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
    const maxSize = options.maxSize || Number(process.env.RESUME_MAX_SIZE_BYTES) || DEFAULT_MAX_SIZE;
    const store = options.store || new ResumeStore();

    fs.mkdirSync(uploadDir, { recursive: true });

    const controller = new ResumeController(store, uploadDir, maxSize);

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

    function validateUploadedFile(req, res, next) {
        if (!req.file) {
            return res.status(400).json({ error: 'Choose a PDF or DOCX resume to upload.' });
        }
        const extension = path.extname(req.file.originalname).toLowerCase();
        if (!hasValidSignature(req.file.path, extension)) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'The file content does not match a valid PDF or DOCX file.' });
        }
        next();
    }

    // Route Endpoints
    router.get('/', controller.list);
    router.post('/', upload.single('resume'), validateUploadedFile, controller.upload);
    router.post('/resume-extract', upload.single('resume'), validateUploadedFile, controller.uploadAndExtract);
    router.get('/:id/download', controller.download);
    router.delete('/:id', controller.remove);
    router.put('/:id', upload.single('resume'), validateUploadedFile, controller.replace);
    router.post("/confirm", controller.confirmAndSaveResume);

    // Multer / General error handling middleware
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

    router.store = store;
    router.uploadDir = uploadDir;
    return router;
}

module.exports = { createResumeRouter, DEFAULT_MAX_SIZE };

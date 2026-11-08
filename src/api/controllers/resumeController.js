const path = require('path');
const fs = require('fs');
const { parseResumeWithAI } = require('../services/aiResumeService');

class ResumeController {
    constructor(store, uploadDir, maxSize) {
        this.store = store;
        this.uploadDir = uploadDir;
        this.maxSize = maxSize;
    }

    list = async (req, res) => {
        const userId = req.user?.userId || req.user?.id;
        const resumes = await this.store.list(userId);
        res.json({ resumes: resumes.map(this._publicResume), maxSize: this.maxSize });
    }

    upload = async (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Choose a PDF or DOCX resume to upload.' });
        }

        const userId = req.user?.userId || req.user?.id;

        try {
            // Save metadata record to DB
            const record = await this.store.create({
                id: req.file.filename.split('.')[0],
                user_id: userId,
                original_name: path.basename(req.file.originalname),
                stored_name: req.file.filename,
                mime_type: req.file.mimetype,
                size_bytes: req.file.size,
            });

            res.status(201).json({ resume: this._publicResume(record) });
        } catch (error) {
            this._removeFile(req.file);
            next(error);
        }
    }

    uploadAndExtract = async (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Choose a PDF or DOCX resume to upload.' });
        }

        const userId = req.user?.userId || req.user?.id;

        try {
            // Save metadata record to DB
            const record = await this.store.create({
                id: req.file.filename.split('.')[0],
                user_id: userId,
                original_name: path.basename(req.file.originalname),
                stored_name: req.file.filename,
                mime_type: req.file.mimetype,
                size_bytes: req.file.size,
            });

            // Parse the file with AI to extract structured data
            const aiExtractedData = await parseResumeWithAI(req.file.path, req.file.mimetype);

            // Return both resume metadata & AI extracted data
            res.status(201).json({ 
                resume: this._publicResume(record), 
                extractedProfile: aiExtractedData 
            });
        } catch (error) {
            this._removeFile(req.file);
            next(error);
        }
    };

    download = async (req, res) => {
        const userId = req.user?.userId || req.user?.id;
        const resume = await this.store.get(req.params.id, userId);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        res.download(path.join(this.uploadDir, resume.stored_name), resume.original_name);
    }

    remove = async (req, res, next) => {
        const userId = req.user?.userId || req.user?.id;
        const resume = await this.store.get(req.params.id, userId);
        if (!resume) return res.status(404).json({ error: 'Resume not found' });

        try {
            fs.rmSync(path.join(this.uploadDir, resume.stored_name), { force: true });
            await this.store.delete(req.params.id, userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    replace = async (req, res, next) => {
        const userId = req.user?.userId || req.user?.id;
        try {
            const existing = await this.store.get(req.params.id, userId);
            if (!existing) {
                this._removeFile(req.file);
                return res.status(404).json({ error: 'Resume not found' });
            }
            const updated = await this.store.replace(req.params.id, userId, {
                original_name: path.basename(req.file.originalname),
                stored_name: req.file.filename,
                mime_type: req.file.mimetype,
                size_bytes: req.file.size,
            });
            fs.rmSync(path.join(this.uploadDir, path.basename(existing.stored_name)), { force: true });
            res.json({ resume: this._publicResume(updated) });
        } catch (error) {
            this._removeFile(req.file);
            next(error);
        }
        };

    _publicResume(resume) {
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

    _removeFile(file) {
        if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
}
module.exports = ResumeController;
const db = require('../../config/db');

class ResumeStore {
    constructor(db = db) {
        this.db = db;
    }

    async list(userId) {
        const [rows] = await this.db.query(`
            SELECT id, original_name AS original_name, mime_type, size_bytes, created_at, updated_at
            FROM resumes
            WHERE user_id = ?
            ORDER BY updated_at DESC
        `, [userId]);
        return rows;
    }

    async get(id, userId) {
        const [rows] = await this.db.query(
            'SELECT * FROM resumes WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0] || null;
    }

    async create(resume) {
        await this.db.query(`
            INSERT INTO resumes
                (id, user_id, original_name, stored_name, mime_type, size_bytes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            resume.id,
            resume.user_id,
            resume.original_name,
            resume.stored_name,
            resume.mime_type,
            resume.size_bytes,
            resume.created_at,
            resume.updated_at
        ]);
        return await this.get(resume.id, resume.user_id);
    }

    async replace(id, userId, resume) {
        const [result] = await this.db.query(`
            UPDATE resumes
            SET original_name = ?, stored_name = ?, mime_type = ?, size_bytes = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
        `, [
            resume.original_name,
            resume.stored_name,
            resume.mime_type,
            resume.size_bytes,
            resume.updated_at,
            id,
            userId
        ]);
        return result.affectedRows > 0 ? await this.get(id, userId) : null;
    }

    async delete(id, userId) {
        const [result] = await this.db.query(
            'DELETE FROM resumes WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    // Stub for compatibility if anything calls close()
    close() {
        // MySQL connection pools are managed globally; no-op required here.
    }
}

module.exports = ResumeStore;

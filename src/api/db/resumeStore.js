const db = require('../../config/db');

class ResumeStore {
    constructor(pool = db) {
        this.db = pool;
        this.ready = null;
    }

    ensureSchema() {
        if (!this.ready) {
            this.ready = this.db.query(`
            CREATE TABLE IF NOT EXISTS resumes (
                id CHAR(36) PRIMARY KEY,
                user_id INT NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                stored_name VARCHAR(255) UNIQUE NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                size_bytes INT UNSIGNED NOT NULL,
                created_at DATETIME(3) NOT NULL,
                updated_at DATETIME(3) NOT NULL,
                INDEX idx_resumes_user_id (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            `).catch((error) => {
                this.ready = null;
                throw error;
            });
        }
        return this.ready;
    }

    async list(userId) {
        await this.ensureSchema();
        const [rows] = await this.db.query(`
            SELECT id, original_name, mime_type, size_bytes, created_at, updated_at
            FROM resumes
            WHERE user_id = ?
            ORDER BY updated_at DESC
        `, [userId]);
        return rows;
    }

    async get(id, userId) {
        await this.ensureSchema();
        const [rows] = await this.db.query(
            'SELECT * FROM resumes WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0] || null;
    }

    async create(resume) {
        await this.ensureSchema();
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
        return this.get(resume.id, resume.user_id);
    }

    async replace(id, userId, resume) {
        await this.ensureSchema();
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
        return result.affectedRows ? this.get(id, userId) : null;
    }

    async delete(id, userId) {
        await this.ensureSchema();
        const [result] = await this.db.query(
            'DELETE FROM resumes WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = ResumeStore;

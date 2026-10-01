const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

class ResumeStore {
    constructor(dbPath) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        this.db = new DatabaseSync(dbPath);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS resumes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL UNIQUE,
                mime_type TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_resumes_user_id
                ON resumes(user_id);
        `);
    }

    list(userId) {
        return this.db.prepare(`
            SELECT id, original_name, mime_type, size_bytes, created_at, updated_at
            FROM resumes
            WHERE user_id = ?
            ORDER BY updated_at DESC
        `).all(userId);
    }

    get(id, userId) {
        return this.db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?')
            .get(id, userId);
    }

    create(resume) {
        this.db.prepare(`
            INSERT INTO resumes
                (id, user_id, original_name, stored_name, mime_type, size_bytes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            resume.id,
            resume.user_id,
            resume.original_name,
            resume.stored_name,
            resume.mime_type,
            resume.size_bytes,
            resume.created_at,
            resume.updated_at
        );
        return this.get(resume.id, resume.user_id);
    }

    replace(id, userId, resume) {
        const result = this.db.prepare(`
            UPDATE resumes
            SET original_name = ?, stored_name = ?, mime_type = ?, size_bytes = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
        `).run(
            resume.original_name,
            resume.stored_name,
            resume.mime_type,
            resume.size_bytes,
            resume.updated_at,
            id,
            userId
        );
        return result.changes ? this.get(id, userId) : null;
    }

    delete(id, userId) {
        return this.db.prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?')
            .run(id, userId).changes > 0;
    }

    close() {
        this.db.close();
    }
}

module.exports = ResumeStore;

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

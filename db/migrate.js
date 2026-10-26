const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function migrate() {
    // Initialize missing tables in the configured database, without switching
    // databases or removing existing records. The schema contains no SQL routines.
    const schema = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8')
        .replace(/^CREATE DATABASE.*;\r?\n/m, '').replace(/^USE .*;\r?\n/m, '');
    for (const statement of schema.split(';').filter(sql => sql.trim())) {
        await db.query(statement);
    }
    // CREATE TABLE IF NOT EXISTS does not upgrade existing user tables.
    const [userColumns] = await db.query('SHOW COLUMNS FROM users');
    if (!userColumns.some(column => column.Field === 'summary')) {
        await db.query('ALTER TABLE users ADD COLUMN summary TEXT DEFAULT NULL');
    }
    // Add fields used by the existing job-posting endpoint to older databases.
    const [columns] = await db.query('SHOW COLUMNS FROM jobs');
    const names = new Set(columns.map(column => column.Field));
    const additions = {
        openings: 'INT NOT NULL DEFAULT 1',
        country: 'VARCHAR(100) DEFAULT NULL',
        language: 'VARCHAR(100) DEFAULT NULL',
        job_type: "ENUM('full_time', 'part_time', 'contract', 'temporary', 'internship', 'co_op') DEFAULT NULL",
        description: 'TEXT DEFAULT NULL'
    };
    for (const [name, definition] of Object.entries(additions)) {
        if (!names.has(name)) await db.query(`ALTER TABLE jobs ADD COLUMN ${name} ${definition}`);
    }
    await db.query(fs.readFileSync(path.join(__dirname, 'applications.sql'), 'utf8'));
    const [applicationColumns] = await db.query('SHOW COLUMNS FROM applications');
    if (!applicationColumns.some(column => column.Field === 'status')) {
        await db.query("ALTER TABLE applications ADD COLUMN status ENUM('applied', 'under_review', 'interview', 'offered', 'rejected') NOT NULL DEFAULT 'applied'");
    }
    console.log('Profile and applications schemas are ready. Existing records were preserved.');
}

migrate().catch(error => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
}).finally(() => db.end());

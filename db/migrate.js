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
    // Add fields used by the existing job-posting endpoint to older databases.
    const [columns] = await db.query('SHOW COLUMNS FROM jobs');
    const names = new Set(columns.map(column => column.Field));
    const additions = {
        openings: 'INT NOT NULL DEFAULT 1',
        country: "VARCHAR(255) NOT NULL DEFAULT ''",
        language: "VARCHAR(255) NOT NULL DEFAULT ''",
        job_type: "VARCHAR(30) NOT NULL DEFAULT 'full_time'",
        description: 'TEXT'
    };
    for (const [name, definition] of Object.entries(additions)) {
        if (!names.has(name)) await db.query(`ALTER TABLE jobs ADD COLUMN ${name} ${definition}`);
    }
    await db.query(fs.readFileSync(path.join(__dirname, 'applications.sql'), 'utf8'));
    console.log('Applications schema is ready. Existing records were preserved.');
}

migrate().catch(error => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
}).finally(() => db.end());

const { test, expect } = require('@playwright/test');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const { generateToken } = require('../../src/api/utils/jwt');
const { generateDeadlineReminders } = require('../../src/api/services/deadlineReminders');
// Keep this suite's connection lifecycle independent of other browser specs.
let db;
test.beforeAll(() => {
    db = mysql.createPool({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'career_connect' });
});

// AT-09.1 — US-09: Saved jobs and deadline reminders (GitHub issue #10).
// Given a signed-in job seeker who has not applied to an open job due in two days,
// when they save that job,
// then the job appears in Saved jobs and exactly one unread reminder identifies
// the job and its deadline. Re-running the task must not duplicate the reminder.
// Marking it as read persists after reload; unsaving removes the saved posting.
test('AT-09.1: save a job and receive a single deadline reminder', async ({ page }, testInfo) => {
    const suffix = crypto.randomUUID();
    const title = `Reminder developer ${suffix}`;
    let companyId, seekerId, recruiterId, jobId;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
        const [company] = await db.query('INSERT INTO companies (name) VALUES (?)', [`Reminder company ${suffix}`]);
        companyId = company.insertId;
        const [seeker] = await db.query("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, 'fixture', 'job_seeker')",
            ['Reminder Seeker', `reminder-${suffix}@example.invalid`]);
        seekerId = seeker.insertId;
        const [recruiter] = await db.query("INSERT INTO users (full_name, email, password_hash, role, company_id) VALUES (?, ?, 'fixture', 'recruiter', ?)",
            ['Reminder Recruiter', `recruiter-${suffix}@example.invalid`, companyId]);
        recruiterId = recruiter.insertId;
        const recruiterAuth = `Bearer ${generateToken({ id: recruiterId, role: 'recruiter', company_id: companyId })}`;
        const created = await page.request.post('/api/recruiter/jobs', {
            headers: { Authorization: recruiterAuth },
            data: { title, location: 'Montreal', openings: 1, country: 'Canada', language: 'English', job_type: 'full_time' }
        });
        expect(created.status()).toBe(201); jobId = (await created.json()).id;
        // The recruiter can set and reload an optional deadline using the real form.
        await page.addInitScript(({ token, user }) => {
            if (!sessionStorage.getItem('token')) {
                sessionStorage.setItem('token', token); sessionStorage.setItem('user', JSON.stringify(user));
            }
        }, { token: recruiterAuth.slice(7), user: { id: recruiterId, full_name: 'Reminder Recruiter', role: 'recruiter', company_id: companyId } });
        await page.goto(`/job-posting.html?id=${jobId}`);
        await expect(page.getByLabel('Job title', { exact: true })).toHaveValue(title);
        const [[dates]] = await db.query("SELECT DATE_FORMAT(DATE_ADD(UTC_DATE(), INTERVAL 2 DAY), '%Y-%m-%d') AS deadline");
        await page.getByLabel('Application deadline (optional)', { exact: true }).fill(dates.deadline);
        await page.getByRole('button', { name: 'Save changes', exact: true }).click();
        await expect(page).toHaveURL(/recruiter-dashboard.html/);
        await page.goto(`/job-posting.html?id=${jobId}`);
        await expect(page.getByLabel('Application deadline (optional)', { exact: true })).toHaveValue(dates.deadline);

        await page.evaluate(({ token, user }) => {
            sessionStorage.setItem('token', token); sessionStorage.setItem('user', JSON.stringify(user));
        }, { token: generateToken({ id: seekerId, role: 'job_seeker' }), user: { id: seekerId, full_name: 'Reminder Seeker', role: 'job_seeker' } });
        await page.goto('/job-search.html');
        await page.getByLabel('Job title or keyword').fill(title);
        await page.getByRole('button', { name: 'Search Jobs', exact: true }).click();
        const jobCard = page.locator('.job-card').filter({ hasText: title });
        await test.step('When the job seeker saves the posting', async () => {
            await jobCard.getByRole('button', { name: `Save job: ${title}`, exact: true }).click();
            await expect(jobCard.getByRole('button', { name: `Unsave job: ${title}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
            await expect(page.locator('.app-header').getByRole('link', { name: 'Notifications (1)', exact: true })).toBeVisible();
        });
        await page.locator('.app-header').getByRole('link', { name: 'Saved jobs', exact: true }).click();
        await expect(page.locator('#saved-jobs .job-card')).toHaveCount(1);
        await page.reload();
        await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
        await page.getByRole('link', { name: title, exact: true }).click();
        await expect(page.locator('#deadline')).toContainText(dates.deadline);
        await expect(page.getByRole('button', { name: `Unsave job: ${title}`, exact: true })).toBeEnabled();
        await test.step('Then one unread reminder is available immediately after saving', async () => {
            await page.locator('.app-header').getByRole('link', { name: /^Notifications/ }).click();
            await expect(page.locator('.app-header').getByRole('link', { name: 'Notifications (1)', exact: true })).toBeVisible();
            await expect(page.locator('.notification-card')).toHaveCount(1);
            await expect(page.locator('.notification-card')).toContainText(title);
            await expect(page.locator('.notification-card')).toContainText(dates.deadline);
            await expect(page.locator('.notification-card .status-tag')).toHaveText('Unread');
        });
        await page.getByRole('button', { name: 'Mark as read', exact: true }).click();
        await expect(page.locator('.notification-card .status-tag')).toHaveText('Read');
        await expect(page.locator('.app-header').getByRole('link', { name: 'Notifications', exact: true })).toBeVisible();
        await page.reload();
        await expect(page.locator('.notification-card .status-tag')).toHaveText('Read');
        await generateDeadlineReminders(db);
        await page.getByRole('button', { name: 'Refresh', exact: true }).click();
        await expect(page.locator('.notification-card')).toHaveCount(1);

        // Changing a deadline issues a new reminder without resetting the previous read state.
        await db.query('UPDATE jobs SET deadline = DATE_ADD(UTC_DATE(), INTERVAL 1 DAY) WHERE id = ?', [jobId]);
        await generateDeadlineReminders(db);
        await page.getByRole('button', { name: 'Refresh', exact: true }).click();
        await expect(page.locator('.notification-card')).toHaveCount(2);
        await page.getByRole('button', { name: 'Mark all as read', exact: true }).click();
        await expect(page.locator('.notification-card.unread')).toHaveCount(0);
        await expect(page.locator('.app-header').getByRole('link', { name: 'Notifications', exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath('notifications.png'), fullPage: true });

        await page.locator('.app-header').getByRole('link', { name: 'Saved jobs', exact: true }).click();
        await page.getByRole('button', { name: `Unsave job: ${title}`, exact: true }).click();
        await expect(page.locator('#saved-jobs .job-card')).toHaveCount(0);
        await expect(page.getByRole('status')).toContainText('No saved jobs yet');
        await page.reload();
        await expect(page.locator('#saved-jobs .job-card')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath('saved-jobs-empty.png'), fullPage: true });
        expect(errors).toEqual([]);
    } finally {
        if (jobId) await db.query('DELETE FROM jobs WHERE id = ?', [jobId]);
        for (const id of [seekerId, recruiterId].filter(Boolean)) await db.query('DELETE FROM users WHERE id = ?', [id]);
        if (companyId) await db.query('DELETE FROM companies WHERE id = ?', [companyId]);
    }
});

test('saved jobs and notifications require login', async ({ page }) => {
    for (const destination of ['/saved-jobs.html', '/notifications.html']) {
        await page.goto(destination);
        await expect(page).toHaveURL(/login.html\?next=/);
    }
});

test.afterAll(() => db.end());

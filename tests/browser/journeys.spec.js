const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const db = require('../../src/config/db');

test('recruiter and job seeker can complete their journeys through navigation', async ({ browser }, testInfo) => {
    const context = await browser.newContext({ ...testInfo.project.use, baseURL: 'http://localhost:3100', acceptDownloads: true });
    const recruiter = await context.newPage();
    const seeker = await context.newPage();
    const errors = [];
    for (const page of [recruiter, seeker]) page.on('pageerror', error => errors.push(error.message));
    const suffix = crypto.randomUUID();
    const email = role => `${role}-${suffix}@example.invalid`;
    const password = 'CareerConnect-Test-123!';
    const title = `Browser test developer ${suffix}`;
    const accounts = [];
    let companyId, jobId, resumeId, seekerToken;
    async function capture(page, name) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} should fit the viewport`).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
    }
    async function register(page, role) {
        await page.goto('/register.html');
        await page.getByLabel('First Name:', { exact: true }).fill('Test');
        await page.getByLabel('Last Name:', { exact: true }).fill('Person');
        await page.getByLabel('Email:', { exact: true }).fill(email(role));
        await page.getByLabel('Password:', { exact: true }).fill(password);
        if (role === 'recruiter') {
            await page.getByRole('radio', { name: 'Recruiter', exact: true }).check();
            await page.getByLabel('Company Name:', { exact: true }).fill(`Browser test ${suffix}`);
        }
        const response = page.waitForResponse(r => r.url().endsWith('/api/auth/register') && r.request().method() === 'POST');
        await page.getByRole('button', { name: 'Register', exact: true }).click();
        const registered = await response;
        expect(registered.status()).toBe(201);
        const data = await registered.json(); accounts.push(data.user.id);
        if (role === 'recruiter') companyId = data.user.company_id; else seekerToken = data.token;
        await expect(page).toHaveURL(role === 'recruiter' ? /recruiter-dashboard.html/ : /job-search.html/);
        return data;
    }
    try {
        await register(recruiter, 'recruiter');
        await expect(recruiter.locator('.app-identity')).toContainText('Recruiter');
        await recruiter.locator('.app-header').getByRole('link', { name: 'Post a job', exact: true }).click();
        await capture(recruiter, 'job-posting');
        await recruiter.getByLabel('Job title', { exact: true }).fill(title);
        await recruiter.getByLabel('Location', { exact: true }).fill('Montreal');
        await recruiter.getByLabel('Job description', { exact: true }).fill('Build useful things with our team.');
        const saved = recruiter.waitForResponse(r => r.url().endsWith('/api/recruiter/jobs') && r.request().method() === 'POST');
        await recruiter.getByRole('button', { name: 'Save changes' }).click();
        const savedResponse = await saved;
        expect(savedResponse.status()).toBe(201);
        await expect(recruiter.getByRole('link', { name: title, exact: true })).toBeVisible();
        const [savedJobs] = await db.query('SELECT id FROM jobs WHERE company_id = ? AND title = ?', [companyId, title]);
        jobId = savedJobs[0].id;
        const jobRow = recruiter.locator('.job').filter({ hasText: title });
        await jobRow.locator('.status-btn').click();
        await jobRow.getByRole('button', { name: 'Paused', exact: true }).click();
        await expect(recruiter.getByRole('status')).toContainText('saved');
        await recruiter.reload();
        await expect(jobRow.locator('.status-btn')).toContainText('Paused');
        await jobRow.locator('.status-btn').click();
        await jobRow.getByRole('button', { name: 'Open', exact: true }).click();
        await expect(jobRow.locator('.status-btn')).toContainText('Open');

        await register(seeker, 'job_seeker');
        await expect(seeker.locator('.app-identity')).toContainText('Job seeker');
        await expect(recruiter.locator('.app-identity')).toContainText('Recruiter');
        await seeker.locator('.app-header').getByRole('link', { name: 'My profile', exact: true }).click();
        await expect(seeker.getByRole('heading', { name: 'Test Person', exact: true })).toBeVisible();
        await expect(seeker.locator('#profile-resumes')).toBeVisible();
        await capture(seeker, 'profile-empty');
        const uploaded = seeker.waitForResponse(r => r.url().endsWith('/api/resumes') && r.request().method() === 'POST');
        await seeker.locator('#resume-file').setInputFiles({ name: 'Browser CV.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nBrowser resume fixture') });
        const uploadResponse = await uploaded;
        expect(uploadResponse.status()).toBe(201);
        resumeId = (await uploadResponse.json()).resume.id;
        await expect(seeker.locator('#resume-list')).toContainText('Browser CV.pdf');
        const chooser = seeker.waitForEvent('filechooser');
        await seeker.getByRole('button', { name: 'Replace Resume', exact: true }).click();
        const replaced = seeker.waitForResponse(r => r.url().endsWith(`/api/resumes/${resumeId}`) && r.request().method() === 'PUT');
        await (await chooser).setFiles({ name: 'Updated CV.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nUpdated browser resume fixture') });
        expect((await replaced).status()).toBe(200);
        await expect(seeker.locator('#resume-list')).toContainText('Updated CV.pdf');
        await seeker.getByRole('button', { name: 'Edit Profile', exact: true }).click();
        await seeker.locator('#edit-summary-input').fill('Developer looking for a new opportunity.');
        await seeker.locator('#skill-name-input').fill('JavaScript');
        await seeker.getByRole('button', { name: 'Add Skill', exact: true }).click();
        await expect(seeker.locator('#skills-list')).toContainText('JavaScript');
        await seeker.getByRole('button', { name: 'Add Experience', exact: true }).click();
        await seeker.getByLabel('Title', { exact: true }).fill('Software Developer');
        await seeker.getByLabel('Company', { exact: true }).fill('Previous Employer');
        await seeker.getByLabel('Start Date', { exact: true }).fill('2025-01-01');
        await seeker.locator('#experience-form').getByRole('button', { name: 'Save', exact: true }).click();
        await expect(seeker.locator('#experience-list')).toContainText('Previous Employer');
        await seeker.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(seeker.locator('#profile-summary-text')).toHaveText('Developer looking for a new opportunity.');
        await capture(seeker, 'profile');
        await seeker.locator('.app-header').getByRole('link', { name: 'My resumes', exact: true }).click();
        await expect(seeker.locator('#resume-list')).toContainText('Updated CV.pdf');
        await capture(seeker, 'resume-manager');
        await seeker.locator('.app-header').getByRole('link', { name: 'Find jobs', exact: true }).click();
        await seeker.locator('#keyword').fill(suffix);
        await seeker.locator('#job-search-form').getByRole('button').click();
        await expect(seeker.getByRole('link', { name: title, exact: true })).toBeVisible();
        await capture(seeker, 'job-search');
        await seeker.getByRole('link', { name: title, exact: true }).click();
        await expect(seeker.getByRole('heading', { name: title, exact: true })).toBeVisible();
        await expect(seeker.locator('#resume')).toContainText('Updated CV.pdf');
        await seeker.getByRole('link', { name: 'Manage saved resumes', exact: true }).click();
        await expect(seeker).toHaveURL(/resumes.html\?job=/);
        await seeker.getByRole('link', { name: 'Return to job application', exact: true }).click();
        await expect(seeker.locator('#resume')).toContainText('Updated CV.pdf');
        await capture(seeker, 'job-details');
        await seeker.getByRole('button', { name: 'Submit application', exact: true }).click();
        await expect(seeker.getByRole('status')).toContainText('Application submitted on');
        await seeker.reload();
        await expect(seeker.getByRole('status')).toContainText('Application submitted on');
        await expect(seeker.getByRole('button', { name: 'Submit application', exact: true })).toBeHidden();
        await seeker.locator('.app-header').getByRole('link', { name: 'My applications', exact: true }).click();
        await expect(seeker.locator('.status-tag')).toHaveText('Applied');
        await capture(seeker, 'applications');

        await recruiter.goto('/recruiter-dashboard.html');
        await jobRow.getByRole('link', { name: /Total/ }).click();
        await expect(recruiter.getByRole('heading', { name: `Candidates for ${title}` })).toBeVisible();
        await recruiter.getByRole('combobox', { name: 'Application status for Test Person' }).selectOption('under_review');
        await expect(recruiter.getByRole('status')).toHaveText('Application status saved.');
        await capture(recruiter, 'candidates');
        await seeker.reload();
        await expect(seeker.locator('.status-tag')).toHaveText('Under Review');
        for (const [value, label] of [['interview', 'Interview'], ['offered', 'Offered'], ['rejected', 'Rejected']]) {
            await recruiter.getByRole('combobox', { name: 'Application status for Test Person' }).selectOption(value);
            await expect(recruiter.locator('.status-tag')).toHaveText(label);
            await seeker.reload();
            await expect(seeker.locator('.status-tag')).toHaveText(label);
        }
        const downloaded = seeker.waitForEvent('download');
        await seeker.getByRole('button', { name: 'Download submitted resume' }).click();
        expect((await downloaded).suggestedFilename()).toBe('Updated CV.pdf');

        await seeker.locator('.app-header').getByRole('link', { name: 'Settings', exact: true }).click();
        await expect(seeker.locator('[data-field="email"] [data-value]')).toHaveText(email('job_seeker'));
        await capture(seeker, 'settings');
        const passwordRow = seeker.locator('[data-field="password"]');
        await passwordRow.getByRole('button', { name: 'Edit', exact: true }).click();
        await passwordRow.locator('[name="current_password"]').fill('wrong-password');
        await passwordRow.locator('[name="new_password"]').fill('Another-password-123');
        await passwordRow.locator('[name="confirm_password"]').fill('Another-password-123');
        await passwordRow.getByRole('button', { name: 'Save changes' }).click();
        await expect(passwordRow.locator('[data-error]')).toContainText('incorrect');
        await expect(seeker).toHaveURL(/settings.html/);
        await passwordRow.getByRole('button', { name: 'Cancel', exact: true }).click();
        const row = seeker.locator('[data-field="full_name"]');
        await row.getByRole('button', { name: 'Edit', exact: true }).click();
        await row.getByRole('textbox').fill('Updated Test Person');
        await row.getByRole('button', { name: 'Save changes' }).click();
        await expect(row.locator('[data-value]')).toHaveText('Updated Test Person');
        await seeker.reload();
        await expect(seeker.locator('.app-identity')).toContainText('Updated Test Person');
        await seeker.getByRole('button', { name: 'Log out', exact: true }).click();
        await expect(seeker).toHaveURL(/login.html/);
        await seeker.getByLabel('Email:', { exact: true }).fill(email('recruiter'));
        await seeker.getByLabel('Password:', { exact: true }).fill(password);
        await seeker.getByRole('button', { name: 'Login', exact: true }).click();
        await expect(seeker).toHaveURL(/recruiter-dashboard.html/);
        await expect(seeker.locator('.app-identity')).toContainText('Test Person · Recruiter');

        await seeker.getByRole('button', { name: 'Log out', exact: true }).click();
        await seeker.goto(`/job-details.html?id=${jobId}`);
        await expect(seeker).toHaveURL(/login.html\?next=/);
        await seeker.getByLabel('Email:', { exact: true }).fill(email('job_seeker'));
        await seeker.getByLabel('Password:', { exact: true }).fill(password);
        await seeker.getByRole('button', { name: 'Login', exact: true }).click();
        await expect(seeker).toHaveURL(new RegExp(`job-details.html\\?id=${jobId}`));
        await expect(seeker.getByRole('status')).toContainText('Application submitted on');

        for (const page of [seeker, recruiter]) {
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
        await capture(recruiter, 'recruiter-dashboard');
        expect(errors).toEqual([]);
    } finally {
        if (resumeId && seekerToken) await context.request.delete(`/api/resumes/${resumeId}`, { headers: { Authorization: `Bearer ${seekerToken}` } });
        if (jobId) {
            await db.query('DELETE FROM applications WHERE job_id = ?', [jobId]);
            await db.query('DELETE FROM jobs WHERE id = ?', [jobId]);
        }
        for (const id of accounts) await db.query('DELETE FROM users WHERE id = ?', [id]);
        if (companyId) await db.query('DELETE FROM companies WHERE id = ?', [companyId]);
        await context.close();
    }
});

test.afterAll(async () => { await db.end(); });

/* =====================================================================
   JOB POSTING PAGE
   job-posting.html        -> create a job  (POST)
   job-posting.html?id=7   -> edit job 7    (GET to fill the form, PUT to save)
   Validation lives in jobPostingController.js, not here.
   ===================================================================== */

const API   = '/api/recruiter/jobs';
const jobId = new URLSearchParams(window.location.search).get('id');   // null = create mode

const form       = document.getElementById('job-form');
const saveButton = document.getElementById('save-btn');
const errorBox   = document.getElementById('form-error');

// The form fields; each id matches a column name the backend expects
const FIELDS = ['title', 'openings', 'country', 'language', 'location', 'job_type', 'description'];

function request(method, url, body) {
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: body ? JSON.stringify(body) : undefined
    });
}

function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
}

// EDIT MODE: fill the form with the saved job
async function loadJob() {
    document.getElementById('page-title').textContent = 'Edit the job post';

    const response = await request('GET', API + '/' + jobId);
    if (response.status === 401 || response.status === 403) { window.location.href = 'login.html'; return; }
    if (!response.ok) { showError('Could not load this job.'); return; }

    const job = await response.json();
    FIELDS.forEach(function (name) {
        document.getElementById(name).value = job[name] ?? '';
    });
}

// SAVE: send every field, show whatever error the server answers with
form.addEventListener('submit', async function (event) {
    event.preventDefault();
    errorBox.hidden = true;
    saveButton.disabled = true;

    const data = {};
    FIELDS.forEach(function (name) {
        data[name] = document.getElementById(name).value;
    });

    try {
        const response = await request(jobId ? 'PUT' : 'POST', jobId ? API + '/' + jobId : API, data);

        if (response.status === 401 || response.status === 403) { window.location.href = 'login.html'; return; }
        if (!response.ok) {
            const body = await response.json().catch(function () { return {}; });
            throw new Error(body.error || 'Could not save the job.');
        }

        window.location.href = 'recruiter-dashboard.html';
    } catch (error) {
        showError(error.message);
        saveButton.disabled = false;
    }
});

if (jobId) loadJob();
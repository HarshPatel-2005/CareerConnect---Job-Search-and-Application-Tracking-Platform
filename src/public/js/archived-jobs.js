/* =====================================================================
   ARCHIVED JOBS – JAVASCRIPT
   ---------------------------------------------------------------------
   1. Loads the recruiter's archived jobs from the server
   2. Lets the recruiter filter and sort them
   3. Lets the recruiter unarchive a job (it moves back to the Jobs tab)
   ===================================================================== */

const jobList       = document.getElementById('list');
const titleBox      = document.getElementById('q');
const locationBox   = document.getElementById('loc');
const sortDropdown  = document.getElementById('sort');
const orderDropdown = document.getElementById('order');
const countLabel    = document.getElementById('count');
const emptyMessage  = document.getElementById('empty');
const messageBox    = document.getElementById('dashboard-message');

const allJobs = [];   // one element per archived job row

const STATUS_LABELS = { open: 'Open', paused: 'Paused', closed: 'Closed' };

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}


/* ---------- FILTERING ---------- */

function filterJobs() {
    const wantedTitle    = titleBox.value.trim().toLowerCase();
    const wantedLocation = locationBox.value.trim().toLowerCase();
    let shownCount = 0;

    for (let i = 0; i < allJobs.length; i++) {
        const job = allJobs[i];
        const matches = job.dataset.title.toLowerCase().includes(wantedTitle) &&
                        job.dataset.loc.toLowerCase().includes(wantedLocation);
        job.hidden = !matches;
        if (matches) shownCount++;
    }

    countLabel.textContent = '(' + shownCount + ')';
    emptyMessage.textContent = allJobs.length === 0
        ? 'No archived jobs.'
        : 'No jobs match these filters. Clear a filter to see more.';
    emptyMessage.hidden = shownCount > 0;
}


/* ---------- SORTING ---------- */

function getSortValue(job, sortChoice) {
    if (sortChoice === 'date')  return job.dataset.date;
    if (sortChoice === 'title') return job.dataset.title.toLowerCase();
}

function sortJobs() {
    const sortChoice  = sortDropdown.value;
    const orderChoice = orderDropdown.value;

    allJobs.sort(function (a, b) {
        const valueA = getSortValue(a, sortChoice);
        const valueB = getSortValue(b, sortChoice);
        let answer = 0;
        if (valueA < valueB) answer = -1;
        else if (valueA > valueB) answer = 1;
        if (orderChoice === 'desc') answer = answer * -1;
        return answer;
    });

    for (let i = 0; i < allJobs.length; i++) {
        jobList.appendChild(allJobs[i]);
    }
}


/* ---------- UNARCHIVE ---------- */

async function unarchiveJob(row, button) {
    button.disabled = true;
    try {
        const response = await CareerConnect.request(`/api/recruiter/jobs/${row.dataset.id}/archive`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archived: false })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to unarchive job.');

        // Remove the row from the page and from our list
        allJobs.splice(allJobs.indexOf(row), 1);
        row.remove();
        filterJobs();
        messageBox.textContent = 'Job unarchived. It is back on your Jobs tab.';
    } catch (error) {
        messageBox.textContent = error.message;
        button.disabled = false;
    }
}


/* ---------- LOAD FROM THE DATABASE ---------- */

async function loadArchivedJobs() {
    try {
        const token = sessionStorage.getItem('token');   // same key as the dashboard
        const response = await fetch('/api/recruiter/jobs?archived=true', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = 'login.html';          // use your real login page name
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch archived jobs');

        const jobs = await response.json();

        jobList.innerHTML = '';
        allJobs.length = 0;

        jobs.forEach(job => {
            const created = new Date(job.created_at);
            const row = document.createElement('div');
            row.className = 'row arch job';
            row.dataset.id = job.id;
            row.setAttribute('data-title', job.title);
            row.setAttribute('data-loc', job.location);
            row.setAttribute('data-date', created.toISOString().split('T')[0]);

            const createdText = created.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const archivedText = job.archived_at
                ? '<br>Archived: ' + new Date(job.archived_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : '';
            const status = STATUS_LABELS[job.status] ? job.status : 'open';

            row.innerHTML = `
                <div>
                    <a class="job-title" href="job-posting.html?id=${job.id}">${escapeHTML(job.title)}</a>
                    <div class="job-meta">${escapeHTML(job.location)}<br>Created: ${createdText}${archivedText}</div>
                </div>
                <div class="cand">
                    <div class="total ${job.candidates_count > 0 ? '' : 'empty'}">${job.candidates_count} Total<br>Candidates</div>
                </div>
                <div class="status-static"><span class="dot ${status}"></span>${STATUS_LABELS[status]}</div>
                <div><button type="button" class="btn-small">Unarchive</button></div>
            `;

            row.querySelector('.btn-small').addEventListener('click', function () {
                unarchiveJob(row, this);
            });

            jobList.appendChild(row);
            allJobs.push(row);
        });

        sortJobs();
        filterJobs();
    } catch (error) {
        console.error('Error loading archived jobs:', error);
        jobList.innerHTML = '<div class="empty-state">Failed to load archived jobs. Please try again later.</div>';
    }
}


/* ---------- REACT TO THE PERSON ---------- */

titleBox.addEventListener('input', filterJobs);
locationBox.addEventListener('input', filterJobs);
sortDropdown.addEventListener('change', sortJobs);
orderDropdown.addEventListener('change', sortJobs);

document.addEventListener('DOMContentLoaded', loadArchivedJobs);
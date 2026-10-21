/* =====================================================================
   RECRUITER DASHBOARD – JAVASCRIPT
   ---------------------------------------------------------------------
   This file does three small jobs:
     1. Gives every job a status button (Open / Paused / Closed)
     2. Hides job cards that don't match what you typed in the filters
     3. Puts the job cards in order (by date or title)

   ===================================================================== */


/* =====================================================================
   STEP 1: SETTINGS (edit these)
   ===================================================================== */

/* The choices in the status menu.
   To add a status, copy one line. (For a new color, add a .dot.yourvalue rule in the CSS.) */
const STATUSES = [
    { value: 'open',   label: 'Open'   },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' }
];


/* =====================================================================
   STEP 2: GRAB THE PIECES OF THE PAGE
   ===================================================================== */

const jobList      = document.getElementById('list');    // the area that holds all the jobs
const titleBox     = document.getElementById('q');       // "Job title" search box
const locationBox  = document.getElementById('loc');     // "Location" search box
const sortDropdown = document.getElementById('sort');    // "Sort by" dropdown
const orderDropdown = document.getElementById('order');  // "Order" dropdown
const countLabel   = document.getElementById('count');   // the "(3)" next to the heading
const emptyMessage = document.getElementById('empty');   // "No jobs match..." message
const selectAllBox = document.getElementById('all');     // the checkbox in the table header

/* Every element with the class "job" (one per job card).
   Array.from turns them into a list we can loop over and sort. */
const allJobs = Array.from(document.querySelectorAll('.job'));


/* =====================================================================
   STEP 3: STATUS BUTTONS
   ---------------------------------------------------------------------
   Each job has an empty <div class="status"></div>.
   We fill it with a button, and a hidden menu that opens when you click.
   ===================================================================== */

/* Update the button so it shows the job's current status. */
function showStatus(job) {
    const button = job.querySelector('.status-btn');
    const dot    = job.querySelector('.status-btn .dot');
    const text   = job.querySelector('.status-btn .label');

    // Look through the STATUSES list for the one that matches this job
    for (let i = 0; i < STATUSES.length; i++) {
        if (STATUSES[i].value === job.dataset.status) {
            text.textContent = STATUSES[i].label;        // change the words
            dot.className = 'dot ' + STATUSES[i].value;  // change the dot color
        }
    }
}

/* Close every status menu on the page. */
function closeAllMenus() {
    const menus = document.querySelectorAll('.menu');

    for (let i = 0; i < menus.length; i++) {
        menus[i].hidden = true;
    }
}

/* Build the button and menu for one job. */
function setupStatus(job) {
    // If the job has no status written in the HTML, start it as "open"
    if (!job.dataset.status) {
        job.dataset.status = 'open';
    }

    // Put the button and an empty menu inside <div class="status">
    const holder = job.querySelector('.status');
    holder.innerHTML =
        '<button type="button" class="status-btn">' +
            '<span class="dot"></span>' +
            '<span class="label"></span>' +
        '</button>' +
        '<div class="menu" hidden></div>';

    const button = holder.querySelector('.status-btn');
    const menu   = holder.querySelector('.menu');

    // Add one menu choice for each status in the STATUSES list
    for (let i = 0; i < STATUSES.length; i++) {
        const choice = STATUSES[i];

        const item = document.createElement('button');
        item.type = 'button';
        item.innerHTML = '<span class="dot ' + choice.value + '"></span>' + choice.label;

        // When this choice is clicked: save it, update the button, close the menu
        item.addEventListener('click', function () {
            job.dataset.status = choice.value;
            showStatus(job);
            menu.hidden = true;
        });

        menu.appendChild(item);
    }

    // When the status button is clicked: open its menu (and close any others)
    button.addEventListener('click', function (event) {
        event.stopPropagation();        // stops the "click anywhere to close" rule below

        const wasClosed = menu.hidden;
        closeAllMenus();
        menu.hidden = !wasClosed;       // if it was closed, open it; if it was open, keep it closed
    });

    showStatus(job);
}

/* Do the setup for every job. */
for (let i = 0; i < allJobs.length; i++) {
    setupStatus(allJobs[i]);
}

/* Clicking anywhere else on the page closes the menus. */
document.addEventListener('click', closeAllMenus);


/* =====================================================================
   STEP 4: FILTERING
   ===================================================================== */

function filterJobs() {
    // What the person typed, in lowercase so "HR" and "hr" count as the same
    const wantedTitle    = titleBox.value.trim().toLowerCase();
    const wantedLocation = locationBox.value.trim().toLowerCase();

    let shownCount = 0;

    for (let i = 0; i < allJobs.length; i++) {
        const job = allJobs[i];

        // "includes" asks: is the typed text found inside the job's text?
        // An empty search box is found inside everything, so nothing gets hidden.
        const titleMatches    = job.dataset.title.toLowerCase().includes(wantedTitle);
        const locationMatches = job.dataset.loc.toLowerCase().includes(wantedLocation);

        if (titleMatches && locationMatches) {
            job.hidden = false;
            shownCount = shownCount + 1;
        } else {
            job.hidden = true;
        }
    }

    countLabel.textContent = '(' + shownCount + ')';   // update the number in the heading
    emptyMessage.hidden = shownCount > 0;              // show the message only when nothing matches
}


/* =====================================================================
   STEP 5: SORTING
   ===================================================================== */

/* Given a job and the "Sort by" choice, return the value to compare.
   To add a new sort option:
     1. Add an <option value="your-value"> in the HTML "Sort by" dropdown
     2. Add another "if" below with the same value
     3. Add a matching data-your-value="..." on each job in the HTML
        (for example data-city="Austin") */
function getSortValue(job, sortChoice) {
    if (sortChoice === 'date') {
        return job.dataset.date;
    }

    if (sortChoice === 'title') {
        return job.dataset.title.toLowerCase();
    }

    // To add one: if (sortChoice === 'your-value') { return job.dataset.yourValue; }
}

function sortJobs() {
    const sortChoice  = sortDropdown.value;
    const orderChoice = orderDropdown.value;

    // sort() compares two jobs (a and b) at a time and answers:
    //   -1 = a goes first,  1 = b goes first,  0 = no difference
    allJobs.sort(function (a, b) {
        const valueA = getSortValue(a, sortChoice);
        const valueB = getSortValue(b, sortChoice);

        let answer = 0;
        if (valueA < valueB) {
            answer = -1;
        } else if (valueA > valueB) {
            answer = 1;
        }

        // "Descending" flips the answer so the biggest/latest comes first
        if (orderChoice === 'desc') {
            answer = answer * -1;
        }

        return answer;
    });

    // Adding a card to the list moves it to the end.
    // So adding them one by one in sorted order puts them in that order on the page.
    for (let i = 0; i < allJobs.length; i++) {
        jobList.appendChild(allJobs[i]);
    }
}


/* =====================================================================
   STEP 6: REACT TO THE PERSON
   ===================================================================== */

// Typing in either search box -> filter again
titleBox.addEventListener('input', filterJobs);
locationBox.addEventListener('input', filterJobs);

// Changing either dropdown -> sort again
sortDropdown.addEventListener('change', sortJobs);
orderDropdown.addEventListener('change', sortJobs);

// Ticking the header checkbox -> tick (or untick) every visible job's checkbox
selectAllBox.addEventListener('change', function () {
    for (let i = 0; i < allJobs.length; i++) {
        if (!allJobs[i].hidden) {
            allJobs[i].querySelector('input[type=checkbox]').checked = selectAllBox.checked;
        }
    }
});


/* =====================================================================
   STEP 7: LOAD THE JOBS FROM THE DATABASE
   ---------------------------------------------------------------------
   Each job title is a link to job-posting.html?id=<job id>.
   That page sees the id and fills the form with the saved job.
   ===================================================================== */

async function loadRecruiterJobs() {
    try {
        const token = localStorage.getItem('token');   // must match the key your login page saves
        const response = await fetch('/api/recruiter/jobs', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = 'login.html';       // use your real login page name
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch jobs');

        const jobs = await response.json();

        // Clear the static list container
        jobList.innerHTML = '';
        allJobs.length = 0; // Clear the tracking array

        if (jobs.length === 0) {
            countLabel.textContent = '(0)';
            emptyMessage.hidden = false;
            return;
        }

        // Build HTML dynamically for each job returned from the database
        jobs.forEach(job => {
            const formattedDate = new Date(job.created_at).toISOString().split('T')[0];
            const displayDate = new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

            const rowDiv = document.createElement('div');
            rowDiv.className = 'row job';
            rowDiv.setAttribute('data-title', job.title);
            rowDiv.setAttribute('data-loc', job.location);
            rowDiv.setAttribute('data-date', formattedDate);
            rowDiv.setAttribute('data-candidates', job.candidates_count);
            rowDiv.setAttribute('data-status', job.status);

            rowDiv.innerHTML = `
                <span><input type="checkbox" aria-label="Select job"></span>
                <div>
                    <a class="job-title" href="job-posting.html?id=${job.id}">${escapeHTML(job.title)}</a>
                    <div class="job-meta">${escapeHTML(job.location)}<br>Created: ${displayDate}</div>
                </div>
                <div class="cand">
                    ${job.candidates_count > 0 ? `
                        <a class="total" href="#">${job.candidates_count} Active<br>Candidates</a>
                        <div class="stats">
                            <div><b>${job.awaiting_count}</b>Awaiting</div>
                            <div class="link"><b>${job.reviewed_count}</b>Reviewed</div>
                            <div><b>${job.contacting_count}</b>Contacting</div>
                            <div><b>${job.hired_count}</b>Hired</div>
                        </div>
                    ` : `
                        <div class="total empty">0 Active<br>Candidates</div>
                        <span class="job-meta" style="margin-left:auto">No candidates yet.</span>
                    `}
                </div>
                <div class="status"></div>
            `;

            jobList.appendChild(rowDiv);
            allJobs.push(rowDiv);
            setupStatus(rowDiv);
        });

        sortJobs();
        filterJobs();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        jobList.innerHTML = '<div class="empty-state">Failed to load jobs. Please try again later.</div>';
    }
}

// Simple HTML escape helper to prevent XSS injection
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Load the jobs when the page starts
document.addEventListener('DOMContentLoaded', () => {
    loadRecruiterJobs();
});
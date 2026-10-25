AI Log #1 (Sprint #1):

Task: Generate 10 User Stories for the Project
Purpose of AI: Brainstorming in order to develop the different user stories
Link: https://claude.ai/share/8cac0af5-754f-40ab-91bb-d02a8de5d742
AI-Suggested Content: The AI generated the different user stories
Validation: Manual review and peer review. Verified the output with our team to make sure that it makes sense and that the generated content is valid
Decision: Accepted
Reflection: We learned how to write user stories which was useful to us to create the 5 user stories by brainstorming.
Responsible Person: Harsh Patel (40341498)

AI Log #2 (Sprint #1):

Task: Generate the route, controller and the JS for the profile page
Purpose of AI: Code generation
Link: https://claude.ai/share/b95a5daa-27d4-46b1-a706-f86026be7c10
AI-Suggested Content: The AI generated the code which makes the HTML and CSS that I worked on responsive
Validation: Manual review by testing the database. I also forced using a fixed user since we do not have a login page ready on this test so instead I tested it
using a fake user by taking the id of the user #1, which is the first registered user
Decision: Accepted
Reflection: It was useful because it was able to get the task done in a short amount of time while understanding how the logic works manually. I was reading through it to make sure the logic follows the way it should. Most of which was just a quality change, I was manually understanding and making sure it produced what I wanted to produce.
Responsible Person: Harsh Patel (40341498)

AI Log #3 (Sprint #2):

Task: Generate a user story for the recruiter dashboard
Purpose of AI: User Story Generation
Link: https://claude.ai/share/7a95b9db-b409-47c1-8709-3e23dcec42cb
AI-Suggested Content: The AI generated the user story that gives me a roadmap to follow during the development of the feature
Validation: Reading through the user story and making sure it's to our liking. Modifying anything we think could be better in order to aid us during our development.
Decision: Accepted with modification
Reflection: The user story helped with the brainstorming since it allows us to follow a roadmap and figure out how exactly the feature should be developed. We also modified it to our liking so that 
we can have an easier time with it's development.
Responsible Person: Harsh Patel (40341498)

AI Log #4 (Sprint #2):

Task: Help Develop the frontend of the recruiter dashboard
Purpose of AI: Code Generation
Link: https://claude.ai/share/a77c6d26-c2f6-42fe-9ce0-a4e337277971
AI-Suggested Content: With references, and explanations, the AI model helped develop a frontend using the data we already have. It generated a frontend with the color scheme we're following and with a style that matches
the rest of the development
Validation: Manual Changes alone with some ideas taken from peers
Decision: Taken with some modifications
Reflection: I made sure to ask the AI to annotate what is each section to help with development in case there was anything we wanted to change
Responsible Person: Harsh Patel (40341498)

AI Log #5 (Sprint #2):

Task: Help Develop the backend of the recruiter dashboard
Purpose of AI: Code Generation
Prompt: 

(Given the frontend code)

Could you help me develop the frontend. 
Right now the HTML has hardcoded values, but the goal is that it updates these values based off the information that's given. 
The "Post A Job" will be sending me to another page where I can write down the information, so that doesn't need anything until the post a job page is actually developed. 
What I do want though is that the dashboard for now shows the information based off the data it has, which should be none for now 

Output:

To connect your recruiter dashboard to your backend database and replace the hardcoded HTML with dynamic data, you need three main components:

A Database Table for Jobs: Since your schema only has companies, company_invites, and users, you need a jobs table to store recruiter job postings and candidate counts.

A Backend Route and Controller: An API endpoint that fetches the jobs for the logged-in recruiter from the database.

Frontend JavaScript Fetch Integration: Code that fetches the job data from your new API endpoint and dynamically builds or renders the job rows in your dashboard (handling the empty state correctly when there are no jobs).

Step 1: Create the jobs Table
Add this to your MySQL initialization script:

SQL
-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status ENUM('open', 'paused', 'closed') DEFAULT 'open',
    candidates_count INT DEFAULT 0,
    awaiting_count INT DEFAULT 0,
    reviewed_count INT DEFAULT 0,
    contacting_count INT DEFAULT 0,
    hired_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

Step 2: Create the Recruiter Jobs Controller & Routes
1. Controller (src/controllers/recruiterController.js)
Create a controller to query jobs associated with the recruiter's company. (Note: This assumes you have authentication middleware that attaches user details like req.user.company_id to the request).

JavaScript
const db = require('../config/db'); // Adjust path to your db pool export

const getRecruiterJobs = async (req, res) => {
    try {
        // Assuming your auth middleware populates req.user
        const companyId = req.user?.company_id;

        if (!companyId) {
            return res.status(403).json({ error: 'Unauthorized or no company associated with this account.' });
        }

        const [rows] = await db.query(
            `SELECT id, title, location, status, created_at, 
                    candidates_count, awaiting_count, reviewed_count, contacting_count, hired_count 
             FROM jobs WHERE company_id = ? ORDER BY created_at DESC`,
            [companyId]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getRecruiterJobs
};

2. Routes (src/routes/recruiterRoutes.js)
Create the router file:

JavaScript
const express = require('express');
const router = express.Router();
const { getRecruiterJobs } = require('../controllers/recruiterController');
// Import your authentication middleware (e.g., ensureAuthenticated, verifyRecruiter)
// const { verifyToken } = require('../middleware/authMiddleware');

// router.get('/jobs', verifyToken, getRecruiterJobs);
router.get('/jobs', getRecruiterJobs); // Add middleware as appropriate for your app

module.exports = router;

3. Register Route in src/app.js
Update your createApp function inside app.js to mount the new recruiter routes:

JavaScript
const recruiterRoutes = require('./routes/recruiterRoutes');

// Inside createApp():
app.use('/api/recruiter', recruiterRoutes);

Step 3: Update the Frontend to Fetch and Render Dynamic Data
Remove the hardcoded .row.job HTML blocks from your index.html (or recruiter-dashboard.html) inside <div id="list">, leaving it empty so it can be populated dynamically:

HTML
<div id="list">
    <!-- Dynamically loaded jobs will appear here -->
</div>
<div class="empty-state" id="empty">No jobs match these filters. Clear a filter to see more.</div>
Then, add a fetch call inside your JavaScript file (recruiter-dashboard.js) when the page loads:

// Function to fetch jobs from the backend API and populate the dashboard
async function loadRecruiterJobs() {
    try {
        const response = await fetch('/api/recruiter/jobs');
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
                    <div class="job-title">${escapeHTML(job.title)}</div>
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

// Call loadRecruiterJobs when the page initializes instead of running sort/filter statically on empty/hardcoded rows
document.addEventListener('DOMContentLoaded', () => {
    loadRecruiterJobs();
});

AI-Suggested Content: Output was the idea that I had in mind. I had to review it and test it but it helped with generating the code.
Validation: Solo and team review to make sure the code was to our liking
Decision: Taken with some modifications
Reflection: I made sure to ask the AI to annotate what is each section to help with development in case there was anything we wanted to change. I also verified testing the values. I had to put in data into the MySQL table
and see if the code was properly working.
Responsible Person: Harsh Patel (40341498)

AI Log #6 (Sprint #2):

Task: Help test the recruiter dashboard and job posting
Purpose of AI: Code Generation for test file
Link: https://claude.ai/share/a82da295-7f90-452e-b5b2-1ed1055634e7
AI-Suggested Content: The AI model created a jwt test file and explained to me how it worked exactly
Validation: Peer review and manual review
Decision: Accepted
Reflection: Because I have never created a test file before, the AI helped me understand how it works exactly. It was taken and understood how exactly it works and what the expected output is supposed to be.
Responsible Person: Harsh Patel (40341498)

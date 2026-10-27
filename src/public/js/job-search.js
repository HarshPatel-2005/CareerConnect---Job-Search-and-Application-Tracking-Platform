document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('job-search-form');
    const results = document.getElementById('job-results');
    const status = document.getElementById('search-status');
    const count = document.getElementById('results-count');

    async function loadJobs() {
        status.textContent = 'Loading jobs...';
        results.innerHTML = '';

        const keyword = document.querySelector('#job-search-form input[name="search"]').value.trim();
const location = document.getElementById('location').value.trim();
const jobType = document.getElementById('job-type').value;

        const params = new URLSearchParams();

        if (keyword) params.set('search', keyword);
        if (location) params.set('location', location);
        if (jobType) params.set('job_type', jobType);

        try {
            const response = await fetch(`/api/jobs?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Unable to load jobs');
            }

            const data = await response.json();
            const jobs = data.jobs || [];

            status.textContent = '';
            count.textContent = `${jobs.length} job(s) found`;

            if (jobs.length === 0) {
                results.innerHTML = `
                    <div class="empty-state">
                        <h3>No jobs found</h3>
                        <p>Try changing your search filters or check back later.</p>
                    </div>
                `;
                return;
            }

            jobs.forEach(job => {
                const card = document.createElement('article');
                card.className = 'job-card';

                const title = document.createElement('h3');
                const detailsLink = document.createElement('a');
                detailsLink.href = `/job-details.html?id=${encodeURIComponent(job.id)}`;
                detailsLink.textContent = job.title;
                title.appendChild(detailsLink);

                const company = document.createElement('p');
                company.className = 'company-name';
                company.textContent = job.company_name || 'Company';

                const meta = document.createElement('p');
                meta.className = 'job-meta';
                meta.textContent = [
                    job.location,
                    job.country,
                    job.job_type?.replaceAll('_', ' ')
                ].filter(Boolean).join(' • ');

                const description = document.createElement('p');
                description.className = 'job-description';
                description.textContent = job.description || 'No description provided.';

                const applyLink = document.createElement('a');
                applyLink.href = detailsLink.href;
                applyLink.textContent = 'View details and apply';
                card.append(title, company, meta, description, applyLink);
                results.appendChild(card);
            });
        } catch (error) {
            status.textContent = 'Could not load jobs. Please try again.';
            count.textContent = '';
            console.error(error);
        }
    }

    if (form && results && status && count) {
        form.addEventListener('submit', event => {
            event.preventDefault();
            loadJobs();
        });

        loadJobs();
    }
});

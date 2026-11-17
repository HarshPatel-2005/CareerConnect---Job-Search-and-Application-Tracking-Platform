document.addEventListener('DOMContentLoaded', () => {
    if (CareerConnect.session()?.user.role !== 'job_seeker') return;
    const list = document.getElementById('saved-jobs');
    const message = document.getElementById('message');
    const retry = document.getElementById('retry');
    async function load() {
        retry.hidden = true;
        message.textContent = 'Loading saved jobs...';
        try {
            const jobs = await CareerConnect.savedJobs();
            list.replaceChildren();
            message.textContent = jobs.length ? '' : 'No saved jobs yet. Save a job while browsing to find it here.';
            for (const job of jobs) {
                const card = document.createElement('article'); card.className = 'job-card'; card.dataset.id = job.id;
                const heading = document.createElement('h2');
                const link = document.createElement('a'); link.textContent = job.title;
                link.href = `/job-details.html?id=${encodeURIComponent(job.id)}`; heading.append(link);
                const company = document.createElement('p'); company.textContent = `${job.company_name} · ${job.location}`;
                const deadline = document.createElement('p'); deadline.textContent = CareerConnect.deadlineLabel(job.deadline);
                const status = document.createElement('p'); status.className = 'status-tag';
                status.textContent = job.expired ? 'Deadline passed' : ({ open: 'Open', paused: 'Paused', closed: 'Closed' }[job.status] || job.status);
                card.append(heading, company, deadline, status, CareerConnect.createSaveButton(job, message));
                list.append(card);
            }
        } catch (error) { message.textContent = error.message; retry.hidden = false; }
    }
    window.addEventListener('saved-jobs-changed', event => {
        if (event.detail.saved) return;
        const card = [...list.children].find(item => item.dataset.id === event.detail.id);
        const focusTarget = card?.nextElementSibling || card?.previousElementSibling;
        card?.remove();
        if (!list.children.length) message.textContent = 'No saved jobs yet. Save a job while browsing to find it here.';
        (focusTarget?.querySelector('button') || document.querySelector('main h1'))?.focus();
    });
    retry.addEventListener('click', load);
    load();
});

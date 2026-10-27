document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('token');
    const message = document.getElementById('message');
    if (!token) { window.location.href = '/login.html'; return; }
    try {
        const response = await fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load jobs.');
        const list = document.getElementById('jobs');
        for (const job of data.jobs) {
            const card = document.createElement('article');
            card.className = 'job-card';
            const heading = document.createElement('h2');
            const link = document.createElement('a');
            link.href = `/job-details.html?id=${encodeURIComponent(job.id)}`;
            link.textContent = job.title;
            heading.append(link);
            const details = document.createElement('p');
            details.textContent = `${job.company_name} · ${job.location}`;
            card.append(heading, details);
            list.append(card);
        }
        message.textContent = data.jobs.length ? '' : 'No open jobs yet. Please check back later.';
    } catch (error) {
        message.className = 'error';
        message.textContent = error.message;
    }
});

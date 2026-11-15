document.addEventListener('DOMContentLoaded', async () => {
    const current = CareerConnect.session();
    if (!current) return;

    const list = document.getElementById('applications');
    const message = document.getElementById('message');
    const picker = document.getElementById('job-select');

    // This page is for recruiters only. Job seekers use applications.js.
    if (current.user.role !== 'recruiter') {
        message.textContent = 'Recruiter account required.';
        message.className = 'error';
        return;
    }

    const statuses = { applied: 'Applied', under_review: 'Under Review', interview: 'Interview', offered: 'Offered', rejected: 'Rejected' };
    const node = (tag, text, className) => {
        const el = document.createElement(tag); el.textContent = text;
        if (className) el.className = className;
        return el;
    };
    async function json(url, options) {
        const response = await CareerConnect.request(url, options);
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to load applications.');
        return body;
    }
    function render(records) {
        list.replaceChildren();
        message.className = '';
        message.textContent = records.length ? '' : 'No applications received for this posting yet.';
        for (const record of records) {
            const card = node('article', '', 'job-card');
            const heading = node('h2', '');
            const link = node('a', record.full_name);
            link.href = `/profile.html?id=${record.user_id}`;
            heading.append(link); card.append(heading);
            card.append(node('p', record.email));
            card.append(node('p', `Applied ${new Date(record.applied_at).toLocaleString()} · ${record.resume_name}`));
            card.append(node('span', statuses[record.status] || 'Applied', 'status-tag'));
            const download = node('button', 'Download submitted resume', 'app-button'); download.type = 'button';
            download.addEventListener('click', async () => {
                try {
                    const response = await CareerConnect.request(`/api/applications/${record.id}/resume`);
                    if (!response.ok) throw new Error('Unable to download the submitted resume.');
                    const url = URL.createObjectURL(await response.blob());
                    const a = document.createElement('a'); a.href = url; a.download = record.resume_name; a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (error) { message.textContent = error.message; message.className = 'error'; }
            });
            const actions = node('div', '', 'application-actions'); actions.append(download);

            const label = node('label', 'Application status');
            const select = document.createElement('select'); select.setAttribute('aria-label', `Application status for ${record.full_name}`);
            for (const [value, text] of Object.entries(statuses)) select.add(new Option(text, value));
            select.value = record.status;
            select.addEventListener('change', async () => {
                select.disabled = true;
                try {
                    // Keep the server's answer so we know if the job just filled up
                    const result = await json(`/api/candidates/${record.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: select.value }) });
                    card.querySelector('.status-tag').textContent = statuses[select.value];
                    record.status = select.value; message.textContent = 'Application status saved.';

                    // The job is full. The server rejected the other waiting applications
                    // and closed the job, so reload the list to show it.
                    if (result.job_closed) {
                        await loadJob(picker.value);
                        message.className = '';
                        message.textContent = 'All openings are filled. The job was closed and '
                            + result.auto_rejected + ' other application(s) were marked Rejected.';
                    }
                } catch (error) { select.value = record.status; message.textContent = error.message; }
                finally { select.disabled = false; }
            });
            label.append(select); actions.append(label);

            card.append(actions); list.append(card);
        }
    }
    async function loadJob(id) {
        if (!id) { list.replaceChildren(); message.textContent = 'Choose a job posting to review its applications.'; return; }
        message.textContent = 'Loading applications…';
        try {
            const data = await json(`/api/candidates/job/${encodeURIComponent(id)}`);
            document.querySelector('h1').textContent = `Candidates for ${data.job.title}`;
            render(data.applications);
        } catch (error) { message.textContent = error.message; message.className = 'error'; }
    }
    try {
        const jobs = await json('/api/recruiter/jobs');
        for (const job of jobs) picker.add(new Option(job.title, job.id));
        const id = new URLSearchParams(location.search).get('id');
        if (jobs.some(job => String(job.id) === id)) picker.value = id;
        picker.addEventListener('change', () => {
            history.replaceState(null, '', `/candidates-dashboard.html${picker.value ? `?id=${picker.value}` : ''}`);
            loadJob(picker.value);
        });
        await loadJob(picker.value);
        if (!jobs.length) message.textContent = 'Create a job posting first to receive applications.';
    } catch (error) { message.textContent = error.message; message.className = 'error'; }
});
document.addEventListener('DOMContentLoaded', async () => {
    const current = CareerConnect.session();
    if (!current) return;
    const recruiter = current.user.role === 'recruiter';
    const list = document.getElementById('applications');
    const message = document.getElementById('message');
    const picker = document.getElementById('job-select');
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
        message.textContent = records.length ? '' : recruiter ? 'No applications received for this posting yet.' : 'You have not applied yet. Find a job to get started.';
        if (!records.length && !recruiter) {
            const link = node('a', 'Find jobs'); link.href = '/job-search.html'; list.append(link);
        }
        for (const record of records) {
            const card = node('article', '', 'job-card');
            const heading = node('h2', '');
            const link = node('a', recruiter ? record.full_name : record.title);
            link.href = recruiter ? `/profile.html?id=${record.user_id}` : `/job-details.html?id=${record.job_id}`;
            heading.append(link); card.append(heading);
            card.append(node('p', recruiter ? record.email : `${record.company_name} · ${record.location}`));
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
            if (recruiter) {
                const label = node('label', 'Application status');
                const select = document.createElement('select'); select.setAttribute('aria-label', `Application status for ${record.full_name}`);
                for (const [value, text] of Object.entries(statuses)) select.add(new Option(text, value));
                select.value = record.status;
                select.addEventListener('change', async () => {
                    select.disabled = true;
                    try {
                        await json(`/api/applications/${record.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: select.value }) });
                        card.querySelector('.status-tag').textContent = statuses[select.value];
                        record.status = select.value; message.textContent = 'Application status saved.';
                    } catch (error) { select.value = record.status; message.textContent = error.message; }
                    finally { select.disabled = false; }
                });
                label.append(select); actions.append(label);
            }
            card.append(actions); list.append(card);
        }
    }
    async function loadJob(id) {
        if (!id) { list.replaceChildren(); message.textContent = 'Choose a job posting to review its applications.'; return; }
        message.textContent = 'Loading applications…';
        try {
            const data = await json(`/api/applications/job/${encodeURIComponent(id)}`);
            document.querySelector('h1').textContent = `Candidates for ${data.job.title}`;
            render(data.applications);
        } catch (error) { message.textContent = error.message; message.className = 'error'; }
    }
    try {
        if (recruiter && picker) {
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
        } else if (!recruiter) render((await json('/api/applications')).applications);
    } catch (error) { message.textContent = error.message; message.className = 'error'; }
});

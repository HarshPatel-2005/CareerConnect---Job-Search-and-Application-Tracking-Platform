document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const id = new URLSearchParams(window.location.search).get('id');
    const message = document.getElementById('message');
    const form = document.getElementById('apply-form');
    const panel = document.getElementById('apply-panel');
    const select = document.getElementById('resume');
    const button = document.getElementById('apply-button');
    const refresh = document.getElementById('refresh-resumes');
    let submitted = false;

    function showMessage(text, type = '') {
        message.textContent = text;
        message.className = type;
    }
    async function api(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.error || 'Request failed. Please try again.');
            error.code = data.code;
            throw error;
        }
        return data;
    }
    function showSubmitted(application) {
        submitted = true;
        panel.hidden = true;
        showMessage(`Application submitted on ${new Date(application.applied_at).toLocaleString()} with ${application.resume_name}.`, 'success');
    }
    async function loadResumes() {
        refresh.disabled = true;
        button.disabled = true;
        try {
            const data = await api('/api/resumes');
            select.replaceChildren();
            for (const resume of data.resumes) {
                select.add(new Option(`${resume.name} — updated ${new Date(resume.updatedAt).toLocaleDateString()}`, resume.id));
            }
            form.hidden = !data.resumes.length;
            showMessage(data.resumes.length ? '' : 'Upload a resume, then refresh this list to apply.');
        } catch (error) {
            form.hidden = true;
            showMessage(error.message, 'error');
        } finally {
            refresh.disabled = false;
            button.disabled = false;
        }
    }
    if (!token) { window.location.href = '/login.html'; return; }
    if (!id || !/^[1-9]\d*$/.test(id)) { showMessage('Choose a job from Browse jobs first.', 'error'); return; }

    refresh.addEventListener('click', loadResumes);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (submitted || button.disabled || !select.value) return;
        button.disabled = true;
        refresh.disabled = true;
        button.textContent = 'Submitting…';
        try {
            const data = await api(`/api/jobs/${id}/apply`, {
                method: 'POST', body: JSON.stringify({ resume_id: select.value })
            });
            showSubmitted(data.application);
        } catch (error) {
            if (error.code === 'ALREADY_APPLIED') {
                submitted = true;
                panel.hidden = true;
                showMessage('You have already applied to this job.', 'success');
            } else {
                showMessage(error.message, 'error');
            }
        } finally {
            button.disabled = submitted;
            refresh.disabled = submitted;
            button.textContent = 'Submit application';
        }
    });
    try {
        const { job, application } = await api(`/api/jobs/${id}`);
        document.title = `${job.title} | CareerConnect`;
        document.getElementById('title').textContent = job.title;
        document.getElementById('company').textContent = job.company_name;
        document.getElementById('location').textContent = [job.location, job.country].filter(Boolean).join(', ');
        document.getElementById('job-meta').textContent = [job.job_type?.replaceAll('_', ' '), job.language, `${job.openings} opening(s)`].filter(Boolean).join(' · ');
        document.getElementById('description').textContent = job.description || 'No description provided.';
        document.getElementById('job').hidden = false;
        if (application) { showSubmitted(application); return; }
        if (job.status !== 'open') { showMessage('This job is no longer accepting applications.'); return; }
        panel.hidden = false;
        await loadResumes();
    } catch (error) { showMessage(error.message, 'error'); }
});

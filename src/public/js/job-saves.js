(() => {
    const cc = window.CareerConnect;
    let savedIds;
    let loading;
    async function savedJobs() {
        if (!loading) {
            loading = cc.request('/api/saved-jobs').then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load saved jobs.');
                savedIds = new Set(data.jobs.map(job => String(job.id)));
                return data.jobs;
            }).catch(error => { loading = null; throw error; });
        }
        return loading;
    }
    function deadlineLabel(deadline) {
        return deadline ? `Apply by ${deadline} (end of day UTC)` : 'No application deadline';
    }
    function createSaveButton(job, message) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'app-button save-job';
        button.textContent = 'Loading saved status...'; button.disabled = true;
        const id = String(job.id);
        const update = () => {
            const saved = savedIds?.has(id) || false;
            button.textContent = saved ? 'Unsave job' : 'Save job';
            button.setAttribute('aria-pressed', String(saved));
            button.setAttribute('aria-label', `${saved ? 'Unsave' : 'Save'} job: ${job.title}`);
        };
        const initialize = async () => {
            try { await savedJobs(); update(); }
            catch (error) { button.textContent = 'Retry saved status'; message.textContent = error.message; }
            finally { button.disabled = false; }
        };
        button.addEventListener('click', async () => {
            if (!savedIds) { button.disabled = true; await initialize(); return; }
            button.disabled = true;
            const wasSaved = savedIds.has(id);
            try {
                const response = await cc.request(`/api/saved-jobs/${encodeURIComponent(id)}`, { method: wasSaved ? 'DELETE' : 'PUT' });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Unable to update saved jobs.');
                }
                if (wasSaved) savedIds.delete(id); else savedIds.add(id);
                // Refresh the list next time while keeping button state for this page.
                loading = null;
                update();
                if (!wasSaved) window.dispatchEvent(new Event('notifications-changed'));
                message.textContent = wasSaved ? 'Job removed from saved jobs.' : 'Job saved. Open jobs with a deadline receive a reminder within 3 days of that date, unless you have already applied.';
                window.dispatchEvent(new CustomEvent('saved-jobs-changed', { detail: { id, saved: !wasSaved } }));
            } catch (error) { message.textContent = error.message; }
            finally { button.disabled = false; }
        });
        initialize();
        return button;
    }
    cc.savedJobs = savedJobs;
    cc.createSaveButton = createSaveButton;
    cc.deadlineLabel = deadlineLabel;
})();

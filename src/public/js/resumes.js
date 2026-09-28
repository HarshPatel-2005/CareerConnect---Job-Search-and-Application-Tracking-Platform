const uploadForm = document.querySelector('#upload-form');
const uploadInput = document.querySelector('#resume-file');
const replaceInput = document.querySelector('#replace-file');
const selectedFile = document.querySelector('#selected-file');
const list = document.querySelector('#resume-list');
const count = document.querySelector('#resume-count');
const message = document.querySelector('#message');
let replacementId = null;

function showMessage(text, type = '') {
    message.textContent = text;
    message.className = `message ${type}`;
}

function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
    const node = document.createElement('span');
    node.textContent = value;
    return node.innerHTML;
}

function render(resumes) {
    count.textContent = `${resumes.length} ${resumes.length === 1 ? 'resume' : 'resumes'}`;
    if (!resumes.length) {
        list.innerHTML = '<div class="empty">No resumes yet. Upload your first one above.</div>';
        return;
    }

    list.innerHTML = resumes.map((resume) => `
        <article class="resume-row">
            <div>
                <div class="resume-name">${escapeHtml(resume.name)}</div>
                <div class="resume-meta">${formatBytes(resume.size)} · Updated ${new Date(resume.updatedAt).toLocaleDateString()}</div>
            </div>
            <div class="actions">
                <a class="download" href="${resume.downloadUrl}">Download</a>
                <button type="button" data-replace="${resume.id}">Replace</button>
                <button type="button" class="delete" data-delete="${resume.id}" data-name="${escapeHtml(resume.name)}">Delete</button>
            </div>
        </article>
    `).join('');
}

async function request(url, options) {
    const response = await fetch(url, options);
    if (response.status === 204) return null;
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Something went wrong.');
    return body;
}

async function loadResumes() {
    try {
        const body = await request('/api/resumes');
        render(body.resumes);
        document.querySelector('#size-limit').textContent = `${Math.round(body.maxSize / 1024 / 1024)} MB`;
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function sendFile(file, url, method) {
    const data = new FormData();
    data.append('resume', file);
    await request(url, { method, body: data });
    await loadResumes();
}

uploadInput.addEventListener('change', () => {
    selectedFile.textContent = uploadInput.files[0]?.name || 'Choose a file';
});

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = uploadForm.querySelector('button');
    button.disabled = true;
    showMessage('Uploading…');
    try {
        await sendFile(uploadInput.files[0], '/api/resumes', 'POST');
        uploadForm.reset();
        selectedFile.textContent = 'Choose a file';
        showMessage('Resume uploaded.', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        button.disabled = false;
    }
});

list.addEventListener('click', async (event) => {
    const replaceButton = event.target.closest('[data-replace]');
    if (replaceButton) {
        replacementId = replaceButton.dataset.replace;
        replaceInput.click();
        return;
    }

    const deleteButton = event.target.closest('[data-delete]');
    if (!deleteButton || !confirm(`Delete “${deleteButton.dataset.name}”?`)) return;
    showMessage('Deleting…');
    try {
        await request(`/api/resumes/${deleteButton.dataset.delete}`, { method: 'DELETE' });
        await loadResumes();
        showMessage('Resume deleted.', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

replaceInput.addEventListener('change', async () => {
    const file = replaceInput.files[0];
    if (!file || !replacementId) return;
    showMessage('Replacing…');
    try {
        await sendFile(file, `/api/resumes/${replacementId}`, 'PUT');
        showMessage('Resume replaced.', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        replaceInput.value = '';
        replacementId = null;
    }
});

loadResumes();

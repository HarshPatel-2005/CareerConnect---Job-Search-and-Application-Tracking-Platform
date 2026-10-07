// Auth helper variables
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Redirect to login if not authenticated
if (!token || !user.id) {
    window.location.href = '/login.html';
}

const API_BASE = `/api/profile/${user.id}`;

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    document.querySelectorAll('.setting-row').forEach(setUpRow);
});

function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return true;
    }

    return false;
}

// ---- Loading the current values into the read-only view ----

async function loadProfile() {
    try {
        const response = await fetch(API_BASE, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (handleAuthError(response)) return;

        const data = await response.json();

        if (!response.ok) {
            showBanner(data.error || 'Could not load your profile.', 'error');
            return;
        }

        setValue('full_name', data.full_name);
        setValue('email', data.email);
        // password row always stays masked; nothing to fill in from the server.
    } catch (error) {
        console.error('Error loading profile:', error);
        showBanner('Could not reach the server. Please try again later.', 'error');
    }
}

function setValue(field, value) {
    const row = document.querySelector(`.setting-row[data-field="${field}"]`);
    if (!row) return;
    row.querySelector('[data-value]').textContent = value;
}

// ---- Wiring up one row (Edit / Cancel / Submit) ----

function setUpRow(row) {
    const field = row.dataset.field;
    const editButton = row.querySelector('[data-action="edit"]');
    const cancelButton = row.querySelector('[data-action="cancel"]');
    const form = row.querySelector('[data-form]');
    const viewEl = row.querySelector('.setting-row__view');

    editButton.addEventListener('click', () => {
        prefillForm(row, field);
        clearError(row);
        viewEl.hidden = true;
        form.hidden = false;
    });

    cancelButton.addEventListener('click', () => {
        form.reset();
        clearError(row);
        form.hidden = true;
        viewEl.hidden = false;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitRow(row, field, form);
    });
}

function prefillForm(row, field) {
    // Name/email forms start from the current value; password fields always
    // start blank since we never fetch the real password.
    if (field === 'password') return;

    const input = row.querySelector(`[name="${field}"]`);
    const currentValue = row.querySelector('[data-value]').textContent;
    input.value = currentValue;
}

// ---- Submitting a row's form ----

async function submitRow(row, field, form) {
    const submitButton = form.querySelector('.btn-primary');
    clearError(row);

    let url = API_BASE;
    let payload;

    if (field === 'password') {
        const current_password = form.querySelector('[name="current_password"]').value;
        const new_password = form.querySelector('[name="new_password"]').value;
        const confirm_password = form.querySelector('[name="confirm_password"]').value;

        if (new_password !== confirm_password) {
            showFieldError(row, "New passwords don't match.");
            return;
        }

        url = `${API_BASE}/password`;
        payload = { current_password, new_password, confirm_password };
    } else {
        const value = form.querySelector(`[name="${field}"]`).value.trim();
        payload = { [field]: value };
    }

    submitButton.disabled = true;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload),
        });

        if (handleAuthError(response)) return;

        const data = await response.json();

        if (!response.ok) {
            showFieldError(row, data.error || 'Something went wrong. Please try again.');
            return;
        }

        if (field === 'password') {
            // Never reflect the new password back into the view row.
            form.reset();
        } else {
            setValue(field, payload[field]);
            // Update stored user object if email/name changed
            user[field] = payload[field];
            localStorage.setItem('user', JSON.stringify(user));
        }

        form.hidden = true;
        row.querySelector('.setting-row__view').hidden = false;
        showBanner('Your changes were saved.', 'success');
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
        showFieldError(row, 'Could not reach the server. Please try again later.');
    } finally {
        submitButton.disabled = false;
    }
}

// ---- Small UI helpers ----

function showFieldError(row, message) {
    const errorEl = row.querySelector('[data-error]');
    errorEl.textContent = message;
    errorEl.hidden = false;
}

function clearError(row) {
    const errorEl = row.querySelector('[data-error]');
    errorEl.textContent = '';
    errorEl.hidden = true;
}

function showBanner(message, type) {
    const banner = document.getElementById('banner');
    banner.textContent = message;
    banner.className = `banner banner--${type}`;
    banner.hidden = false;
}
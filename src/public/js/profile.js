// profile.js
// Wires up the edit-in-place rows in profile.html to the /api/profile endpoints.
//
// There's no login flow yet, so there's no real session to read the current
// user from. Until auth exists, we hardcode the id of the account to view/edit.
// To test this: register a user via POST /api/auth/register, then set
// TEST_USER_ID below to whatever id came back (a fresh DB usually gives you 1).
// TODO: replace this with the logged-in user's id once auth/sessions exist.
const TEST_USER_ID = 1;

const API_BASE = `/api/profile/${TEST_USER_ID}`;

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    document.querySelectorAll('.setting-row').forEach(setUpRow);
});

// ---- Loading the current values into the read-only view ----

async function loadProfile() {
    try {
        const response = await fetch(API_BASE);
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
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
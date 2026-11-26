/* =====================================================================
   INVITE PAGE – JAVASCRIPT
   1. Loads the team (CEO first, then a gap, then the other recruiters)
   2. Owner only: reveal / copy / change the company's invite code
   3. Owner only: kick a recruiter out of the company
   ===================================================================== */

const teamBox     = document.getElementById('team');
const teamCount   = document.getElementById('team-count');
const messageBox  = document.getElementById('invite-message');
const invitePanel = document.getElementById('invite-panel');
const revealBtn   = document.getElementById('reveal');
const codeArea    = document.getElementById('code-area');
const codeValue   = document.getElementById('code-value');
const copyBtn     = document.getElementById('copy');
const hideBtn     = document.getElementById('hide');
const customInput = document.getElementById('custom-code');
const saveBtn     = document.getElementById('save-code');
const randomBtn   = document.getElementById('random-code');

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function say(text) { messageBox.textContent = text || ''; }

/* Fetch helper: adds the token, handles login redirects, throws readable errors. */
async function api(url, options = {}) {
    const token = sessionStorage.getItem('token');   // same key as the dashboard
    const response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, ...(options.headers || {}) }
    });
    if (response.status === 401) {
        window.location.href = 'login.html';          // use your real login page name
        throw new Error('Please log in again.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
}

/* ---------------- TEAM ---------------- */

function memberCard(member, isOwnerViewing) {
    const card = document.createElement('article');
    card.className = 'member';
    card.innerHTML =
        '<div>' +
            '<h2 class="member-name">' + escapeHTML(member.full_name) +
                (member.is_owner ? '<span class="ceo-badge">CEO</span>' : '') + '</h2>' +
            '<p class="member-email">' + escapeHTML(member.email) + '</p>' +
        '</div>';

    // Only the owner sees Kick, and never on their own card
    if (isOwnerViewing && !member.is_owner) {
        const kick = document.createElement('button');
        kick.type = 'button';
        kick.className = 'btn-small btn-danger';
        kick.textContent = 'Kick';
        kick.addEventListener('click', () => kickMember(member, kick));
        card.appendChild(kick);
    }
    return card;
}

async function loadTeam() {
    try {
        const data = await api('/api/recruiter/team');
        teamBox.innerHTML = '';
        teamCount.textContent = '(' + data.members.length + ')';

        const ceo    = data.members.filter(m => m.is_owner);
        const others = data.members.filter(m => !m.is_owner);

        ceo.forEach(m => teamBox.appendChild(memberCard(m, data.isOwner)));

        const gap = document.createElement('div');
        gap.className = 'team-gap';
        gap.setAttribute('aria-hidden', 'true');
        teamBox.appendChild(gap);

        if (others.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'team-empty';
            empty.textContent = data.isOwner
                ? 'No other recruiters yet. Show your invite code and share it to add one.'
                : 'No other recruiters yet.';
            teamBox.appendChild(empty);
        } else {
            others.forEach(m => teamBox.appendChild(memberCard(m, data.isOwner)));
        }

        invitePanel.hidden = !data.isOwner;   // owner-only part of the page
    } catch (error) {
        say(error.message);
    }
}

async function kickMember(member, button) {
    if (!window.confirm('Remove ' + member.full_name + ' from your company? They will lose access to its jobs and candidates.')) return;
    button.disabled = true;
    try {
        await api('/api/recruiter/team/' + member.id, { method: 'DELETE' });
        say(member.full_name + ' was removed from your company.');
        loadTeam();
    } catch (error) {
        say(error.message);
        button.disabled = false;
    }
}

/* ---------------- INVITE CODE ---------------- */

function showCode(code) {
    codeValue.textContent = code;
    codeArea.hidden = false;
    revealBtn.hidden = true;
    copyBtn.textContent = 'Copy';
}

// The code is only fetched when the button is clicked, so it isn't on the page until then.
revealBtn.addEventListener('click', async () => {
    revealBtn.disabled = true;
    try {
        const data = await api('/api/recruiter/invite-code');
        showCode(data.code);
        say('');
    } catch (error) {
        say(error.message);
    } finally {
        revealBtn.disabled = false;
    }
});

hideBtn.addEventListener('click', () => {
    codeValue.textContent = '';
    customInput.value = '';
    codeArea.hidden = true;
    revealBtn.hidden = false;
});

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(codeValue.textContent);
        copyBtn.textContent = 'Copied';
    } catch (error) {
        say('Could not copy automatically. Select the code and copy it.');
    }
});

saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    try {
        const data = await api('/api/recruiter/invite-code', {
            method: 'PUT', body: JSON.stringify({ code: customInput.value })
        });
        showCode(data.code);
        customInput.value = '';
        say('Invite code updated. The old code no longer works.');
    } catch (error) {
        say(error.message);
    } finally {
        saveBtn.disabled = false;
    }
});

randomBtn.addEventListener('click', async () => {
    randomBtn.disabled = true;
    try {
        const data = await api('/api/recruiter/invite-code/regenerate', { method: 'POST' });
        showCode(data.code);
        say('New random code created. The old code no longer works.');
    } catch (error) {
        say(error.message);
    } finally {
        randomBtn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', loadTeam);
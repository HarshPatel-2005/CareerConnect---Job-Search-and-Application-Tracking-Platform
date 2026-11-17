document.addEventListener('DOMContentLoaded', () => {
    if (!CareerConnect.session()) return;
    const list = document.getElementById('notifications');
    const message = document.getElementById('message');
    const refresh = document.getElementById('refresh-notifications');
    const readAll = document.getElementById('read-all');
    const more = document.getElementById('load-more');
    let before = null;
    let busy = false;
    async function markRead(url) {
        const response = await CareerConnect.request(url, { method: 'PATCH' });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Unable to mark notifications as read.');
        }
        window.dispatchEvent(new Event('notifications-changed'));
    }
    function render(notification) {
        const card = document.createElement('article'); card.className = 'job-card notification-card';
        card.classList.toggle('unread', !notification.read_at);
        const heading = document.createElement('h2');
        const link = document.createElement('a'); link.textContent = notification.title;
        link.href = `/job-details.html?id=${encodeURIComponent(notification.job_id)}`; heading.append(link);
        const text = document.createElement('p');
        text.textContent = `Application deadline reminder: apply to ${notification.company_name} by ${notification.deadline} (end of day UTC).`;
        const date = document.createElement('p'); date.className = 'notification-date';
        date.textContent = `Received ${new Date(notification.created_at).toLocaleString()}`;
        const state = document.createElement('span'); state.className = 'status-tag'; state.textContent = notification.read_at ? 'Read' : 'Unread';
        card.append(heading, text, date, state);
        if (!notification.read_at) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'app-button'; button.textContent = 'Mark as read';
            button.addEventListener('click', async () => {
                if (busy) return;
                button.disabled = true;
                try {
                    await markRead(`/api/notifications/${notification.id}/read`);
                    card.classList.remove('unread'); state.textContent = 'Read'; button.remove();
                    readAll.disabled = !list.querySelector('.unread');
                    message.textContent = 'Notification marked as read.';
                    link.focus();
                } catch (error) { message.textContent = error.message; button.disabled = false; }
            });
            card.append(button);
        }
        list.append(card);
    }
    async function load(append = false) {
        if (busy) return;
        busy = true; refresh.disabled = true; more.disabled = true; readAll.disabled = true;
        message.textContent = 'Loading notifications...';
        try {
            const response = await CareerConnect.request(`/api/notifications${append && before ? `?before=${before}` : ''}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to load notifications.');
            if (!append) list.replaceChildren();
            data.notifications.forEach(render);
            before = data.next_before; more.hidden = before === null;
            message.textContent = list.children.length ? '' : 'No notifications yet. Reminders for saved jobs will appear here.';
            window.dispatchEvent(new Event('notifications-changed'));
        } catch (error) { message.textContent = error.message; }
        finally {
            busy = false; refresh.disabled = false; more.disabled = false;
            readAll.disabled = !list.querySelector('.unread');
        }
    }
    refresh.addEventListener('click', () => load());
    more.addEventListener('click', () => load(true));
    readAll.addEventListener('click', async () => {
        if (busy) return;
        busy = true; readAll.disabled = true; refresh.disabled = true; more.disabled = true;
        try {
            await markRead('/api/notifications/read-all');
            for (const card of list.querySelectorAll('.unread')) {
                card.classList.remove('unread'); card.querySelector('.status-tag').textContent = 'Read'; card.querySelector('button')?.remove();
            }
            message.textContent = 'All notifications marked as read.';
        } catch (error) { message.textContent = error.message; }
        finally {
            busy = false; refresh.disabled = false; more.disabled = false;
            readAll.disabled = !list.querySelector('.unread'); refresh.focus();
        }
    });
    load();
});

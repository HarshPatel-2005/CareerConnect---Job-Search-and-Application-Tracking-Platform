(() => {
    'use strict';
    const home = user => user?.role === 'recruiter' ? '/recruiter-dashboard.html' : '/job-search.html';
    const clear = () => { sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); };
    // Old persistent sessions caused unexpected logins across accounts/tabs.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    function session() {
        try {
            const token = sessionStorage.getItem('token');
            const user = JSON.parse(sessionStorage.getItem('user') || 'null');
            if (!token || !user?.id) { clear(); return null; }
            const encoded = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
            const claims = JSON.parse(atob(encoded));
            if (!claims.exp || claims.exp * 1000 <= Date.now() || String(claims.id || claims.userId) !== String(user.id)) {
                clear(); return null;
            }
            return { token, user };
        } catch { clear(); return null; }
    }
    function destination() {
        const next = new URLSearchParams(location.search).get('next');
        if (next) {
            const url = new URL(next, location.origin);
            const allowed = ['/job-details.html', '/resumes.html', '/profile.html', '/settings.html', '/applications.html', '/job-posting.html', '/candidates-dashboard.html'];
            if (url.origin === location.origin && allowed.includes(url.pathname)) {
                const recruiterOnly = ['/job-posting.html', '/candidates-dashboard.html'];
                if (!recruiterOnly.includes(url.pathname) || session()?.user.role === 'recruiter') return url.pathname + url.search;
            }
        }
        return home(session()?.user);
    }
    const loginUrl = () => `/login.html?next=${encodeURIComponent(location.pathname + location.search)}`;
    function saveSession(data) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
    }
    let validation;
    function validateSession() {
        if (validation) return validation;
        const current = session();
        if (!current) return Promise.resolve(null);
        validation = fetch('/api/auth/me', { headers: { Authorization: `Bearer ${current.token}` } })
            .then(async response => {
                if (response.status === 401 || response.status === 403) { clear(); return null; }
                if (!response.ok) return current;
                const data = await response.json();
                saveSession({ token: current.token, user: data.user });
                return { token: current.token, user: data.user };
            }).catch(() => current);
        return validation;
    }
    async function request(url, options = {}) {
        const current = session();
        const headers = new Headers(options.headers);
        if (current) headers.set('Authorization', `Bearer ${current.token}`);
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || (response.status === 403 && /token/i.test((await response.clone().json().catch(() => ({}))).error || ''))) {
            clear(); location.assign(loginUrl());
            throw new Error('Please sign in again.');
        }
        return response;
    }
    window.CareerConnect = { session, saveSession, clear, home, destination, loginUrl, request, validateSession };
    const current = session();
    window.addEventListener('account-updated', () => {
        const user = session()?.user;
        const label = document.querySelector('.app-identity');
        if (label && user) { label.textContent = `${user.full_name} · ${user.role === 'recruiter' ? 'Recruiter' : 'Job seeker'}`; label.title = user.email; }
    });
    const recruiterPages = ['/recruiter-dashboard.html', '/job-posting.html', '/candidates-dashboard.html'];
    const seekerPages = ['/resumes.html', '/applications.html'];
    const privatePage = [...recruiterPages, ...seekerPages, '/settings.html'].includes(location.pathname)
        || (location.pathname === '/profile.html' && !new URLSearchParams(location.search).has('id'));
    if (privatePage && !current) location.replace(loginUrl());
    if (current && ((recruiterPages.includes(location.pathname) && current.user.role !== 'recruiter')
        || (seekerPages.includes(location.pathname) && current.user.role !== 'job_seeker'))) location.replace(home(current.user));

    document.addEventListener('DOMContentLoaded', () => {
        const header = document.createElement('header');
        header.className = 'app-header';
        const inner = document.createElement('div');
        inner.className = 'app-header-inner';
        function link(label, href, parent) {
            const a = document.createElement('a'); a.textContent = label; a.href = href;
            if (location.pathname === href) a.setAttribute('aria-current', 'page');
            parent.append(a); return a;
        }
        link('CareerConnect', '/', inner).className = 'app-brand';
        const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Main navigation');
        link('Find jobs', '/job-search.html', nav);
        if (current?.user.role === 'recruiter') {
            link('Recruiter dashboard', '/recruiter-dashboard.html', nav);
            link('Post a job', '/job-posting.html', nav);
        } else if (current) {
            link('My applications', '/applications.html', nav);
            link('My resumes', '/resumes.html', nav);
        }
        if (current) {
            link('My profile', '/profile.html', nav);
            link('Settings', '/settings.html', nav);
        }
        inner.append(nav);
        const account = document.createElement('div'); account.className = 'app-account';
        if (current) {
            const name = document.createElement('span'); name.className = 'app-identity';
            name.textContent = `${current.user.full_name} · ${current.user.role === 'recruiter' ? 'Recruiter' : 'Job seeker'}`;
            name.title = current.user.email; account.append(name);
            const logout = document.createElement('button'); logout.type = 'button'; logout.textContent = 'Log out';
            logout.addEventListener('click', () => { clear(); location.assign('/login.html'); }); account.append(logout);
        } else {
            link('Log in', loginUrl(), account); link('Create account', '/register.html' + location.search, account);
        }
        inner.append(account); header.append(inner);
        const old = document.querySelector('body > .page-header, body > .topbar, body > .site-header');
        if (old) old.replaceWith(header); else document.body.prepend(header);
        const skip = document.createElement('a'); skip.className = 'skip-link'; skip.href = '#main-content'; skip.textContent = 'Skip to content';
        document.body.prepend(skip);
        const main = document.querySelector('main'); if (main) main.id = 'main-content';
        for (const element of document.querySelectorAll('[data-audience]')) {
            const audience = element.dataset.audience;
            element.hidden = audience === 'guest' ? Boolean(current) : audience === 'signed-in' ? !current : current?.user.role !== audience;
        }
        if (!document.querySelector('link[rel="icon"]')) {
            const icon = document.createElement('link'); icon.rel = 'icon'; icon.href = '/favicon.svg'; document.head.append(icon);
        }
        const next = new URLSearchParams(location.search).get('next');
        if (next) for (const link of document.querySelectorAll('.login-link a, .register-link a')) {
            link.search = new URLSearchParams({ next }).toString();
        }
        if (current) validateSession().then(result => {
            if (!result && privatePage) location.replace(loginUrl());
            else if (!result && !['/login.html', '/register.html'].includes(location.pathname)) location.reload();
        });
    });
})();

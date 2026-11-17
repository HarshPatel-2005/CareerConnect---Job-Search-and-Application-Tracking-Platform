process.env.JWT_SECRET = 'saved-jobs-notifications-test';
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createSavedJobsRouter } = require('../src/api/routes/savedJobsRoutes');
const { createNotificationsRouter } = require('../src/api/routes/notificationsRoutes');
jest.mock('../src/config/db', () => ({}));
let app, db, connection;
const auth = (overrides = {}) => `Bearer ${jwt.sign({ id: 10, role: 'job_seeker', ...overrides }, process.env.JWT_SECRET)}`;

beforeEach(() => {
    connection = {
        query: jest.fn().mockResolvedValue([{ affectedRows: 0 }]),
        beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn()
    };
    db = { query: jest.fn(), getConnection: jest.fn().mockResolvedValue(connection) };
    app = express(); app.use(express.json());
    app.use('/api/saved-jobs', createSavedJobsRouter({ db }));
    app.use('/api/notifications', createNotificationsRouter({ db }));
});

test.each([
    ['get', '/api/saved-jobs'], ['put', '/api/saved-jobs/5'], ['delete', '/api/saved-jobs/5'],
    ['get', '/api/notifications'], ['get', '/api/notifications/unread-count'],
    ['patch', '/api/notifications/read-all'], ['patch', '/api/notifications/5/read']
])('%s %s requires a valid authenticated account', async (method, url) => {
    expect((await request(app)[method](url)).status).toBe(401);
    expect((await request(app)[method](url).set('Authorization', 'Bearer invalid')).status).toBe(403);
    expect((await request(app)[method](url).set('Authorization', auth({ id: -1 }))).status).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
    expect(db.getConnection).not.toHaveBeenCalled();
});

test.each(['get', 'put', 'delete'])('recruiters cannot %s saved jobs', async method => {
    const res = await request(app)[method](`/api/saved-jobs${method === 'get' ? '' : '/5'}`)
        .set('Authorization', auth({ role: 'recruiter' }));
    expect(res.status).toBe(403); expect(db.query).not.toHaveBeenCalled();
});

test.each(['0', '-1', '5abc', '9007199254740992'])('invalid job ID %s cannot be saved or removed', async id => {
    for (const method of ['put', 'delete']) {
        expect((await request(app)[method](`/api/saved-jobs/${id}`).set('Authorization', auth())).status).toBe(400);
    }
    expect(db.query).not.toHaveBeenCalled();
});

test('saved jobs are listed only for the token owner', async () => {
    db.query.mockResolvedValueOnce([[{ id: 5, title: 'Developer', deadline: '2026-11-30' }]]);
    const res = await request(app).get('/api/saved-jobs?user_id=99').set('Authorization', auth());
    expect(res.status).toBe(200); expect(res.body.jobs).toHaveLength(1);
    expect(db.query.mock.calls[0][1]).toEqual([10]);
});

test('save ignores a forged owner in the body', async () => {
    connection.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[{ job_id: 5 }]]);
    const res = await request(app).put('/api/saved-jobs/5').set('Authorization', auth()).send({ user_id: 99 });
    expect(res.status).toBe(200); expect(res.body.saved).toBe(true);
    for (const call of connection.query.mock.calls.slice(0, 2)) expect(call[1]).toEqual([10, '5']);
    expect(connection.query.mock.calls[2][1]).toEqual([3, 10, '5']);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
});

test('unknown jobs return 404 when saving', async () => {
    connection.query.mockResolvedValueOnce([{ affectedRows: 0 }]).mockResolvedValueOnce([[]]);
    expect((await request(app).put('/api/saved-jobs/5').set('Authorization', auth())).status).toBe(404);
    expect(connection.query).toHaveBeenCalledTimes(2);
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
});

test('saving waits for the eligible reminder to be stored before responding', async () => {
    let finishReminder;
    const reminderStarted = new Promise(resolve => {
        connection.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[{ job_id: 5 }]])
            .mockImplementationOnce(() => { resolve(); return new Promise(finish => { finishReminder = finish; }); });
    });
    let responded = false;
    const saving = request(app).put('/api/saved-jobs/5').set('Authorization', auth())
        .then(res => { responded = true; return res; });
    await reminderStarted;
    expect(responded).toBe(false);
    expect(connection.commit).not.toHaveBeenCalled();
    finishReminder([{ affectedRows: 1 }]);
    expect((await saving).status).toBe(200);
    expect(connection.commit).toHaveBeenCalledTimes(1);
});

test('a failed immediate reminder rolls back the save so retrying is safe', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        connection.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[{ job_id: 5 }]])
            .mockRejectedValueOnce(new Error('Reminder insert failed'));
        expect((await request(app).put('/api/saved-jobs/5').set('Authorization', auth())).status).toBe(500);
        expect(connection.rollback).toHaveBeenCalledTimes(1);
        expect(connection.commit).not.toHaveBeenCalled();
        expect(connection.release).toHaveBeenCalledTimes(1);
    } finally { log.mockRestore(); }
});

test('unsave is idempotent and limited to the token owner', async () => {
    db.query.mockResolvedValue([{ affectedRows: 0 }]);
    expect((await request(app).delete('/api/saved-jobs/5').set('Authorization', auth())).status).toBe(204);
    expect(db.query.mock.calls[0][1]).toEqual([10, '5']);
});

test('notifications use bounded cursor pagination scoped to the owner', async () => {
    db.query.mockResolvedValueOnce([[{ id: 9 }, { id: 8 }, { id: 7 }]]);
    const res = await request(app).get('/api/notifications?limit=2&before=10&user_id=99').set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ notifications: [{ id: 9 }, { id: 8 }], next_before: 8 });
    expect(db.query.mock.calls[0][1]).toEqual([10, 10, 3]);
});

test.each(['limit=0', 'limit=101', 'limit=1.5', 'before=0', 'before=nope', 'before=9007199254740992'])(
    'rejects invalid pagination %s', async query => {
        expect((await request(app).get(`/api/notifications?${query}`).set('Authorization', auth())).status).toBe(400);
        expect(db.query).not.toHaveBeenCalled();
    }
);

test('unread counts are restricted to the token owner', async () => {
    db.query.mockResolvedValueOnce([[{ unread_count: '2' }]]);
    const res = await request(app).get('/api/notifications/unread-count').set('Authorization', auth());
    expect(res.body).toEqual({ unread_count: 2 }); expect(db.query.mock.calls[0][1]).toEqual([10]);
});

test('another user cannot mark a notification as read', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).patch('/api/notifications/5/read').set('Authorization', auth());
    expect(res.status).toBe(404); expect(db.query.mock.calls[0][1]).toEqual(['5', 10]);
});

test('mark all as read updates only the authenticated account', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 3 }]);
    const res = await request(app).patch('/api/notifications/read-all').set('Authorization', auth()).send({ user_id: 99 });
    expect(res.status).toBe(204); expect(db.query.mock.calls[0][1]).toEqual([10]);
});

test.each(['/api/saved-jobs', '/api/notifications'])('database failures return actionable errors for %s', async url => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        db.query.mockRejectedValueOnce(new Error('Database unavailable'));
        const res = await request(app).get(url).set('Authorization', auth());
        expect(res.status).toBe(500); expect(res.body.error).toMatch(/right now/);
    } finally { log.mockRestore(); }
});

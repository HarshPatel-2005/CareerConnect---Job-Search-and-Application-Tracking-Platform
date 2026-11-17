jest.mock('../src/config/db', () => ({}));
const { startDeadlineReminders } = require('../src/api/services/deadlineReminders');

afterEach(() => jest.useRealTimers());

test('scheduler starts immediately, avoids overlapping runs and stops cleanly', async () => {
    jest.useFakeTimers();
    let finish;
    const db = { query: jest.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
        .mockResolvedValue([{ affectedRows: 0 }]) };
    const stop = startDeadlineReminders({ db, intervalMs: 100 });
    expect(db.query).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(300);
    expect(db.query).toHaveBeenCalledTimes(1);
    finish([{ affectedRows: 1 }]);
    await jest.advanceTimersByTimeAsync(100);
    expect(db.query).toHaveBeenCalledTimes(2);
    await stop();
    await jest.advanceTimersByTimeAsync(500);
    expect(db.query).toHaveBeenCalledTimes(2);
});

test('a failed reminder run is reported and retried on the next interval', async () => {
    jest.useFakeTimers();
    const error = new Error('Database offline');
    const db = { query: jest.fn().mockRejectedValueOnce(error).mockResolvedValue([{ affectedRows: 0 }]) };
    const onError = jest.fn();
    const stop = startDeadlineReminders({ db, intervalMs: 100, onError });
    await jest.advanceTimersByTimeAsync(100);
    expect(onError).toHaveBeenCalledWith('Deadline reminders failed:', error);
    expect(db.query).toHaveBeenCalledTimes(2);
    await stop();
});

const ResumeStore = require('../src/api/db/resumeStore');

describe('ResumeStore', () => {
    it('creates the MySQL table before its first query', async () => {
        const pool = {
            query: jest.fn()
                .mockResolvedValueOnce([{}])
                .mockResolvedValueOnce([[]])
        };
        const store = new ResumeStore(pool);

        await store.list(7);

        expect(pool.query).toHaveBeenCalledTimes(2);
        expect(pool.query.mock.calls[0][0]).toMatch(/CREATE TABLE IF NOT EXISTS resumes/);
        expect(pool.query.mock.calls[1]).toEqual([
            expect.stringMatching(/FROM resumes/),
            [7]
        ]);
    });
});

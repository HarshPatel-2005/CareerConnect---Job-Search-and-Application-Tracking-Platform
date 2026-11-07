# AI LOG 1 (SPRINT 3)

Task: Migrate sqlite to MySQL
Purpose of the AI: Debugging and code generation for database migration and connection setup.
AI-suggested content: The AI located and suggested modifications to test cases and backend code to ensure the migration from sqlite to MySQL was successful, including adjustments to database connection handling and query execution.
Validation: Read through suggested code changes, tested database connections, and verified that all test cases passed successfully after the migration.
Reflection: The AI was particularly helpful in identifying areas of the codebase that required changes for the migration, and provided useful suggestions for ensuring compatibility with MySQL. 

## Prompt 1

I need some help fixing my project. I have attached what the current npm test output is like.
I will also upload all the files I think are relevant. Here is the first batch. Please wait before any judgement for the next bacth.

`Attached relevant files`

## Response 1

Got it. I'll hold off on conclusions until you send the next batch.

I've read through the test output and the first set of files. Here's what I've noted so far, so we're aligned (not fixes yet):

**Failing suites**
- `applications.test.js`: 1 failure. A user whose ID doesn't own the resume gets a 500 (`(intermediate value) is not iterable` at `jobsRoutes.js:77`) instead of a 404.
- `resumes.test.js`: 6 failures (upload/list, extract, oversize, replace, download, user isolation).

**Things I noticed that I'll want to verify once I see the rest**
- The failing tests and their mocks seem to assume different shapes from the real code in a few places (e.g. the resume router has no `PUT /:id` route, and `resumes.test.js` mocks `ollama` and `aiResumeService` with different exports/shapes than what `aiResumeService.js` actually exports).
- `aiResumeService.js` has some variables that don't look defined in scope (`filePath`, `extractedText`), and `resumesRoutes.js` depends on `resumeController` and `resumeStore`, which I haven't seen yet.
- `candidatesRoutes.js` came through empty.

The files I'll most need next are `controllers/resumeController.js`, `db/resumeStore.js`, and `middleware/authMiddleware.js`. Send the next batch whenever you're ready.

## Prompt 2

here is the rest of the relevant files.

`Attached relevant files`

## Response 2

I've gone through everything. The 7 failures break down as 5 test-side problems, 1 missing feature, and 1 mocking mistake. Reading the code also turned up real bugs that the tests don't catch, mostly because the tests mock the broken parts.

## Why each test fails

| Test | Root cause | Where |
|---|---|---|
| applications: "another user's resume" | `store.get` mock returns a resume for any user, so the route proceeds to `connection.query()`, which returns `undefined`. That's your `not iterable` error at line 77. | test |
| resumes: upload and list | The mock `list()` always returns `[]`. | test |
| resumes: extract | The `aiResumeService` mock returns `{ extractedProfile: {...} }`, and the controller wraps it again, so you get `extractedProfile.extractedProfile`. The mock also returns `experience` instead of `job_history`. | test |
| resumes: oversized | The test sets `maxSize` to 100 MB, so a 133-byte file is valid. | test |
| resumes: replace | There is no `PUT /api/resumes/:id` route or controller method, though `ResumeStore.replace` exists. | **code** |
| resumes: download | The mock `get()` always returns `stored_name: 'stored.pdf'`, but the real uploaded file is `<uuid>.pdf`. `res.download` gets ENOENT and your error handler turns it into a 500. | test |
| resumes: isolation | The mock `get()` ignores `userId`, so user B can delete user A's resume. | test |

The real `ResumeStore` already scopes every query by `user_id`, so the isolation logic in production is fine. The mocks just don't model it.

## Test fixes

**`applications.test.js`**: make the mock enforce ownership. Also delete the duplicated `connection = {...}` block.
```js
get: jest.fn().mockImplementation(async (id, userId) => String(userId) === '1' ? {
    id: resumeId,
    user_id: '1',
    original_name: 'CV.pdf',
    stored_name: 'stored.pdf',
    mime_type: 'application/pdf',
    size_bytes: pdf.length,
    created_at: '2026-10-26',
    updated_at: '2026-10-26'
} : null),
```

**`resumes.test.js`**: replace the store mock with a stateful one and fix the AI service mock shape.
```js
jest.mock('../src/api/db/resumeStore', () => class MockResumeStore {
    constructor() { this.rows = new Map(); }
    async list(userId) {
        return [...this.rows.values()].filter(r => r.user_id === String(userId));
    }
    async get(id, userId) {
        const r = this.rows.get(id);
        return r && r.user_id === String(userId) ? r : null;
    }
    async create(resume) {
        const row = { ...resume, user_id: String(resume.user_id) };
        this.rows.set(row.id, row);
        return row;
    }
    async replace(id, userId, resume) {
        const existing = await this.get(id, userId);
        if (!existing) return null;
        const row = { ...existing, ...resume };
        this.rows.set(id, row);
        return row;
    }
    async delete(id, userId) {
        return (await this.get(id, userId)) ? this.rows.delete(id) : false;
    }
    close() {}
});

jest.mock('../src/api/services/aiResumeService', () => ({
    parseResumeWithAI: jest.fn().mockResolvedValue({
        skills: [
            { name: 'JavaScript', proficiency: 'Advanced' },
            { name: 'Docker', proficiency: 'Intermediate' }
        ],
        job_history: [{
            company_name: 'Tech Corp', title: 'Software Engineer',
            start_date: '2024-01', end_date: null, is_current: true,
            details: 'Developed microservices.'
        }]
    })
}));
```
The `ollama` mock at the top is now dead code, since the whole service is mocked. You can delete it. For the oversized test, use `maxSize: PDF.length + 50` in `createApp(...)`.

## Code fixes

**1. Add the missing replace feature.** In `resumeController.js`:
```js
replace = async (req, res, next) => {
    const userId = req.user?.userId || req.user?.id;
    try {
        const existing = await this.store.get(req.params.id, userId);
        if (!existing) {
            this._removeFile(req.file);
            return res.status(404).json({ error: 'Resume not found' });
        }
        const updated = await this.store.replace(req.params.id, userId, {
            original_name: path.basename(req.file.originalname),
            stored_name: req.file.filename,
            mime_type: req.file.mimetype,
            size_bytes: req.file.size,
            updated_at: new Date().toISOString()
        });
        fs.rmSync(path.join(this.uploadDir, path.basename(existing.stored_name)), { force: true });
        res.json({ resume: this._publicResume(updated) });
    } catch (error) {
        this._removeFile(req.file);
        next(error);
    }
};
```
In `resumesRoutes.js`, add the route:
```js
router.put('/:id', upload.single('resume'), validateUploadedFile, controller.replace);
```

**2. `remove` doesn't await the delete.** Change `this.store.delete(...)` to `await this.store.delete(...)`. Otherwise a failed delete goes unnoticed after the 204 is already sent.

**3. `aiResumeService.js` can't work as written.** The tests never reveal this because they mock it.
- `parseResumeWithAI` passes a file path to `extractTextFromResume`, which expects a buffer.
- The DOCX branch reads `filePath`, which isn't in scope (ReferenceError).
- The prompt uses `extractedText`, but the variable is called `text` (ReferenceError).
- `nullable: true` isn't valid JSON Schema. Use `type: ['string', 'null']` for `end_date` and `details`.

```js
async function extractTextFromResume(fileBuffer, fileType) {
    if (fileType === 'application/pdf') {
        const parser = new PDFParse({ data: fileBuffer });
        try { return (await parser.getText()).text; }
        finally { await parser.destroy(); }
    }
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || fileType === 'application/msword') {
        return (await mammoth.extractRawText({ buffer: fileBuffer })).value;
    }
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
}

async function parseResumeWithAI(filePath, fileType) {
    const fileBuffer = await fs.promises.readFile(filePath);
    const extractedText = await extractTextFromResume(fileBuffer, fileType);
    // ...rest unchanged
```

**4. Two leftover-from-SQLite bugs break production.** The tests don't cover either.
- In `resumesRoutes.js`, `new ResumeStore(dbPath)` passes a file path string where the store expects a DB pool. Use `new ResumeStore()`, and remove `dbPath`.
- In `app.js`, the jobs router gets `options.resume?.store`, which is `undefined` when you call `createApp()` with no options. So in the real app, `POST /api/jobs/:id/apply` returns "Resume store is not configured." (and `uploadDir` is also undefined). Expose them from the resume router:
```js
// resumesRoutes.js, before `return router;`
router.store = store;
router.uploadDir = uploadDir;

// app.js
app.use('/api/jobs', createJobsRouter({
    store: resumes.store,
    uploadDir: resumes.uploadDir,
    ...options.applications
}));
```
Your tests still work, because `createResumeRouter` returns the injected `options.store` and `options.uploadDir` in those cases.

## Smaller things worth knowing

- **Orphaned DB rows:** `uploadAndExtract` creates the DB row before running the AI. If Ollama is down, the catch block deletes the file but leaves the row, so applying later hits the "file is missing" 409. Either run the AI first or call `store.delete` in the catch.
- **Plain upload depends on the AI:** `POST /api/resumes` and `/resume-extract` share one handler, so a normal upload fails whenever Ollama is unavailable. You probably want plain upload to skip the AI step.
- **Download 404s:** a missing file on download surfaces as a 500. Mapping `error.code === 'ENOENT' || error.status === 404` to a 404 in the router's error handler would be cleaner.
- **Timestamps:** the controller inserts ISO strings with a `Z` into `TIMESTAMP(3)` columns. I'm not sure every MySQL version accepts that. Omitting them lets the column defaults handle it.
- **Candidates files:** `candidatesRoutes.js` and `candidatesController.js` are empty and not mounted. That's harmless for now, but the candidates dashboard has no API behind it yet.

I can also write out the full patched versions of `resumeController.js`, `resumesRoutes.js`, `aiResumeService.js`, and the two test files.

## Prompt 3

● resume management & AI extraction (JWT Protected) › rejects unsupported file types and oversized files

    expect(received).toBe(expected) // Object.is equality

    Expected: 400
    Received: 201

      162 |                 filename: 'large.pdf', contentType: 'application/pdf'
      163 |             });
    > 164 |         expect(oversized.status).toBe(400);
          |                                  ^
      165 |         expect(oversized.body.error).toMatch(/no larger/i);
      166 |     });
      167 |

      at Object.toBe (tests/resumes.test.js:164:34)

## Response 3

A 201 means multer accepted the file, so the size limit isn't being hit. The cause is almost certainly that `maxSize` in `resumes.test.js` is still `100 * 1024 * 1024` (the original value). My suggested change was in the test's `beforeEach`, and the code can't enforce a limit that large against a ~133-byte file.

In `beforeEach`, change:

```js
app = createApp({
    resume: {
        uploadDir: path.join(tempDir, 'uploads'),
        store,
        maxSize: 100 * 1024 * 1024   // <- this is why it passes
    }
});
```

to:

```js
app = createApp({
    resume: {
        uploadDir: path.join(tempDir, 'uploads'),
        store,
        maxSize: PDF.length + 50
    }
});
```

The oversized upload is `PDF.length + 100` bytes, which is over the limit. The normal uploads in the other tests are exactly `PDF.length`, so they stay under it. The DOCX buffer is only 6 bytes, so it's fine too.

If you've already made that change and it still fails, send me the current `beforeEach` block. The router code (`options.maxSize || ...` feeding multer's `limits.fileSize`) is correct, so the only other suspect would be the value actually reaching `createResumeRouter`.

**Message nit:** with a limit this small, the error message in `resumesRoutes.js` rounds to `"no larger than 0 MB"`. The test's `/no larger/i` regex still matches, but you may want to make the message less odd:

```js
const limitText = maxSize >= 1024 * 1024
    ? `${Math.round(maxSize / 1024 / 1024)} MB`
    : `${maxSize} bytes`;
return res.status(400).json({ error: `Resume must be no larger than ${limitText}.` });
```
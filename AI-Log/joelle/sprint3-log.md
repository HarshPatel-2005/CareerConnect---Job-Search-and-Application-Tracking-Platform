# AI LOG – Debugging VS Code and Local Development Issues

**Task:** Resolve errors encountered while running the CareerConnect application in VS Code during Sprint 3.

**Purpose of AI:** I used ChatGPT to help me understand terminal errors, identify their causes, and troubleshoot issues related to Docker, npm dependencies, and the MySQL database.

## Prompt

While working on my Application Analytics and History Dashboard, I tried running CareerConnect using `npm run dev` in the VS Code terminal, but I encountered errors that prevented the application from running properly. Can you help me understand the errors and guide me step by step to fix them?

*This prompt is a reconstruction of my request rather than a verbatim transcript.*

## AI Response

ChatGPT helped me troubleshoot the issues one at a time by explaining the error messages and suggesting commands to resolve them.

### 1. Starting the application

I initially attempted to run the application using:

```bash
npm run dev
```

However, the application could not connect to the database because the Docker daemon was not running.

ChatGPT explained that CareerConnect uses Docker to run its MySQL database and that the database container needs to be available for the application to function correctly.

**AI suggestion:**

1. Open Docker Desktop on my Mac.
2. Wait until Docker finishes starting.
3. Return to the VS Code terminal.
4. Run the application again:

```bash
npm run dev
```

After starting Docker, I was able to move past the initial database connection issue.

### 2. Fixing missing Node.js dependencies

When I tried running the application again, the terminal displayed a `MODULE_NOT_FOUND` error.

ChatGPT explained that this error means Node.js cannot find a module required by the application.

Because other team members had recently added new functionality and dependencies to the project, my local installation needed to be updated.

**AI-suggested command:**

```bash
npm install
```

ChatGPT explained that this command reads the project's dependency configuration and installs the required packages into the local `node_modules` folder.

After running the command, npm successfully installed the missing dependencies.

The terminal also displayed dependency vulnerability warnings. ChatGPT explained that these warnings did not necessarily prevent the application from running and advised against making potentially breaking dependency updates without reviewing them with the team.

I then attempted to start the application again:

```bash
npm run dev
```

The server started successfully.

### 3. Troubleshooting the My Applications page

Although the server was running, I encountered another issue when testing my Sprint 3 feature.

When I opened the **My Applications** page, the application displayed the following error:

```text
Unable to load or update applications right now.
```

ChatGPT helped me investigate the existing application tracking API and the database setup.

We determined that the applications table was missing from my local MySQL database.

ChatGPT explained that pulling the latest code from GitHub does not automatically update the structure of an existing local database.

It identified the database migration script already included in the project and suggested running:

```bash
node db/migrate.js
```

ChatGPT explained that the migration script updates the database structure required by the application while preserving existing records.

After executing the command, the terminal displayed:

```text
Profile and applications schemas are ready.
Existing records were preserved.
```

This confirmed that the database migration had completed successfully.

### 4. Restarting and verifying the application

After resolving the dependency and database issues, I ran:

```bash
npm run dev
```

I then opened the application in my browser:

```text
http://localhost:3000/applications.html
```

The My Applications page loaded correctly without the previous error.

I submitted a test application to a Software Developer Intern position and refreshed the page.

The Application Analytics Dashboard correctly displayed:

```text
Total Applications: 1
Under Review: 0
Interviews: 0
Offers: 0

Applications Over Time:
Nov 2026: 1
```

The application also appeared in the existing application history with the correct status.

## Validation

I verified the AI-suggested solutions by:

- Successfully starting the application through the VS Code terminal.
- Confirming that the missing dependencies were installed.
- Running the database migration and checking its success message.
- Opening the My Applications page without errors.
- Submitting a test job application.
- Confirming that the application statistics and monthly activity chart displayed the correct information.

## Reflection

Using ChatGPT helped me understand the causes of errors instead of simply copying commands without knowing their purpose.

I learned that Docker must be running for the application's database to be accessible, that `npm install` is necessary when new dependencies are introduced, and that database migrations may be required after pulling changes from GitHub.

The step-by-step explanations were especially useful because I was unfamiliar with some of these development tools. I executed the commands myself, checked the terminal output, and tested the application to confirm that the suggested solutions worked.

This experience improved my understanding of debugging a full-stack application and helped me complete my Sprint 3 feature successfully.

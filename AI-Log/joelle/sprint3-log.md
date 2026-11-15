# AI LOG 1 – Debugging VS Code and Local Development Issues (sprint 3)

**Task:** Resolve errors encountered while running the CareerConnect application in VS Code during Sprint 3.

**Purpose of AI:** I used ChatGPT to help me understand terminal errors, identify their causes, and troubleshoot issues related to Docker, npm dependencies, and the MySQL database.

## Prompt

While working on my Application Analytics and History Dashboard, I tried running CareerConnect using `npm run dev` in the VS Code terminal, but I encountered errors that prevented the application from running properly. Can you help me understand the errors and guide me step by step to fix them?


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


# AI LOG 2 (SPRINT 3)
## Fixing a JavaScript Syntax Error in VS Code

**Task:** Fix a JavaScript syntax error encountered while integrating the Application Analytics Dashboard into the existing CareerConnect application tracking page.

**Purpose of AI:** I used ChatGPT to help identify a problem with the closing braces in my JavaScript code, understand how conditional statements and `try/catch` blocks work, and correct the error without affecting the existing application tracking functionality.

**AI Tool Used:** ChatGPT

## Prompt

While implementing my Application Analytics and History Dashboard, I modified the `applications.js` file to calculate application statistics.

After adding my code, I noticed an issue with the JavaScript structure and closing brackets in VS Code.

I was not sure where the closing braces should go because the file already contains several `if`, `else`, and `try/catch` blocks.


## AI Response

ChatGPT explained that JavaScript uses curly braces `{ }` to define blocks of code, including conditional statements, loops, functions, and error-handling statements.

When adding a new feature inside an existing JavaScript file, an extra or missing closing brace can cause a syntax error or place code outside its intended block.

### 1. see the Existing Code Structure

The `applications.js` file already contained a `try/catch` block that handled different functionality depending on whether the logged-in user was a recruiter or a job seeker.

The existing code used a conditional statement similar to:

```javascript
try {
    if (recruiter && picker) {
        // Load recruiter job postings
        // Display applicants for a selected job
    } else if (!recruiter) {
        // Load the job seeker's applications
    }
} catch (error) {
    message.textContent = error.message;
    message.className = 'error';
}
```

ChatGPT explained that each opening brace `{` must have a corresponding closing brace `}`.

The `else if (!recruiter)` block is where the Application Analytics Dashboard calculations should be added because the dashboard is intended for job seekers.


### 2. Correcting the JavaScript Structure

ChatGPT suggested keeping the dashboard calculations inside the `else if (!recruiter)` block and removing the unnecessary closing brace.

The corrected structure was:

```javascript
try {
    if (recruiter && picker) {
        // Existing recruiter functionality

    } else if (!recruiter) {
        const data = await json('/api/applications');
        const applications = data.applications;

        render(applications);

        // Sprint 3: Application Analytics
        document.getElementById(
            'total-applications'
        ).textContent = applications.length;

        document.getElementById(
            'under-review-count'
        ).textContent = applications.filter(
            app => app.status === 'under_review'
        ).length;

        document.getElementById(
            'interview-count'
        ).textContent = applications.filter(
            app => app.status === 'interview'
        ).length;

        document.getElementById(
            'offer-count'
        ).textContent = applications.filter(
            app => app.status === 'offered'
        ).length;
    }

} catch (error) {
    message.textContent = error.message;
    message.className = 'error';
}
```

This ensured that the recruiter functionality remained separate from the job seeker dashboard and that errors would still be handled by the existing `catch` block.


### 5. I verifyed the correction

After correcting the JavaScript structure, I saved `applications.js` and continued implementing the dashboard.

I later tested the application locally and confirmed that the My Applications page loaded correctly.

The dashboard displayed the expected statistics for my submitted test application:

**Result: Passed.** The JavaScript structure was corrected, and the dashboard functioned as expected.

## Reflection

ChatGPT helped me understand how JavaScript uses curly braces to organize conditional statements and error-handling blocks.


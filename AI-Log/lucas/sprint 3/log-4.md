# AI LOG 4 (SPRINT 3)

Task: Help with creating a resume review modal and form for the profile page
Purpose of the AI: Code generation for a modal and form to review extracted resume details, including skills, and experiences.
Reflection: The AI was quite useful in generating the initial structure and layout for the modal and form as well as modifying the existing profile.js code to handle the new modal and form. However, several adjustments were needed to ensure the modal and form fit within the existing profile page design and functionality. The AI provided a good starting point, but I had to take creative control to ensure the final implementation met the project requirements and user experience standards.

## Prompt 1

I want to work on some frontend code.
What i'm unsure of is how I should handle some of the user flows.
I think it makes sense to have both the regular upload functionality (with no ai parsing) and the ai parsing funcitonality be 2 seperate endpoints.
Now, I think when you upload a resume you should be able to chose if you want to parse it too or no... but it am a bit unsure how to go about this.

Here is the current html:
<!DOCTYPE html>
<html lang="en">

<head>
    <script src="/js/site.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile — CareerConnect</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/pages/profile.css">
    <link rel="stylesheet" href="/css/site.css">
</head>

<body>
    <header class="page-header">
        <div class="page-header__inner">
            <a href="/" class="brand">CareerConnect</a>
            <a href="/profile.html" class="page-header__profile-link">
                <div class="avatar-container avatar-container" id="avatar">
                    <svg class="avatar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--color-text-muted)"
                        stroke="none" width="32" height="32">
                        <circle cx="12" cy="10" r="5" />
                        <ellipse cx="12" cy="25" rx="10" ry="8" />
                    </svg>
                </div>
            </a>
        </div>
    </header>

    <main class="page-shell">
        <p id="profile-message" class="page-message" role="status" aria-live="polite"></p>
        <div class="card">
            <div class="card-row profile-header">
                <div class="avatar-container avatar-container-lg" id="avatar">
                    <svg class="avatar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--color-text-muted)" stroke="none"  width="48" height="48">
                        <circle cx="12" cy="10" r="5" />
                        <ellipse cx="12" cy="25" rx="10" ry="8" />
                    </svg>
                </div>
                <h1 class="card-title" id="profile-name"></h1>
                <span class="card-row-end profile-company" id="profile-company"></span>
            </div>

            <div class="card-row">
                <button class="btn-secondary" id="edit-btn">Edit Profile</button>
            </div>

            <div class="card-row hidden" id="profile-summary">
                <div class="card-surface">
                    <h2 class="card-field-title" >Summary:</h2>
                    <p class="card-field-value" id="profile-summary-text"></p>
                </div>
            </div>
        </div>

        <div class="card hidden" id="profile-resumes">
            <div class="card-row">
                <h1 class="card-title">Resumes</h1>
            </div>
            <div class="card-row" id="resume-upload">
                <form class="resume-upload">
                    <span>Choose a file or drag it here (PDF or DOCX)</span>
                    <input id="resume-file" name="resume" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden required>
                </form>
            </div>
            <div class="card-row">
                <div class="resume-list" id="resume-list">
                    <div class="resume-row resume-header">
                        <span>File Name</span>
                        <span>Date Uploaded</span>
                        <span>File Size</span>
                        <div class="resume-field-header"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card hidden" id="profile-experience">
            <div class="card-row">
                <h1 class="card-title">Experience</h1>
            </div>
            <div class="card-row hidden" id="experience-settings">
                <button class="btn-primary" id="add-experience-btn">Add Experience</button>
            </div>
            <div class="card-row-vertical" id="experience-list"></div>
        </div>

        <div class="card hidden" id="profile-skills">
            <div class="card-row">
                <h1 class="card-title">Skills</h1>
            </div>

            <div class="card-row hidden" id="skill-editor-row">
                <form class="skill-editor" id="skill-editor-form">
                    <label for="skill-name-input">Skill name</label>
                    <input type="text" id="skill-name-input" placeholder="Skill Name" required>
                    <div class="skill-level-selector">
                        <label class="skill-level-pill">
                            <input type="radio" name="skill-level" value="beginner" required checked />
                            <span>Beginner</span>
                        </label>

                        <label class="skill-level-pill">
                            <input type="radio" name="skill-level" value="intermediate" required />
                            <span>Intermediate</span>
                        </label>

                        <label class="skill-level-pill">
                            <input type="radio" name="skill-level" value="advanced" required />
                            <span>Advanced</span>
                        </label>
                    </div>
                    <button type="submit" class="btn-primary" id="skill-editor-submit-btn">Add Skill</button>
                </form>
            </div>

            <div class="card-row">
                <ul class="skills-list" id="skills-list"></ul>
            </div>
        </div>
    </main>

    <div class="experience-modal hidden" id="experience-modal" role="dialog" aria-modal="true" aria-labelledby="experience-modal-title">
        <div class="card">
            <div class="card-row">
                <h1 class="card-title" id="experience-modal-title">Add Experience</h1>
            </div>

            <div class="card-row">
                <form class="experience-form" id="experience-form">
                    <label for="experience-title">Title</label>
                    <input type="text" id="experience-title" name="title" required>

                    <label for="experience-company">Company</label>
                    <input type="text" id="experience-company" name="company" required>

                    <label for="experience-start-date">Start Date</label>
                    <input type="date" id="experience-start-date" name="startDate" required>

                    <label for="experience-end-date">End Date</label>
                    <input type="date" id="experience-end-date" name="endDate">

                    <label for="experience-details">Description</label>
                    <textarea id="experience-details" name="details"></textarea>

                    <button type="submit" class="btn-primary">Save</button>
                    <button type="button" class="btn-secondary" id="cancel-experience">Cancel</button>
                </form>
            </div>
        </div>
    </div>

    <script src="js/profile.js"></script>
</body>

</html>
and here is the js:
const user = JSON.parse(sessionStorage.getItem('user') || '{}');
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id') || user.id;

// Redirect to login if the user is not authenticated and no profile ID is provided
if (!profileId && !user.id) {
    window.location.href = '/login.html';
}

// Init the profile info on load
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();

    // Setup the experience form and modal
    setupExperienceForm();

    // Setup the skill form
    setupSkillForm();
    
    // Disable the edit button if the user is viewing someone else's profile
    const editButton = document.getElementById('edit-btn');
    const isOwner = String(profileId) === String(user.id);
    if (!isOwner && editButton) {
        editButton.style.display = 'none';
    } else if (isOwner && editButton) {
        editButton.addEventListener('click', toggleEditMode);
    }    

    // Setup resume upload functionality for profile owner
    if (isOwner) {
        const resumeCard = document.getElementById('profile-resumes');
        resumeCard.classList.remove('hidden');

        const dropZone = document.getElementById('resume-upload');
        const fileInput = document.getElementById('resume-file');

        ['dragover', 'dragenter'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'dragend', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                uploadResumeFile(files[0]);
            }
        });

        // Handle click to trigger file input
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle file selection via input
        fileInput.addEventListener('change', (e) => {
            if (fileInput.files.length > 0) {
                uploadResumeFile(fileInput.files[0]);
            }
        });
    }
});

function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login.html';
        return true;
    }

    return false;
}

function toggleEditMode() {
    const editButton = document.getElementById('edit-btn');
    const isEditing = editButton.textContent === 'Save';

    if (!isEditing) {
        // --- SWITCH TO EDIT MODE ---
        editButton.textContent = 'Save';

        // - SUMMARY EDITING -
        const summaryTextEl = document.getElementById('profile-summary-text');

        // Turn summary into a textarea for editing
        const currentSummary = summaryTextEl ? summaryTextEl.textContent.trim() : '';
        const summaryCard = document.getElementById('profile-summary');

        const summaryTextarea = document.createElement('textarea');
        summaryTextarea.id = 'edit-summary-input';
        summaryTextarea.rows = 4;
        summaryTextarea.value = currentSummary;

        summaryTextEl.parentElement.appendChild(summaryTextarea);
        summaryCard.classList.remove('hidden');
        summaryTextEl.classList.add('hidden');

        // - SKILL EDITING -
        const skillsCard = document.getElementById('profile-skills');
        const skillEditorRow = document.getElementById('skill-editor-row');
        skillEditorRow.classList.remove('hidden');
        skillsCard.classList.remove('hidden');
        
        // Make skills editable
        const skillsList = document.getElementById('skills-list');
        const skillItems = skillsList.querySelectorAll('.skill-item');
        skillItems.forEach(skillItem => {
            const skillId = skillItem.getAttribute('data-skill-id');

            if (!skillId) {
                skillItem.remove(); // Remove skills that don't have an ID
                return;
            }

            skillItem.classList.add('editable');

            // -- DELETE SKILL --
            const deleteBtn = skillItem.querySelector('.skill-action-delete');
            deleteBtn.addEventListener('click', skillDeleteHandler(skillItem, skillId));
        });

        // - EXPERIENCE EDITING -
        const experienceCard = document.getElementById('profile-experience');
        const experienceSettings = document.getElementById('experience-settings');
        experienceSettings.classList.remove('hidden');
        experienceCard.classList.remove('hidden');

        // Display the delete buttons for each experience entry
        const experienceDeleteButtons = document.querySelectorAll('.experience-delete-btn');
        experienceDeleteButtons.forEach(btn => {
            btn.classList.remove('hidden');
        });

    } else {
        // --- SAVE CHANGES ---
        saveProfileChanges(editButton);
    }
}

function skillDeleteHandler(skillItem, skillId) {
    return async () => {
        if (!confirm(`Are you sure you want to delete "${skillItem.querySelector('.skill-name').textContent}"?`)) return;

        const token = sessionStorage.getItem('token');

        try {
            const res = await fetch(`/api/profile/${profileId}/skills/${skillId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (handleAuthError(res)) return;

            if (res.status === 204) {
                skillItem.remove(); // Remove the skill from the list
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete skill.');
            }
        } catch (error) {
            console.error('Error deleting skill:', error);
            alert('Could not reach the server. Please try again later.');
        }
    };
}

async function saveProfileChanges(editButton) {
    const newSummary = document.getElementById('edit-summary-input').value.trim();

    editButton.disabled = true; // Disable the button to prevent multiple clicks
    editButton.textContent = 'Saving...';

    try {
        const res = await fetch(`/api/profile/${profileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ summary: newSummary })
        });

        if (handleAuthError(res)) return;

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to save changes.');
            editButton.disabled = false;
            editButton.textContent = 'Save';
            return;
        }

        // Reload profile to reflect changes
        editButton.textContent = 'Edit Profile';
        editButton.disabled = false;
        loadProfile(); // Refresh the profile view
    } catch (error) {
        console.error('Error saving profile changes:', error);
        alert('Could not reach the server. Please try again later.');
        editButton.disabled = false;
        editButton.textContent = 'Save';
    } finally {
        // Remove the textarea and restore the summary display
        const summaryTextarea = document.getElementById('edit-summary-input');
        if (summaryTextarea) {
            summaryTextarea.remove();
        }
        const summaryTextEl = document.getElementById('profile-summary-text');
        if (summaryTextEl) {
            summaryTextEl.classList.remove('hidden');
        }

        // Hide the skill editor row
        const skillEditorRow = document.getElementById('skill-editor-row');
        if (skillEditorRow) {
            skillEditorRow.classList.add('hidden');
        }

        // Hide the experience settings
        const experienceSettings = document.getElementById('experience-settings');
        if (experienceSettings) {
            experienceSettings.classList.add('hidden');
        }
        // Hide the delete buttons for each experience entry
        const experienceDeleteButtons = document.querySelectorAll('.experience-delete-btn');
        experienceDeleteButtons.forEach(btn => {
            btn.classList.add('hidden');
        });
    }
}

async function loadProfile() {
    const editButton = document.getElementById('edit-btn');
    const isOwner = String(profileId) === String(user.id);

    if (!isOwner && editButton) {
        editButton.style.display = 'none';
    }

    try {
        const profileRes = await fetch(`/api/profile/${profileId}`, {
            method: 'GET'
        });

        if (handleAuthError(profileRes)) return;

        const profileData = await profileRes.json();

        if (!profileRes.ok) {
            console.error('Error loading profile:', profileData.error || 'Unknown error');
            document.getElementById('profile-message').textContent = profileData.error || 'Unable to load this profile.';
            return;
        }
        document.getElementById('profile-message').textContent = '';

        // Populate the basic profile fields
        document.getElementById('profile-name').textContent = profileData.full_name;

        if (profileData.company) {
            document.getElementById('profile-company').textContent = profileData.company;
        }
        
        if (profileData.summary) {
            document.getElementById('profile-summary').classList.remove('hidden');
            document.getElementById('profile-summary-text').textContent = profileData.summary;
        } else {
            document.getElementById('profile-summary').classList.add('hidden');
        }

        // Fetch resumes (only profile owner can see their uploaded resumes)
        const resumeContainer = document.getElementById('profile-resumes');
        if (isOwner && user.role === 'job_seeker') {
            const resumeRes = await fetch(`/api/resumes`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });

            if (handleAuthError(resumeRes)) return;
            const resumeData = await resumeRes.json();

            if (resumeRes.ok && resumeData.resumes && resumeData.resumes.length > 0) {
                resumeContainer.classList.remove('hidden');
                populateResumes(resumeData.resumes);
            } else {
                resumeContainer.classList.remove('hidden');
                populateResumes([]);
            }
        } else {
            resumeContainer.classList.add('hidden');
        }

        // Populate experience and skills sections
        if (profileData.experience && profileData.experience.length > 0) {
            document.getElementById('profile-experience').classList.remove('hidden');
            populateExperience(profileData.experience);            
        } else {
            document.getElementById('profile-experience').classList.add('hidden');
        }

        if (profileData.skills && profileData.skills.length > 0) {
            document.getElementById('profile-skills').classList.remove('hidden');
            populateSkills(profileData.skills);
        } else {
            document.getElementById('profile-skills').classList.add('hidden');
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('profile-message').textContent = 'Unable to load the profile. Please refresh to try again.';
    }
}

async function uploadResumeFile(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const token = sessionStorage.getItem('token');

    try {
        const res = await fetch('/api/resumes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (handleAuthError(res)) return;

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to upload resume.');
            return;
        }

        const fileInput = document.getElementById('resume-file');
        fileInput.value = ''; // Clear the file input
        await loadProfile(); // Refresh the profile to show the new resume
    } catch (error) {
        console.error('Error uploading resume:', error);
        alert('Could not reach the server. Please try again later.');
    }
}

function populateResumes(resumes) {
    const resumeList = document.getElementById('resume-list');
    const token = sessionStorage.getItem('token');
    const canEdit = String(profileId) === String(user.id);

    const resumeRows = resumes.map(resume => {
        const row = document.createElement('div');
        row.className = 'resume-row';

        const fileName = document.createElement('div');
        fileName.className = 'resume-field';
        fileName.textContent = resume.name;

        const dateUploaded = document.createElement('div');
        dateUploaded.className = 'resume-field';
        dateUploaded.textContent = new Date(resume.createdAt).toLocaleDateString();

        const fileSize = document.createElement('div');
        fileSize.className = 'resume-field';
        fileSize.textContent = `${(resume.size / 1024).toFixed(2)} KB`;

        const resumeActions = document.createElement('div');
        resumeActions.className = 'resume-actions';

        // --- Download button ---
        const downloadButton = document.createElement('button');
        downloadButton.className = 'btn-secondary resume-action-btn';
        downloadButton.setAttribute('aria-label', 'Download Resume');
        downloadButton.innerHTML = `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 20L18 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 4V16M12 16L15.5 12.5M12 16L8.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        downloadButton.addEventListener('click', async () => {
            try {
                const res = await fetch(resume.downloadUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (handleAuthError(res)) return;
                if (!res.ok) throw new Error('Unable to download this resume.');
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = resume.name;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error('Error downloading resume:', error);
            }
        });

        resumeActions.appendChild(downloadButton);

        if (canEdit) {
            // --- Replace button ---
            const replaceButton = document.createElement('button');
            replaceButton.className = 'btn-secondary resume-action-btn';
            replaceButton.ariaLabel = 'Replace Resume';
            replaceButton.innerHTML = `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M3 21L12 21H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12.2218 5.82839L15.0503 2.99996L20 7.94971L17.1716 10.7781M12.2218 5.82839L6.61522 11.435C6.42769 11.6225 6.32233 11.8769 6.32233 12.1421L6.32233 16.6776L10.8579 16.6776C11.1231 16.6776 11.3774 16.5723 11.565 16.3847L17.1716 10.7781M12.2218 5.82839L17.1716 10.7781" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

            replaceButton.addEventListener('click', () => {
                const replaceInput = document.createElement('input');
                replaceInput.type = 'file';
                replaceInput.accept = '.pdf,.docx';
                replaceInput.style.display = 'none';
                document.body.appendChild(replaceInput);
                
                replaceInput.addEventListener('change', async () => {
                    if (!replaceInput.files[0]) return;
                    const formData = new FormData();
                    formData.append('resume', replaceInput.files[0]);

                    try {
                        const res = await fetch(`/api/resumes/${resume.id}`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });

                        if (res.ok) loadProfile(); // Refresh list
                        else alert('Failed to replace resume.');
                    } catch (error) {
                        console.error('Error replacing resume:', error);
                    }
                });
                replaceInput.addEventListener('cancel', () => replaceInput.remove(), { once: true });
                replaceInput.click();
            });

            resumeActions.appendChild(replaceButton);

            // --- Delete button ---
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn-secondary resume-action-btn';
            deleteButton.ariaLabel = 'Delete Resume';
            deleteButton.innerHTML = `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

            deleteButton.addEventListener('click', async () => {
                if (!confirm(`Are you sure you want to delete "${resume.name}"?`)) return;

                try {
                    const res = await fetch(`/api/resumes/${resume.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.status === 204) loadProfile(); // Refresh list
                    else alert('Failed to delete resume.');
                } catch (error) {
                    console.error('Error deleting resume:', error);
                }
            })
            
            resumeActions.appendChild(deleteButton);
        }

        row.appendChild(fileName);
        row.appendChild(dateUploaded);
        row.appendChild(fileSize);
        row.appendChild(resumeActions);
        return row;
    });

    // Clear existing rows except for the header
    while (resumeList.children.length > 1) {
        resumeList.removeChild(resumeList.lastChild);
    }

    resumeRows.forEach(row => resumeList.appendChild(row));
}

function escapeProfile(value) {
    const span = document.createElement('span');
    span.textContent = String(value || '');
    return span.innerHTML;
}

function populateExperience(experiences) {
    const experienceList = document.getElementById('experience-list');
    experienceList.innerHTML = ''; // Clear existing experience entries
    const canEdit = String(profileId) === String(user.id);

    const grouped = experiences.reduce((acc, exp) => {
        if (!acc[exp.company_name]) acc[exp.company_name] = [];
        acc[exp.company_name].push(exp);
        return acc;
    }, Object.create(null));

    Object.keys(grouped).forEach(companyName => {
        const historyGroup = document.createElement('div');
        historyGroup.className = 'company-history-group';

        const historyTitle = document.createElement('div');
        historyTitle.className = 'company-history-title';
        historyTitle.innerHTML = `
            <h2 class="card-field-title">${escapeProfile(companyName)}</h2>
        `;
        historyGroup.appendChild(historyTitle);

        const positionList = document.createElement('ul');
        positionList.className = 'company-history-position-list';

        grouped[companyName].forEach(exp => {
            const positionItem = document.createElement('li');
            positionItem.className = 'company-history-position';
            positionItem.innerHTML = `
            <div class="company-history-position-date">
                <span>${new Date(exp.start_date).getFullYear()}</span>
            </div>

            <div class="company-history-position-title">
                <span>${escapeProfile(exp.title)}</span>
            </div>
            <div class="company-history-position-details">
                <p id="position-info">
                    ${escapeProfile(exp.details)}
                </p>
            </div>
            `;

            // Add delete button if the user can edit
            if (canEdit) {
                const companyHistoryPositionTitle = positionItem.querySelector('.company-history-position-title');

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-secondary experience-delete-btn hidden';
                deleteBtn.innerHTML = `
                <?xml version="1.0" encoding="UTF-8"?><svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                `;
                deleteBtn.addEventListener('click', async () => {
                    if (!confirm('Are you sure you want to delete this experience entry?')) return;
                    
                    const token = sessionStorage.getItem('token');
                    const res = await fetch(`/api/profile/${profileId}/experience/${exp.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.status === 204) {
                        loadProfile();
                    } else {
                        alert('Failed to delete experience.');
                    }
                });
                companyHistoryPositionTitle.appendChild(deleteBtn);
            }

            positionList.appendChild(positionItem);
        });
        historyGroup.appendChild(positionList);
        experienceList.appendChild(historyGroup);
    });
}

function populateSkills(skills) {
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = ''; // Clear existing skills entries

    skills.forEach(skill => {
        addSkillToList(skill, false);
    });
}

function setupSkillForm() {
    const skillForm = document.getElementById('skill-editor-form');
    if (!skillForm) return;

    skillForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('skill-name-input');
        const selectedLevelInput = document.querySelector('input[name="skill-level"]:checked');

        const name = nameInput.value.trim();
        const level = selectedLevelInput ? selectedLevelInput.value : 'beginner';

        if (!name) return;

        const token = sessionStorage.getItem('token');
        const submitButton = do

## Response 1

Having two separate backend endpoints—one for standard resume storage (`POST /api/resumes`) and one for AI parsing/extraction (`POST /api/resumes/resume-extract`)—is a great architectural pattern. It keeps concerns cleanly separated and gives you total flexibility on the frontend.

To give users the choice of whether they want to parse their resume with AI upon uploading, you can design a seamless user flow using either a **modal confirmation dialog** or an **inline toggle checkbox**.

Here is how you can implement this choice on the frontend:

---

### Recommended UI Flow: The AI Parse Option

When a user selects or drops a file into the upload zone, instead of immediately firing the standard upload endpoint, you can pop up a quick choice modal or have a checkbox next to the upload area.

An elegant approach is adding a small checkbox inside the upload section:

```html
<div class="card-row" id="resume-upload">
    <form class="resume-upload" id="resume-upload-form">
        <span>Choose a file or drag it here (PDF or DOCX)</span>
        <input id="resume-file" name="resume" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden required>
        
        <!-- Optional AI Parse Checkbox -->
        <label class="resume-parse-option" style="margin-top: 10px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="parse-with-ai-checkbox" checked>
            <span>Automatically extract profile details (skills & experience) using AI</span>
        </label>
    </form>
</div>

```

---

### Updating `profile.js` to Handle the Choice

In your `profile.js`, update your file handling logic so that when a file is selected, it checks whether the user opted for AI parsing:

```javascript
// Inside your DOMContentLoaded listener where file input / drop is handled:
function handleSelectedFile(file) {
    const parseWithAI = document.getElementById('parse-with-ai-checkbox').checked;
    
    if (parseWithAI) {
        uploadAndExtractResume(file);
    } else {
        uploadResumeFile(file);
    }
}

```

Then, define both upload functions cleanly:

```javascript
// 1. Standard Upload (No AI Parsing)
async function uploadResumeFile(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const token = sessionStorage.getItem('token');

    try {
        const res = await fetch('/api/resumes', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (handleAuthError(res)) return;
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to upload resume.');
            return;
        }

        document.getElementById('resume-file').value = '';
        await loadProfile(); // Refresh profile to show new resume
    } catch (error) {
        console.error('Error uploading resume:', error);
        alert('Could not reach the server. Please try again later.');
    }
}

// 2. AI Parsing Upload
async function uploadAndExtractResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const token = sessionStorage.getItem('token');

    // Optional: Show a loading state or spinner since AI extraction takes a moment
    const profileMessage = document.getElementById('profile-message');
    profileMessage.textContent = 'Uploading and analyzing resume with AI...';

    try {
        const res = await fetch('/api/resumes/resume-extract', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (handleAuthError(res)) return;
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to extract profile from resume.');
            profileMessage.textContent = '';
            return;
        }

        profileMessage.textContent = 'Resume uploaded and profile successfully updated via AI!';
        setTimeout(() => { profileMessage.textContent = ''; }, 4000);

        document.getElementById('resume-file').value = '';
        await loadProfile(); // Refresh profile to show new skills/experience extracted
    } catch (error) {
        console.error('Error extracting resume with AI:', error);
        alert('Could not reach the server. Please try again later.');
        profileMessage.textContent = '';
    }
}

```

### Why this structure works well:

1. **User Control**: The checkbox defaults to checked (giving them the smart AI experience by default), but they can uncheck it if they just want a standard file upload.
2. **Feedback**: Adding a status message during AI extraction lets the user know the server is working on parsing text via `pdf-parse`/AI models, preventing confusion over network latency.
3. **Modular Code**: Separating `uploadResumeFile` and `uploadAndExtractResume` maps cleanly onto your distinct backend endpoints.

## Prompt 2

OK great, so going off of what you've said here's what i've done:
<div class="modal" id="resume-modal" role="dialog" aria-modal="true" aria-labelledby="resume-modal-title">
        <div class="card">
            <div id="resume-modal-upload">
                <div class="card-row">
                    <h1 class="card-title" id="resume-modal-title">Upload Resume</h1>
                </div>
                <div class="card-row resume-upload" id="resume-upload">
                    <form>
                        <span>Choose a file or drag it here (PDF or DOCX)</span>
                        <input id="resume-file" name="resume" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden required>
                    </form>
                </div>
                <div class="card-row">
                    <label class="resume-parse-option">
                        <span>Automatically extract profile details (skills & experience) using AI</span>
                        <div class="toggle">
                            <input type="checkbox" id="resume-parse" name="resume-parse" />
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>
                <div class="card-row">
                    <button type="button" class="btn-secondary" id="resume-upload-cancel">Cancel</button>
                </div>
            </div>

            <div id="resume-modal-processing" class="hidden">
                <div class="card-row">
                    <h1 class="card-title">Processing your resume</h1>
                </div>

                <div class="card-row">
                    <div class="loader">
                        <div class="loader-dot"></div>
                        <div class="loader-dot"></div>
                        <div class="loader-dot"></div>
                    </div>
                </div>

                <div class="card-row">
                    <p class="card-field-value">This may take a few seconds... <br>We are extracting your skills and experience from the resume. Don't worry, you will be able to review and edit the extracted information before it is saved to your profile.
                    </p>
                </div>
            </div>

            <div id="resume-modal-review" class="hidden">
                
            </div>
        </div>
    </div>

and the js:
// Regular Resume Upload (no AI)
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const token = sessionStorage.getItem('token');

    try {
        const res = await fetch('/api/resumes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (handleAuthError(res)) return;

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to upload resume.');
            return;
        }

        const fileInput = document.getElementById('resume-file');
        fileInput.value = ''; // Clear the file input
        await loadProfile(); // Refresh the profile to show the new resume
    } catch (error) {
        console.error('Error uploading resume:', error);
        alert('Could not reach the server. Please try again later.');
    } finally {
        // Hide the upload modal after processing
        const resumeModal = document.getElementById('resume-modal');
        resumeModal.classList.add('hidden');
    }
}

// AI Resume Upload and Parsing
async function uploadAndParseFile(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const token = sessionStorage.getItem('token');

    // Show a loading state since AI parsing might take longer
    const uploadModal = document.getElementById('resume-modal-upload');
    const processingModal = document.getElementById('resume-modal-processing');
    const reviewModal = document.getElementById('resume-modal-review');

    uploadModal.classList.add('hidden');
    processingModal.classList.remove('hidden');

    try {
        console.log('Uploading and parsing resume with AI...');

        const res = await fetch('/api/resumes/resume-extract', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (handleAuthError(res)) return;
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to upload and parse resume.');
            return;
        }

        document.getElementById('resume-file').value = ''; // Clear the file input
        await loadProfile(); // Refresh the profile to show the new data, including the extracted profile details
    } catch (error) {
        console.error('Error extracting the resume with AI:', error);
        alert('Could not reach the server. Please try again later.');
    } finally {
        // Restore the upload modal state after processing
        processingModal.classList.add('hidden');
        uploadModal.classList.remove('hidden');
        const resumeModal = document.getElementById('resume-modal');
        resumeModal.classList.add('hidden');
    }
}

async function handleResume(file) {
    if (!file) return;

    const parseWithAI = document.getElementById('resume-parse').checked;

    if (parseWithAI) {
        await uploadAndParseFile(file);

    } else {
        await uploadFile(file);
    }
}

and the controller code:
uploadAndExtract = async (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Choose a PDF or DOCX resume to upload.' });
        }

        const userId = req.user?.userId || req.user?.id;

        try {
            // Save metadata record to DB
            const record = await this.store.create({
                id: req.file.filename.split('.')[0],
                user_id: userId,
                original_name: path.basename(req.file.originalname),
                stored_name: req.file.filename,
                mime_type: req.file.mimetype,
                size_bytes: req.file.size,
            });

            // Parse the file with AI to extract structured data
            const aiExtractedData = await parseResumeWithAI(req.file.path, req.file.mimetype);

            // Return both resume metadata & AI extracted data
            res.status(201).json({ 
                resume: this._publicResume(record), 
                extractedProfile: aiExtractedData 
            });
        } catch (error) {
            this._removeFile(req.file);
            next(error);
        }
    };

So what I want to do right now is make sure that the user is able to confirm/edit the details before committing everything to the db. Can you guide me.

## Response 2

### Architecture Strategy for Review & Commit

To allow users to review and edit extracted details before committing them permanently, you need a **two-step staging pattern**:

1. **Staging / Extraction (`POST /api/resumes/resume-extract`)**: The backend parses the uploaded resume and returns the extracted JSON (skills, experience, summary) **without** saving those profile fields to the database yet. (Note: Your controller already creates a DB record for the resume file itself, which is good so the file is stored, but you should hold off on committing the extracted profile data until the user confirms).
2. **Review & Commit (`PUT /api/profile/:id`)**: The frontend populates an interactive form with the `extractedProfile` data. The user can modify or delete fields, and clicking "Save" submits the final payload to your profile update endpoint.

---

### Step 1: Update the Backend Controller (`uploadAndExtract`)

Currently, your controller saves the resume metadata and runs the AI parser, but doesn't automatically save profile edits unless handled elsewhere. Make sure `uploadAndExtract` **only returns the extracted data** so the frontend can display it for review:

```javascript
uploadAndExtract = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Choose a PDF or DOCX resume to upload.' });
    }

    const userId = req.user?.userId || req.user?.id;

    try {
        // Save the resume file metadata record so it exists
        const record = await this.store.create({
            id: req.file.filename.split('.')[0],
            user_id: userId,
            original_name: path.basename(req.file.originalname),
            stored_name: req.file.filename,
            mime_type: req.file.mimetype,
            size_bytes: req.file.size,
        });

        // Parse the file with AI to extract structured data
        const aiExtractedData = await parseResumeWithAI(req.file.path, req.file.mimetype);

        // Return resume metadata and preview of extracted profile for frontend review
        res.status(200).json({ 
            resume: this._publicResume(record), 
            extractedProfile: aiExtractedData 
        });
    } catch (error) {
        this._removeFile(req.file);
        next(error);
    }
};

```

---

### Step 2: Populate the Review Modal in Frontend (`profile.js`)

When `uploadAndParseFile` receives the `extractedProfile`, instead of immediately finishing, it should hide the processing loader and render an interactive form inside `#resume-modal-review` where users can inspect and tweak the data.

Add this review rendering logic to your JS:

```javascript
async function uploadAndParseFile(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const token = sessionStorage.getItem('token');

    const uploadModal = document.getElementById('resume-modal-upload');
    const processingModal = document.getElementById('resume-modal-processing');
    const reviewModal = document.getElementById('resume-modal-review');

    uploadModal.classList.add('hidden');
    processingModal.classList.remove('hidden');

    try {
        const res = await fetch('/api/resumes/resume-extract', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (handleAuthError(res)) return;
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to parse resume.');
            processingModal.classList.add('hidden');
            uploadModal.classList.remove('hidden');
            return;
        }

        // Switch to Review Step
        processingModal.classList.add('hidden');
        reviewModal.classList.remove('hidden');
        
        renderReviewForm(data.extractedProfile);

    } catch (error) {
        console.error('Error extracting resume:', error);
        alert('Could not reach the server.');
        processingModal.classList.add('hidden');
        uploadModal.classList.remove('hidden');
    }
}

function renderReviewForm(profile) {
    const reviewModal = document.getElementById('resume-modal-review');
    
    // Build a clean review & edit form dynamically
    reviewModal.innerHTML = `
        <div class="card-row">
            <h1 class="card-title">Review Extracted Details</h1>
        </div>
        <form id="resume-review-form" class="card-row-vertical">
            <label for="review-summary">Summary</label>
            <textarea id="review-summary" rows="3">${profile.summary || ''}</textarea>

            <h3>Extracted Skills</h3>
            <div id="review-skills-container" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
                ${(profile.skills || []).map((skill, index) => `
                    <span class="skill-tag" style="background: var(--color-surface); padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                        <input type="text" value="${typeof skill === 'string' ? skill : skill.name}" data-index="${index}" class="review-skill-input" style="border:none; background:transparent; font-weight:500;" />
                        <button type="button" onclick="this.parentElement.remove()" style="border:none; background:none; cursor:pointer;">&times;</button>
                    </span>
                `).join('')}
            </div>

            <div class="card-row" style="gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn-primary">Confirm & Save to Profile</button>
                <button type="button" class="btn-secondary" id="cancel-review">Cancel</button>
            </div>
        </form>
    `;

    // Handle form submission to commit changes to the database
    document.getElementById('resume-review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await commitExtractedProfile(profile);
    });

    document.getElementById('cancel-review').addEventListener('click', () => {
        document.getElementById('resume-modal').classList.add('hidden');
        loadProfile();
    });
}

async function commitExtractedProfile(originalProfile) {
    const token = sessionStorage.getItem('token');
    const updatedSummary = document.getElementById('review-summary').value.trim();
    
    // Gather edited skills from inputs
    const skillInputs = document.querySelectorAll('.review-skill-input');
    const editedSkills = Array.from(skillInputs).map(input => input.value.trim()).filter(Boolean);

    try {
        // Send final reviewed payload to your profile update endpoint
        const res = await fetch(`/api/profile/${profileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                summary: updatedSummary,
                skills: editedSkills
            })
        });

        if (!res.ok) throw new Error('Failed to save profile changes.');

        // Close modal and refresh profile view
        document.getElementById('resume-modal').classList.add('hidden');
        await loadProfile();
        alert('Profile successfully updated from your resume!');
    } catch (error) {
        console.error('Error committing profile:', error);
        alert('Failed to save changes to your profile.');
    }
}

```

## Prompt 3

Ok for a bit more context, which could be useful when making these functions, here are some other functions I already had:
function populateExperience(experiences) {
    const experienceList = document.getElementById('experience-list');
    experienceList.innerHTML = ''; // Clear existing experience entries
    const canEdit = String(profileId) === String(user.id);

    const grouped = experiences.reduce((acc, exp) => {
        if (!acc[exp.company_name]) acc[exp.company_name] = [];
        acc[exp.company_name].push(exp);
        return acc;
    }, Object.create(null));

    Object.keys(grouped).forEach(companyName => {
        const historyGroup = document.createElement('div');
        historyGroup.className = 'company-history-group';

        const historyTitle = document.createElement('div');
        historyTitle.className = 'company-history-title';
        historyTitle.innerHTML = `
            <h2 class="card-field-title">${escapeProfile(companyName)}</h2>
        `;
        historyGroup.appendChild(historyTitle);

        const positionList = document.createElement('ul');
        positionList.className = 'company-history-position-list';

        grouped[companyName].forEach(exp => {
            const positionItem = document.createElement('li');
            positionItem.className = 'company-history-position';
            positionItem.innerHTML = `
            <div class="company-history-position-date">
                <span>${new Date(exp.start_date).getFullYear()}</span>
            </div>

            <div class="company-history-position-title">
                <span>${escapeProfile(exp.title)}</span>
            </div>
            <div class="company-history-position-details">
                <p id="position-info">
                    ${escapeProfile(exp.details)}
                </p>
            </div>
            `;

            // Add delete button if the user can edit
            if (canEdit) {
                const companyHistoryPositionTitle = positionItem.querySelector('.company-history-position-title');

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-secondary experience-delete-btn hidden';
                deleteBtn.innerHTML = `
                <?xml version="1.0" encoding="UTF-8"?><svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                `;
                deleteBtn.addEventListener('click', async () => {
                    if (!confirm('Are you sure you want to delete this experience entry?')) return;
                    
                    const token = sessionStorage.getItem('token');
                    const res = await fetch(`/api/profile/${profileId}/experience/${exp.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.status === 204) {
                        loadProfile();
                    } else {
                        alert('Failed to delete experience.');
                    }
                });
                companyHistoryPositionTitle.appendChild(deleteBtn);
            }

            positionList.appendChild(positionItem);
        });
        historyGroup.appendChild(positionList);
        experienceList.appendChild(historyGroup);
    });
}

function populateSkills(skills) {
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = ''; // Clear existing skills entries

    skills.forEach(skill => {
        addSkillToList(skill, false);
    });
}
function addSkillToList(skill, editable = false) {
    const skillsList = document.getElementById('skills-list');
    const skillItem = document.createElement('li');
    skillItem.classList.add('skill-item');
    skillItem.setAttribute('data-skill-id', skill.id);
    skillItem.setAttribute('data-skill-level', skill.level);
    
    skillItem.innerHTML = `
    <div class="skill-level-indicator">
    <div class="skill-level-indicator-tooltip">
    <span>${escapeProfile(skill.level)}</span>
    </div>
    </div>
    <span class="skill-name">${escapeProfile(skill.name)}</span>
    <div class="skill-actions">
    <button class="skill-action-delete">
    <?xml version="1.0" encoding="UTF-8"?><svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    </button>
    </div>
    `;
    skillsList.appendChild(skillItem);

    if (editable) {
        skillItem.classList.add('editable');

        const deleteBtn = skillItem.querySelector('.skill-action-delete');
        deleteBtn.addEventListener('click', skillDeleteHandler(skillItem, skill.id));
    }
}

## Response 3

### Review and Commit Integration

Building on your existing `populateExperience`, `populateSkills`, and `addSkillToList` functions, we can seamlessly construct the review modal interface.

Since your AI extraction returns a structured payload (likely containing fields like `summary`, `skills`, and `experience`), your review modal should present these fields in editable inputs so the user can verify or adjust them before saving.

Here is how you can implement `renderReviewForm` to hook directly into your UI patterns:

```javascript
function renderReviewForm(extractedProfile) {
    const reviewModal = document.getElementById('resume-modal-review');
    
    // Extract properties safely with fallbacks
    const summary = extractedProfile.summary || '';
    const skills = extractedProfile.skills || [];
    const experiences = extractedProfile.experience || [];

    reviewModal.innerHTML = `
        <div class="card-row">
            <h1 class="card-title">Review Extracted Details</h1>
        </div>
        <form id="resume-review-form" class="card-row-vertical" style="gap: 20px; max-height: 70vh; overflow-y: auto; padding-right: 5px;">
            
            <!-- Summary Review -->
            <div>
                <label for="review-summary" class="card-field-title">Summary</label>
                <textarea id="review-summary" rows="3" style="width: 100%; margin-top: 6px; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border, #ccc);">${escapeProfile(summary)}</textarea>
            </div>

            <!-- Skills Review -->
            <div>
                <h3 class="card-field-title" style="margin-bottom: 8px;">Extracted Skills</h3>
                <div id="review-skills-list" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${skills.map((skill, index) => {
                        const skillName = typeof skill === 'string' ? skill : skill.name;
                        const skillLevel = typeof skill === 'object' && skill.level ? skill.level : 'beginner';
                        return `
                            <div class="skill-review-item" data-index="${index}" style="display: flex; align-items: center; gap: 6px; background: var(--color-surface, #f5f5f5); padding: 4px 10px; border-radius: 16px; border: 1px solid var(--color-border, #ddd);">
                                <input type="text" value="${escapeProfile(skillName)}" class="review-skill-name-input" style="border: none; background: transparent; font-weight: 500; outline: none; width: 100px;" />
                                <select class="review-skill-level-select" style="border: none; background: transparent; font-size: 0.85rem; color: var(--color-text-muted, #666); cursor: pointer;">
                                    <option value="beginner" ${skillLevel === 'beginner' ? 'selected' : ''}>Beginner</option>
                                    <option value="intermediate" ${skillLevel === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                                    <option value="advanced" ${skillLevel === 'advanced' ? 'selected' : ''}>Advanced</option>
                                </select>
                                <button type="button" onclick="this.closest('.skill-review-item').remove()" style="border: none; background: none; cursor: pointer; font-size: 1rem; color: #ff4d4f;">&times;</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Experience Review -->
            <div>
                <h3 class="card-field-title" style="margin-bottom: 8px;">Extracted Experience</h3>
                <div id="review-experience-list" style="display: flex; flex-direction: column; gap: 12px;">
                    ${experiences.map((exp, index) => `
                        <div class="experience-review-item card-surface" data-index="${index}" style="padding: 12px; border: 1px solid var(--color-border, #ddd); border-radius: 6px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                                <input type="text" placeholder="Job Title" value="${escapeProfile(exp.title || '')}" class="review-exp-title" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;" required />
                                <input type="text" placeholder="Company Name" value="${escapeProfile(exp.company_name || '')}" class="review-exp-company" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;" required />
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                                <input type="date" value="${exp.start_date || ''}" class="review-exp-start" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;" />
                                <input type="date" value="${exp.end_date || ''}" class="review-exp-end" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;" />
                            </div>
                            <textarea placeholder="Description / Details" class="review-exp-details" rows="2" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">${escapeProfile(exp.details || '')}</textarea>
                            <button type="button" onclick="this.closest('.experience-review-item').remove()" class="btn-secondary" style="margin-top: 8px; font-size: 0.8rem; padding: 2px 8px; color: #ff4d4f;">Remove Position</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Actions -->
            <div class="card-row" style="gap: 10px; margin-top: 10px; justify-content: flex-end;">
                <button type="submit" class="btn-primary">Confirm & Commit to Profile</button>
                <button type="button" class="btn-secondary" id="cancel-review">Cancel</button>
            </div>
        </form>
    `;

    // Bind Form Submit Action
    document.getElementById('resume-review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await commitExtractedProfile();
    });

    // Bind Cancel Action
    document.getElementById('cancel-review').addEventListener('click', () => {
        document.getElementById('resume-modal').classList.add('hidden');
        loadProfile();
    });
}

```

### Handling the Commit (`commitExtractedProfile`)

Once the user hits **"Confirm & Commit to Profile"**, gather all the updated DOM values from the review form and send them via your profile update APIs:

```javascript
async function commitExtractedProfile() {
    const token = sessionStorage.getItem('token');
    const updatedSummary = document.getElementById('review-summary').value.trim();

    // 1. Gather Edited Skills
    const skillItems = document.querySelectorAll('.skill-review-item');
    const compiledSkills = Array.from(skillItems).map(item => {
        return {
            name: item.querySelector('.review-skill-name-input').value.trim(),
            level: item.querySelector('.review-skill-level-select').value
        };
    }).filter(s => s.name);

    // 2. Gather Edited Experiences
    const expItems = document.querySelectorAll('.experience-review-item');
    const compiledExperiences = Array.from(expItems).map(item => {
        return {
            title: item.querySelector('.review-exp-title').value.trim(),
            company_name: item.querySelector('.review-exp-company').value.trim(),
            start_date: item.querySelector('.review-exp-start').value || null,
            end_date: item.querySelector('.review-exp-end').value || null,
            details: item.querySelector('.review-exp-details').value.trim()
        };
    }).filter(e => e.title && e.company_name);

    try {
        // Update Summary & Profile details
        const profileRes = await fetch(`/api/profile/${profileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ summary: updatedSummary })
        });

        if (!profileRes.ok) throw new Error('Failed to update profile summary.');

        // Optionally, make sequential requests to add compiled skills & experiences if your API supports batch or individual posts
        for (const skill of compiledSkills) {
            await fetch(`/api/profile/${profileId}/skills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(skill)
            });
        }

        for (const exp of compiledExperiences) {
            await fetch(`/api/profile/${profileId}/experience`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(exp)
            });
        }

        // Close modal, clean up UI state, and refresh profile view
        document.getElementById('resume-modal').classList.add('hidden');
        document.getElementById('resume-modal-review').classList.add('hidden');
        document.getElementById('resume-modal-upload').classList.remove('hidden');
        
        await loadProfile();
        alert('Profile successfully updated and verified from your resume!');
    } catch (error) {
        console.error('Error committing reviewed profile:', error);
        alert('Failed to save verified profile details.');
    }
}

```
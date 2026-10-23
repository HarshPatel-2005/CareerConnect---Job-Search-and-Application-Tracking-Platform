const user = JSON.parse(localStorage.getItem('user') || '{}');
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id') || user.id;

// Redirect to login if the user is not authenticated and no profile ID is provided
if (!profileId && !user.id) {
    window.location.href = '/login.html';
}

// Init the profile info on load
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
});

function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

        // Enable skill adding
        const skillForm = document.getElementById('skill-editor-form');

        skillForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('skill-name-input');
            const selectedLevelInput = document.querySelector('input[name="skill-level"]:checked');

            const name = nameInput.value.trim();
            const level = selectedLevelInput ? selectedLevelInput.value : 'beginner';

            if(!name) return;

            const token = localStorage.getItem('token');
            const submitButton = document.getElementById('skill-editor-submit-btn');

            submitButton.disabled = true;
            submitButton.textContent = 'Adding...';

            try {
                const response = await fetch(`/api/profile/${profileId}/skills`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, level })
                });

                if (handleAuthError(response)) return;

                const data = await response.json();

                if (!response.ok) {
                    alert(data.error || 'Failed to add skill.');
                    return;
                }

                nameInput.value = '';
                // Repopulate the skills list after adding a new skill
                const skillObject = { id: data.id, name, level };
                addSkillToList(skillObject, true);
            } catch (error) {
                console.error('Error adding skill:', error);
                alert('Could not reach the server. Please try again later.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Add Skill';
            }
        });
        
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

    } else {
        // --- SAVE CHANGES ---
        saveProfileChanges(editButton);
    }
}

function skillDeleteHandler(skillItem, skillId) {
    return async () => {
        if (!confirm(`Are you sure you want to delete "${skillItem.querySelector('#skill-name').textContent}"?`)) return;

        const token = localStorage.getItem('token');

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
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    }
}

async function loadProfile() {
    // Disable the edit button if the user is viewing someone else's profile
    const editButton = document.getElementById('edit-btn');
    const isOwner = String(profileId) === String(user.id);

    if (!isOwner && editButton) {
        editButton.style.display = 'none';
    } else if (isOwner && editButton) {
        editButton.addEventListener('click', toggleEditMode);
    }

    try {
        const profileRes = await fetch(`/api/profile/${profileId}`, {
            method: 'GET'
        });

        if (handleAuthError(profileRes)) return;

        const profileData = await profileRes.json();

        if (!profileRes.ok) {
            console.error('Error loading profile:', profileData.error || 'Unknown error');
            return;
        }

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
        if (isOwner) {
            const resumeRes = await fetch(`/api/resumes`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (handleAuthError(resumeRes)) return;
            const resumeData = await resumeRes.json();

            if (resumeRes.ok && resumeData.resumes && resumeData.resumes.length > 0) {
                resumeContainer.classList.remove('hidden');
                populateResumes(resumeData.resumes);
            } else {
                resumeContainer.classList.add('hidden');
            }
        } else {
            resumeContainer.classList.add('hidden');
        }

        // Setup resume upload functionality for profile owner
        if (isOwner) {
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
    }
}

async function uploadResumeFile(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const token = localStorage.getItem('token');

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
    const token = localStorage.getItem('token');
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

function populateExperience(experience) {
    const experienceList = document.getElementById('experience-list');
    experienceList.innerHTML = ''; // Clear existing experience entries

    experience.forEach(exp => {
        const historyGroup = document.createElement('div');
        historyGroup.className = 'company-history-group';

        const historyTitle = `
        <div class="company-history-title">
            <h2 class="card-field-title">${exp.company}</h2>
            <p class="company-history-dates">${exp.startDate} - ${exp.endDate}</p>
        </div>
        `;

        historyGroup.innerHTML = historyTitle;

        const positionList = document.createElement('ul');
        positionList.className = 'company-history-position-list';

        exp.positions.forEach(pos => {
            const positionItem = document.createElement('li');
            positionItem.className = 'company-history-position';
            positionItem.innerHTML = `
            <div class="company-history-position-date">
                <span>${pos.date}</span>
            </div>

            <div class="company-history-position-title">
                <span>${pos.title}</span>
            </div>
            <div class="company-history-position-details">
                <p id="position-info">
                    ${pos.details}
                </p>
            </div>
            `;
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
    <span>${skill.level}</span>
    </div>
    </div>
    <span id="skill-name">${skill.name}</span>
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
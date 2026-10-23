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

async function loadProfile() {
    // Disable the edit button if the user is viewing someone else's profile
    const editButton = document.getElementById('edit-btn');

    if (profileId !== user.id) {
        if (editButton) {
            editButton.style.display = 'none';
        }
    }

    try {
        const response = await fetch(`/api/profile/${profileId}`, {
            method: 'GET'
        });

        if (handleAuthError(response)) return;

        const data = await response.json();

        if (!response.ok) {
            console.error('Error loading profile:', data.error || 'Unknown error');
            return;
        }

        // Populate the profile fields
        document.getElementById('profile-name').textContent = data.full_name;

        if (data.company) {
            document.getElementById('profile-company').textContent = data.company;
        }

        if (data.summary) {
            document.getElementById('profile-summary').classList.remove('hidden');
            document.getElementById('profile-summary-text').textContent = data.summary;
        } else {
            document.getElementById('profile-summary').classList.add('hidden');
        }

        if (data.resumes && data.resumes.length > 0) {
            document.getElementById('profile-resumes').classList.remove('hidden');
            populateResumes(data.resumes);
        } else {
            document.getElementById('profile-resumes').classList.add('hidden');
        }

        if (data.experience && data.experience.length > 0) {
            document.getElementById('profile-experience').classList.remove('hidden');
            populateExperience(data.experience);            
        } else {
            document.getElementById('profile-experience').classList.add('hidden');
        }

        if (data.skills && data.skills.length > 0) {
            document.getElementById('profile-skills').classList.remove('hidden');
            populateSkills(data.skills);
        } else {
            document.getElementById('profile-skills').classList.add('hidden');
        }

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function populateResumes(resumes) {
    const resumeList = document.getElementById('resume-list');

    const canEdit = profileId === user.id;

    const resumeRows = resumes.map(resume => {
        const row = document.createElement('div');
        row.className = 'resume-row';

        const fileName = document.createElement('div');
        fileName.className = 'resume-field';
        fileName.textContent = resume.file_name;

        const dateUploaded = document.createElement('div');
        dateUploaded.className = 'resume-field';
        dateUploaded.textContent = resume.date_uploaded;

        const fileSize = document.createElement('div');
        fileSize.className = 'resume-field';
        fileSize.textContent = `${(resume.file_size / 1024).toFixed(2)} KB`;

        const resumeActions = document.createElement('div');
        resumeActions.className = 'resume-actions';

        const downloadButton = document.createElement('button');
        downloadButton.className = 'btn-secondary resume-action-btn';
        downloadButton.ariaLabel = 'Download Resume';
        downloadButton.innerHTML = `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 20L18 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 4V16M12 16L15.5 12.5M12 16L8.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

        resumeActions.appendChild(downloadButton);

        if (canEdit) {
            const replaceButton = document.createElement('button');
            replaceButton.className = 'btn-secondary resume-action-btn';
            replaceButton.ariaLabel = 'Replace Resume';
            replaceButton.innerHTML = `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M3 21L12 21H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12.2218 5.82839L15.0503 2.99996L20 7.94971L17.1716 10.7781M12.2218 5.82839L6.61522 11.435C6.42769 11.6225 6.32233 11.8769 6.32233 12.1421L6.32233 16.6776L10.8579 16.6776C11.1231 16.6776 11.3774 16.5723 11.565 16.3847L17.1716 10.7781M12.2218 5.82839L17.1716 10.7781" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn-secondary resume-action-btn';
            deleteButton.ariaLabel = 'Delete Resume';
            deleteButton.innerHTML = `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
            
            resumeActions.appendChild(replaceButton);
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
        const skillItem = document.createElement('li');
        skillItem.className = 'skill-item';
        skillItem.dataset.skillLevel = skill.level; // Store skill level for filtering

        skillItem.innerHTML = `
        <div class="skill-level-indicator">
            <div class="skill-level-indicator-tooltip">
                <span>${skill.level}</span>
            </div>
        </div>
        <span id="skill-name">${skill.name}</span>
        `;
        skillsList.appendChild(skillItem);
    });
}
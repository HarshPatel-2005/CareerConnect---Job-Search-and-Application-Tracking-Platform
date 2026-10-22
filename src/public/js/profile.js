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

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}
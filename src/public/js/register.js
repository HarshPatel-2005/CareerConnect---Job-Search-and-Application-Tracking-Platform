document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const roleRadios = document.getElementsByName('role');
    const recruiterActions = document.getElementsByName('recruiterAction');

    const recruiterSection = document.getElementById('recruiter-fields');
    const companyNameGroup = document.getElementById('company-name-group');
    const inviteCodeGroup = document.getElementById('invite-code-group');
    const companyNameInput = document.getElementById('company-name');
    const inviteCodeInput = document.getElementById('invite-code');

    const messageContainer = document.getElementById('message-container');
    const submitButton = document.getElementById('submit-btn');


    // Handle Role Toggle
    roleRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'recruiter') {
                recruiterSection.classList.remove('hidden');
                updateRecruiterRequirements();
            } else {
                recruiterSection.classList.add('hidden');
                companyNameInput.required = false;
                inviteCodeInput.required = false;
            }
        });
    });


    // Handle Recruiter Actions Toggle (Create vs Join)
    recruiterActions.forEach(radio => {
        radio.addEventListener('change', () => {
            updateRecruiterRequirements();
        });
    });


    function updateRecruiterRequirements() {
        const action = document.querySelector('input[name="recruiterAction"]:checked').value;

        if (action === 'create') {
            companyNameGroup.classList.remove('hidden');
            inviteCodeGroup.classList.add('hidden');
            companyNameInput.required = true;
            inviteCodeInput.required = false;
        } else {
            companyNameGroup.classList.add('hidden');
            inviteCodeGroup.classList.remove('hidden');
            companyNameInput.required = false;
            inviteCodeInput.required = true;
        }
    }

    // Handle Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        showMessage('');
        submitButton.disabled = true;
        submitButton.textContent = 'Registering...';

        const role = document.querySelector('input[name="role"]:checked').value;

        const payload = {
            full_name: document.getElementById('first-name').value.trim() + ' ' + document.getElementById('last-name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            role: role
        };

        if (role === 'recruiter') {
            const action = document.querySelector('input[name="recruiterAction"]:checked').value;
            if (action === 'create') {
                payload.company_name = companyNameInput.value.trim();
            } else {
                payload.invite_code = inviteCodeInput.value.trim();
            }
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            showMessage('Registration successful! You can now log in.', 'success');
            form.reset();

            document.querySelector('input[value="job_seeker"]').checked = true;
            recruiterSection.classList.add('hidden');
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        }
    });

    function showMessage(text, type) {
        messageContainer.textContent = text;
        messageContainer.className = 'alert';

        if (text) {
            messageContainer.classList.add(type);
        } else {
            messageContainer.classList.add('hidden');
        }
    }
});
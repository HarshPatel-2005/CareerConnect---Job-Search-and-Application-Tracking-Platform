document.addEventListener('DOMContentLoaded', async () => {
    // Check if the user is already logged in
    const token = sessionStorage.getItem('token');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (token && user.id && await CareerConnect.validateSession()) {
        // Redirect to profile page if logged in
        window.location.href = CareerConnect.destination();
        return;
    }

    const form = document.getElementById('login-form');
    const messageContainer = document.getElementById('message-container');
    const submitButton = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        showMessage('');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        const payload = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store JWT and user details in sessionStorage
            CareerConnect.saveSession(data);

            showMessage('Login successful! Redirecting...', 'success');

            // Redirect to profile page after a short delay
            setTimeout(() => {
                window.location.href = CareerConnect.destination();
            }, 1000);
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
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

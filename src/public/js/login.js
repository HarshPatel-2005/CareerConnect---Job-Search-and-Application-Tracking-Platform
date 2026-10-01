document.addEventListener('DOMContentLoaded', () => {
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

            showMessage('Login successful!', 'success');

            console.log('Logged in user:', data.user);

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
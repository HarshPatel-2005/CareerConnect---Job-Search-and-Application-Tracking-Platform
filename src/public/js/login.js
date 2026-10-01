document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const messageContainer = document.getElementById('message-container');
    const submitButton = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        showMessage('');

        if (!email || !password) {
            showMessage('Please enter your email and password.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            showMessage('Login successful!', 'success');

            console.log('Logged in user:', data.user);

        } catch (error) {
            console.error('Login error:', error);
            showMessage(error.message || 'Unable to log in.', 'error');
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
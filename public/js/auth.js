document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            checkAuth();
        } else {
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        console.error('Login error:', err);
    }
});

async function checkAuth() {
    // We check auth by trying to fetch clients
    try {
        const response = await fetch('/api/clients');
        if (response.ok) {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('dashboard-container').style.display = 'block';
            loadSection('all');
        } else {
            document.getElementById('auth-container').style.display = 'flex';
            document.getElementById('dashboard-container').style.display = 'none';
        }
    } catch (err) {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('dashboard-container').style.display = 'none';
    }
}

document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    checkAuth();
});

// Initial check
checkAuth();

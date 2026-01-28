const contentArea = document.getElementById('content-area');
const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        loadSection(link.dataset.section);
    });
});

async function loadSection(section) {
    contentArea.innerHTML = '<p>Loading...</p>';

    switch (section) {
        case 'all':
            renderClients('All Clients', '/api/clients');
            break;
        case 'bday-7':
            renderClients('Birthday in 7 Days', '/api/clients/birthday/7');
            break;
        case 'bday-3':
            renderClients('Birthday in 3 Days', '/api/clients/birthday/3');
            break;
        case 'bday-0':
            renderClients('Birthday Today', '/api/clients/birthday/0');
            break;
        case 'add':
            renderAddForm();
            break;
        case 'telegram':
            renderTelegramInfo();
            break;
    }
}

async function renderClients(title, url) {
    try {
        const response = await fetch(url);
        const clients = await response.json();

        let html = `<h2>${title}</h2><div class="card">`;
        if (clients.length === 0) {
            html += '<p style="padding: 1rem;">No clients found.</p>';
        } else {
            html += `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>DOB</th>
                            <th>Age</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.map(c => `
                            <tr>
                                <td>${c.first_name} ${c.last_name}</td>
                                <td>${c.date_of_birth}</td>
                                <td>${c.age}</td>
                                <td>${c.phone_number}</td>
                                <td>
                                    <button onclick="deleteClient(${c.id})" style="color: var(--danger); background: none; border: none; cursor: pointer;">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        html += '</div>';
        contentArea.innerHTML = html;
    } catch (err) {
        contentArea.innerHTML = '<p>Error loading clients.</p>';
    }
}

function renderAddForm() {
    contentArea.innerHTML = `
        <h2>Add New Client</h2>
        <div class="card" style="padding: 2rem; max-width: 600px;">
            <form id="add-client-form">
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" id="fname" required>
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" id="lname" required>
                </div>
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" id="dob" required>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="text" id="phone" required placeholder="+1234567890">
                </div>
                <button type="submit">Add Client</button>
                <p id="add-error" class="error-msg"></p>
                <p id="add-success" style="color: var(--success); display: none; margin-top: 1rem;">Client added successfully!</p>
            </form>
        </div>
    `;

    document.getElementById('add-client-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            first_name: document.getElementById('fname').value,
            last_name: document.getElementById('lname').value,
            date_of_birth: document.getElementById('dob').value,
            phone_number: document.getElementById('phone').value
        };

        const errorMsg = document.getElementById('add-error');
        const successMsg = document.getElementById('add-success');
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                successMsg.style.display = 'block';
                e.target.reset();
            } else {
                const errResult = await response.json();
                errorMsg.textContent = errResult.error || 'Failed to add client';
                errorMsg.style.display = 'block';
            }
        } catch (err) {
            errorMsg.textContent = 'Network error';
            errorMsg.style.display = 'block';
        }
    });
}

function renderTelegramInfo() {
    contentArea.innerHTML = `
        <h2>Telegram Registration</h2>
        <div class="info-box">
            <p>Clients can register themselves using our Telegram bot. This allows the system to send them birthday greetings automatically.</p>
        </div>
        <div class="card" style="padding: 2rem;">
            <h3>How to Register:</h3>
            <div style="margin-top: 1.5rem;">
                <div class="telegram-step">
                    <div class="step-num">1</div>
                    <div>Search for our bot on Telegram (use your bot's username).</div>
                </div>
                <div class="telegram-step">
                    <div class="step-num">2</div>
                    <div>Press <strong>/start</strong> to begin registration.</div>
                </div>
                <div class="telegram-step">
                    <div class="step-num">3</div>
                    <div>Follow the prompts: First Name → Last Name → Date of Birth → Phone Number.</div>
                </div>
                <div class="telegram-step">
                    <div class="step-num">4</div>
                    <div>Once finished, the client will appear in the "All Clients" list here!</div>
                </div>
            </div>
            
            <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 0.5rem;">
                <p><strong>Note for Admin:</strong> Ensure you have set the <code>TELEGRAM_BOT_TOKEN</code> in your <code>.env</code> file for the bot to work.</p>
            </div>
        </div>
    `;
}

async function deleteClient(id) {
    if (confirm('Are you sure you want to delete this client?')) {
        try {
            const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            if (response.ok) {
                const activeLink = document.querySelector('.nav-link.active');
                loadSection(activeLink.dataset.section);
            }
        } catch (err) {
            alert('Failed to delete client');
        }
    }
}

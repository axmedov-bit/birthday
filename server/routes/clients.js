const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to calculate age
function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Get all clients
router.get('/', auth, (req, res) => {
    try {
        const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
        const clientsWithAge = clients.map(c => ({
            ...c,
            age: calculateAge(c.date_of_birth)
        }));
        res.json(clientsWithAge);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Filter by birthday
router.get('/birthday/:days', auth, (req, res) => {
    const days = parseInt(req.params.days);
    try {
        const clients = db.prepare('SELECT * FROM clients').all();
        const today = new Date();

        const filtered = clients.filter(c => {
            const dob = new Date(c.date_of_birth);
            const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

            // If birthday already passed this year, check next year
            if (nextBirthday < today && nextBirthday.toDateString() !== today.toDateString()) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }

            const diffTime = nextBirthday - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (days === 0) {
                return nextBirthday.toDateString() === today.toDateString();
            }

            return diffDays === days;
        });

        const result = filtered.map(c => ({
            ...c,
            age: calculateAge(c.date_of_birth)
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new client
router.post('/', auth, (req, res) => {
    const { first_name, last_name, date_of_birth, phone_number } = req.body;

    if (!first_name || !last_name || !date_of_birth || !phone_number) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const stmt = db.prepare(`
      INSERT INTO clients (first_name, last_name, date_of_birth, phone_number)
      VALUES (?, ?, ?, ?)
    `);
        const info = stmt.run(first_name, last_name, date_of_birth, phone_number);
        res.status(201).json({ id: info.lastInsertRowid });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed: clients.phone_number')) {
            return res.status(400).json({ error: 'A client with this phone number already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete client
router.delete('/:id', auth, (req, res) => {
    try {
        db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

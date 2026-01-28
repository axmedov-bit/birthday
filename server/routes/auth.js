const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Hardcoded admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'axmedov';

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

        // Set cookie for browser clients
        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });

        return res.json({ success: true, token });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

module.exports = router;

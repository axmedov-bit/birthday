require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);

// Telegram Bot & Scheduler
require('./telegram/bot');
require('./scheduler/birthday');

// SPA Catch-all
app.use((req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, '..', 'public') });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

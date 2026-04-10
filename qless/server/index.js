require('dotenv').config();
const express = require('express');
const connectDB = require('./db');

const app = express();
const port = process.env.PORT || 5000;

// Parse JSON request bodies
app.use(express.json());

// Connect to MongoDB
connectDB();

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), time: new Date() });
});

// Example API endpoint
app.get('/api/menu', (req, res) => {
  res.json({ message: 'This is where you would return menu items.' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

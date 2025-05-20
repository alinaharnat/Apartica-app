// app.js
const express = require('express');
const cors = require('cors');
const passport = require('passport');
// const dotenv = require('dotenv'); // Більше не потрібно тут
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cityRoutes = require('./routes/cityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const propertyTypeRoutes = require('./routes/propertyTypeRoutes');
// dotenv.config(); // Прибираємо цей рядок, оскільки .env завантажується в server.js

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Тепер FRONTEND_URL має бути доступний
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
require('./config/passport')(passport); // passport.js також може використовувати process.env

app.get('/api/config/google-maps-key', (req, res) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY is not defined');
    return res.status(500).json({ error: 'Google Maps API key is not configured' });
  }
  res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', cityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/property-types', propertyTypeRoutes);
// Health check route
app.get('/', (req, res) => {
  res.send('API works');
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;

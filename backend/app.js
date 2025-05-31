// app.js
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cityRoutes = require('./routes/cityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const propertyTypeRoutes = require('./routes/propertyTypeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const photoRoutes = require('./routes/photoRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Додаємо middleware для парсингу текстових полів із FormData
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Роздача статичних файлів із папок для фото
app.use('/property_photos', express.static(path.join(__dirname, 'public/property_photos')));
app.use('/room_photos', express.static(path.join(__dirname, 'public/room_photos')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
require('./config/passport')(passport);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Google Maps API endpoint
app.get('/api/config/google-maps-key', (req, res) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY is not defined in environment variables');
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
app.use('/api/booking', bookingRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('API works');
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
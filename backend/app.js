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
const cronRoutes = require('./routes/cronRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const moderatorRoutes = require('./routes/moderatorRoutes');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Додаємо middleware для парсингу текстових полів із FormData
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

require('./config/cronJobs');
require('./config/cronJobs');

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://192.168.0.210:19006',
    'http://10.0.2.2:5000',
    'https://apartica-frontend.onrender.com/'
  ],
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
app.use('/api', cronRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/moderator', moderatorRoutes);


// Health check route
app.get('/', (req, res) => {
  res.send('API works');
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
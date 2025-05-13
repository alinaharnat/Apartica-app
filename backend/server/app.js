const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Налаштування змінних середовища
dotenv.config();

// Ініціалізація Express додатку
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Базовий маршрут
app.get('/', (req, res) => {
  res.send('API працює');
});

// Маршрути API
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/properties', require('./routes/propertyRoutes'));
// app.use('/api/bookings', require('./routes/bookingRoutes'));

// Middleware для обробки помилок
app.use(notFound);
app.use(errorHandler);

module.exports = app;
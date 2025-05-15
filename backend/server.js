// backend/server.js
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const userRoutes = require('./server/routes/userRoutes');
const authRoutes = require('./server/routes/authRoutes'); // якщо є
require('dotenv').config();

const connectDB = require('./connectDB');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // if implemented
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

// Google strategy config
require('./server/config/passport')(passport);

// Routes

connectDB();
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
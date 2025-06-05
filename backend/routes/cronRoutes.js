// routes/cronRoutes.js
const express = require('express');
const router = express.Router();
const { updateBookingStatus } = require('../config/cronJobs');

// Захищений ендпоінт для оновлення статусів
router.post('/bookings/update-status', async (req, res) => {
  try {
    // Додаткова авторизація (наприклад, секретний токен)
    const authToken = req.headers['x-auth-token'];
    if (authToken !== process.env.CRON_AUTH_TOKEN) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await updateBookingStatus();
    res.json({ message: 'Booking statuses updated successfully.' });
  } catch (error) {
    console.error('Error in update-status endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
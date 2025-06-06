// cronJobs.js
const cron = require('node-cron');
const Booking = require('../models/booking');

// Функція для оновлення статусів бронювань
const updateBookingStatus = async () => {
  try {
    const today = new Date();
    today.setHours(1, 0, 0, 0); // Скидаємо до початку дня (UTC)

    // Знаходимо бронювання зі статусом "confirmed", де checkOut <= сьогодні
    const bookings = await Booking.find({
      status: 'confirmed',
      checkOut: { $lte: today },
    });

    if (bookings.length === 0) {
      console.log('No bookings to update.');
      return;
    }

    // Оновлюємо статуси
    await Booking.updateMany(
      { _id: { $in: bookings.map((b) => b._id) } },
      { $set: { status: 'completed', updatedAt: new Date() } }
    );

    console.log(`Updated ${bookings.length} bookings to completed.`);
  } catch (error) {
    console.error('Error updating booking statuses:', error);
  }
};

// Catch-up при старті сервера
updateBookingStatus();

// CRON-задача щодня о 08:00 (UTC)
cron.schedule('0 8 * * *', updateBookingStatus, {
  timezone: 'UTC',
});

module.exports = { updateBookingStatus };
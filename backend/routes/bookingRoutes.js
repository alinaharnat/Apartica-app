const express = require('express');
const router = express.Router();
const {
  createBookingWithPayment,
  handlePaymentSuccess,
  handlePaymentCancel,
  getUserBookings,
  cancelBooking,
  getRefundAmount,
  getOwnerBookings,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createBookingWithPayment);
router.get('/success', handlePaymentSuccess);
router.get('/cancel', handlePaymentCancel);
router.get('/user', protect, getUserBookings);
router.post('/:bookingId/cancel', protect, cancelBooking);
router.get('/:bookingId/refund-amount', protect, getRefundAmount);
router.get('/owner', protect, getOwnerBookings);

module.exports = router;
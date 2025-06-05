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
  getRefundAmountForOwner,
  cancelBookingForOwner
} = require('../controllers/bookingController');
const { protect, auth } = require('../middleware/authMiddleware');

// User routes
router.post('/create', protect, createBookingWithPayment);
router.get('/success', handlePaymentSuccess);
router.get('/cancel', handlePaymentCancel);
router.get('/user', protect, getUserBookings);
router.post('/:bookingId/cancel', protect, cancelBooking);
router.get('/:bookingId/refund-amount', protect, getRefundAmount);

// Owner routes
router.get('/owner', auth, getOwnerBookings);
router.get('/:bookingId/owner/refund-amount', auth, getRefundAmountForOwner);
router.post('/:bookingId/owner/cancel', auth, cancelBookingForOwner);

module.exports = router;
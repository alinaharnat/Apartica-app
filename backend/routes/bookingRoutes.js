const express = require('express');
const router = express.Router();
const {
  createBookingWithPayment,
  handlePaymentSuccess,
  handlePaymentCancel,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createBookingWithPayment);
router.get('/success', handlePaymentSuccess);
router.get('/cancel', handlePaymentCancel);

module.exports = router;
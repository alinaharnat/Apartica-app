const express = require('express');
const router = express.Router();
const { getEligibleBookings, createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/eligible-bookings/:propertyId', protect, getEligibleBookings);
router.post('/', protect, createReview);

module.exports = router;
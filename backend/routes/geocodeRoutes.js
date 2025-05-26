// routes/geocodeRoutes.js
const express = require('express');
const router = express.Router();
const { geocodeAddress } = require('../controllers/geocodeController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/geocode/address
router.post('/address', protect, geocodeAddress);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getAmenities, getHouseRules } = require('../controllers/staticDataController');

// Get all amenities
router.get('/amenities', getAmenities);

// Get all house rules
router.get('/house-rules', getHouseRules);

module.exports = router;
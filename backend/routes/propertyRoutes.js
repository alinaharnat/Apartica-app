const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Create new property with file upload
router.post('/', protect, upload.fields([
  { name: 'propertyPhotos', maxCount: 6 },
  { name: 'room_0_photos', maxCount: 6 },
  { name: 'room_1_photos', maxCount: 6 },
  { name: 'room_2_photos', maxCount: 6 },
  { name: 'room_3_photos', maxCount: 6 },
  { name: 'room_4_photos', maxCount: 6 }
]), propertyController.createPropertyWithRooms);

// Get property by ID
router.get('/:id', propertyController.getPropertyById);

// Get all properties
router.get('/', propertyController.getProperties);

// Additional routes
router.get('/:id/available-rooms', propertyController.getAvailableRooms);
router.get('/:id/unavailable-dates', propertyController.getUnavailableDates);

module.exports = router;
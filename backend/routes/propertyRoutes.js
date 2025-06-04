const express = require('express');
const router = express.Router();
const {
  createPropertyWithRooms,
  getProperties,
  getPropertyById,
  getAvailableRooms,
  getUnavailableDates,
  getFormData,
  getPropertiesByOwner,
} = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const Property = require('../models/property'); // Add this import
const User = require('../models/user'); // Add this import

// IMPORTANT: Put specific routes BEFORE parameterized routes
router.get('/form-data', protect, getFormData);
router.get('/my-properties', protect, async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user._id })
      .populate('cityId', 'name')
      .populate('propertyType', 'name')
      .populate('ownerId', 'name displayName');
    
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/user/:userId', protect, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const properties = await Property.find({ ownerId: user._id })
      .populate('cityId', 'name')
      .populate('propertyType', 'name')
      .populate('ownerId', 'name displayName');
    
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/owner/:ownerId', protect, getPropertiesByOwner);

// Public routes
router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.get('/:id/available-rooms', getAvailableRooms);
router.get('/:id/unavailable-dates', getUnavailableDates);

// Protected routes
router.post('/', protect, createPropertyWithRooms);

module.exports = router;
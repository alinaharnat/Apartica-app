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
router.delete('/:id', protect, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this property' });
    }

    // Delete all rooms associated with the property
    const rooms = await Room.find({ propertyId: property._id });
    const roomIds = rooms.map(room => room._id);

    // Delete all photos associated with the property and its rooms
    await Photo.deleteMany({
      $or: [
        { propertyId: property._id },
        { roomId: { $in: roomIds } }
      ]
    });

    // Delete all rooms
    await Room.deleteMany({ propertyId: property._id });

    // Delete the property
    await property.deleteOne();

    res.json({ message: 'Property and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
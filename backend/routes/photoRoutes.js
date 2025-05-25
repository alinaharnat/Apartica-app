const express = require('express');
const router = express.Router();
const Photo = require('../models/рhoto');

// GET /api/photos?propertyId=...&limit=...
router.get('/', async (req, res) => {
  const { propertyId, roomId, limit } = req.query;

  try {
    if (!propertyId && !roomId) {
      return res.status(400).json({ message: 'propertyId or roomId is required' });
    }

    const filter = {};
    if (propertyId) filter.propertyId = propertyId;
    if (roomId) filter.roomId = roomId;

    const photos = await Photo.find(filter).limit(parseInt(limit) || 10);

    res.json(photos);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

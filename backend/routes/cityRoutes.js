const express = require('express');
const router = express.Router();

const City = require('../models/city'); 
const Property = require('../models/property');
const Country = require('../models/country');

// GET /api/popular-cities
router.get('/popular-cities', async (req, res) => {
  try {
    // Знаходимо всі міста з інформацією про країну
    const cities = await City.find().populate('countryId');

    // Підрахунок кількості властивостей для кожного міста
    const results = await Promise.all(
      cities.map(async (city) => {
        const propertyCount = await Property.countDocuments({ cityId: city._id });
        return {
          _id: city._id,
          name: city.name,
          imageUrl: city.imageUrl,
          country: city.countryId ? city.countryId.name : 'Unknown',
          propertyCount,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error('Error in /api/popular-cities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

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
router.get('/cities/search', async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim().length < 2) {
    return res.json([]);
  }

  try {
    const regex = new RegExp(query, 'i');

    const cities = await City.find({ name: regex }).limit(10).populate('countryId');

    const results = cities.map(city => ({
      id: city._id,
      name: city.name,
      country: city.countryId?.name || 'Unknown',
    }));

    res.json(results);
  } catch (err) {
    console.error('City search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/cities', async (req, res) => {
  try {
    const cities = await City.find().populate('countryId');
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/cities/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id).populate('countryId');
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.json(city);
  } catch (err) {
    console.error('Error getting city by id:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();

const City = require('../models/city'); 
const Property = require('../models/property');
const Country = require('../models/country');

// GET /api/popular-cities
router.get('/popular-cities', async (req, res) => {
  try {
    // Находим все города с информацией о стране
    const cities = await City.find().populate('countryId');

    // Подсчет количества свойств для каждого города
    const results = await Promise.all(
      cities.map(async (city) => {
        const propertyCount = await Property.countDocuments({ cityId: city._id });
        return {
          _id: city._id,
          name: city.name,
          imageUrl: city.imageUrl || 'https://via.placeholder.com/250', // Запасное изображение
          country: city.countryId ? city.countryId.name : 'Unknown',
          propertyCount,
        };
      })
    );

    // Сортировка по propertyCount (по убыванию) и ограничение до 10
    const sortedResults = results
      .sort((a, b) => b.propertyCount - a.propertyCount) // Сортировка по убыванию
      .slice(0, 10); // Ограничение до 10 записей

    // Проверка на пустой результат
    if (sortedResults.length === 0) {
      return res.status(200).json([]);
    }

    res.json(sortedResults);
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

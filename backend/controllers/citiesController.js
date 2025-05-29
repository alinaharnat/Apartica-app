
const City = require('../models/city');
const getTopCities = async (req, res) => {
  try {
    const topCities = await City.aggregate([
      {
        $lookup: {
          from: 'properties',
          localField: '_id',
          foreignField: 'cityId',
          as: 'properties'
        }
      },
      {
        $addFields: {
          hotelCount: { $size: '$properties' }
        }
      },
      { $sort: { hotelCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          imageUrl: 1,
          hotelCount: 1
        }
      }
    ]);
    res.json(topCities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

module.exports = {
  getTopCities
};


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

module.exports = {
  getTopCities
};

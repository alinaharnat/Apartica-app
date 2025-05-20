const PropertyType = require('../models/propertyType');

const getPropertyTypes = async (req, res) => {
  try {
    const types = await PropertyType.find({});
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPropertyTypes };
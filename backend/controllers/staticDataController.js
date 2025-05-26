const asyncHandler = require('express-async-handler');
const Amenity = require('../models/amenity');
const HouseRuleCategory = require('../models/houseRuleCategory');
const HouseRuleOption = require('../models/houseRuleOption');

// @desc    Get all amenities
// @route   GET /api/static/amenities
// @access  Public
const getAmenities = asyncHandler(async (req, res) => {
  const amenities = await Amenity.find().select('_id name icon');
  res.json(amenities);
});

// @desc    Get all house rules grouped by category
// @route   GET /api/static/house-rules
// @access  Public
const getHouseRules = asyncHandler(async (req, res) => {
  const categories = await HouseRuleCategory.find();
  
  const rulesWithCategories = await Promise.all(
    categories.map(async (category) => {
      const options = await HouseRuleOption.find({ categoryId: category._id });
      return {
        category: {
          _id: category._id,
          name: category.name
        },
        options: options.map(opt => ({
          _id: opt._id,
          value: opt.value
        }))
      };
    })
  );
  
  res.json(rulesWithCategories);
});

module.exports = {
  getAmenities,
  getHouseRules
};
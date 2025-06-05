const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const Property = require('../models/property');
const Review = require('../models/review');

// Get all users (moderator can only view and toggle isBlocked)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password -emailVerificationToken -emailVerificationTokenExpires');
  res.status(200).json(users);
});

// Toggle user isBlocked status
const updateUserBlockedStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    userId: updatedUser.userId,
    email: updatedUser.email,
    name: updatedUser.name,
    isBlocked: updatedUser.isBlocked
  });
});

// Get all properties (moderator can view and manage isListed or delete)
const getModeratorProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({})
    .populate('cityId')
    .populate('propertyType')
    .populate('amenities')
    .populate('ownerId');
  res.json(properties);
});

// Toggle property isListed status
const updatePropertyListedStatus = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  property.isListed = req.body.isListed !== undefined ? req.body.isListed : property.isListed;

  const updatedProperty = await property.save();

  const populatedProperty = await Property.findById(updatedProperty._id)
    .populate('cityId')
    .populate('propertyType')
    .populate('amenities')
    .populate('ownerId');

  res.status(200).json(populatedProperty);
});

// Delete property
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  await property.deleteOne();

  res.status(200).json({ message: 'Property deleted successfully' });
});

// Get all reviews
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({})
    .populate('userId')
    .populate('propertyId');
  res.status(200).json(reviews);
});

// Delete review
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  await review.deleteOne();
  res.status(200).json({ message: 'Review deleted successfully' });
});

module.exports = {
  getAllUsers,
  updateUserBlockedStatus,
  getModeratorProperties,
  updatePropertyListedStatus,
  deleteProperty,
  getAllReviews,
  deleteReview
};
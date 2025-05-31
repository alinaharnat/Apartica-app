const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Review = require('../models/review');
const Booking = require('../models/booking');
const Property = require('../models/property');
const Room = require('../models/room');

// @desc    Get eligible completed bookings without reviews for a property
// @route   GET /api/reviews/eligible-bookings/:propertyId
// @access  Private
const getEligibleBookings = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const userId = req.user._id;

  // Перевіряємо, чи propertyId є валідним ObjectId
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    res.status(400);
    throw new Error('Invalid property ID');
  }

  // Знаходимо завершені бронювання користувача для цього помешкання
  const bookings = await Booking.find({
    renterId: userId,
    status: 'completed',
    roomId: { $in: await Room.find({ propertyId }).select('_id') },
  }).select('checkIn checkOut');

  // Знаходимо відгуки для цих бронювань
  const existingReviews = await Review.find({
    bookingId: { $in: bookings.map(b => b._id) },
  }).select('bookingId');

  const reviewedBookingIds = existingReviews.map(r => r.bookingId.toString());

  // Фільтруємо бронювання без відгуків
  const eligibleBookings = bookings
    .filter(b => !reviewedBookingIds.includes(b._id.toString()))
    .map(b => ({
      _id: b._id,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
    }));

  res.json(eligibleBookings);
});

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { bookingId, propertyId, overallRating, comment } = req.body;
  const userId = req.user._id;

  // Валідація вхідних даних
  if (!bookingId || !propertyId || !overallRating) {
    res.status(400);
    throw new Error('Booking ID, property ID, and rating are required');
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId) || !mongoose.Types.ObjectId.isValid(propertyId)) {
    res.status(400);
    throw new Error('Invalid booking ID or property ID');
  }

  if (!Number.isInteger(overallRating) || overallRating < 1 || overallRating > 10) {
    res.status(400);
    throw new Error('Rating must be an integer between 1 and 10');
  }

  // Перевіряємо, чи бронювання існує, належить користувачу і завершене
  const booking = await Booking.findOne({
    _id: bookingId,
    renterId: userId,
    status: 'completed',
  });

  if (!booking) {
    res.status(400);
    throw new Error('Booking not found or not eligible for review');
  }

  // Перевіряємо, чи помешкання відповідає бронюванню
  const room = await Room.findById(booking.roomId);
  if (!room || room.propertyId.toString() !== propertyId) {
    res.status(400);
    throw new Error('Property does not match booking');
  }

  // Перевіряємо, чи відгук для цього бронювання вже існує
  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    res.status(400);
    throw new Error('Review for this booking already exists');
  }

  // Створюємо відгук
  const review = await Review.create({
    bookingId,
    userId,
    propertyId,
    comment: comment?.trim() || undefined,
    overallRating,
  });

  // Оновлюємо середній рейтинг помешкання
  const reviews = await Review.find({ propertyId }).select('overallRating');
  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
    : 0;

  await Property.findByIdAndUpdate(propertyId, { averageRating });

  // Повертаємо створений відгук із displayName користувача
  const populatedReview = await Review.findById(review._id)
    .populate('userId', 'displayName')
    .select('userId comment overallRating createdAt');

  res.status(201).json({
    _id: populatedReview._id,
    userId: populatedReview.userId._id,
    userDisplayName: populatedReview.userId.displayName || 'Anonymous',
    comment: populatedReview.comment,
    rating: populatedReview.overallRating,
    createdAt: populatedReview.createdAt,
    averageRating,
  });
});

module.exports = {
  getEligibleBookings,
  createReview,
};
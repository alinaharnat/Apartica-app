const { generateUserId } = require('../utilits/generateId');
const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const Property = require('../models/property');
const Booking = require('../models/booking');
const Room = require('../models/room');

// Получить всех пользователей
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password -emailVerificationToken -emailVerificationTokenExpires');
  res.status(200).json(users);
});

// Получить пользователя по ID
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -emailVerificationToken -emailVerificationTokenExpires');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.status(200).json(user);
});

// Создать нового пользователя (администратором)
const createUser = asyncHandler(async (req, res) => {
  const { email, name, phoneNumber, userType, gender, birthDate, isBlocked } = req.body;

  if (!email || !name) {
    res.status(400);
    throw new Error('Email and name are required');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    userId: await generateUserId(),
    email,
    name,
    phoneNumber,
    userType: userType || ['Renter'],
    gender: gender || '', // Default to empty string if not provided
    dateOfBirth: birthDate || undefined, // Use undefined if not provided to match schema
    isBlocked: isBlocked !== undefined ? isBlocked : false, // Default to false if not provided
    isEmailVerified: true
  });

  res.status(201).json({
    _id: user._id,
    userId: user.userId,
    email: user.email,
    name: user.name,
    userType: user.userType,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    isBlocked: user.isBlocked,
    isEmailVerified: user.isEmailVerified
  });
});

// Обновить пользователя
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
  user.userType = req.body.userType || user.userType;
  user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
  user.gender = req.body.gender || user.gender;
  user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    userId: updatedUser.userId,
    email: updatedUser.email,
    name: updatedUser.name,
    userType: updatedUser.userType,
    dateOfBirth: updatedUser.dateOfBirth,
    gender: updatedUser.gender,
    isBlocked: updatedUser.isBlocked
  });
});

// Удалить пользователя
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  await user.deleteOne();
  res.status(200).json({ message: 'User removed successfully' });
});

// Получить все свойства (для админа)
const getAdminProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({})
    .populate('cityId')
    .populate('propertyType')
    .populate('amenities')
    .populate('ownerId');
  res.json(properties);
});

const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  // Обновляем только разрешенные поля
  property.title = req.body.title || property.title;
  property.description = req.body.description || property.description;
  property.address = req.body.address || property.address;
  property.cityId = req.body.cityId || property.cityId; // Добавлено редактирование города
  property.propertyType = req.body.propertyType || property.propertyType;
  property.isListed = req.body.isListed !== undefined ? req.body.isListed : property.isListed;

  // Явно оставляем прежние значения для нередактируемых полей
  property.amenities = property.amenities; // Оставляем исходное значение
  property.rules = property.rules; // Оставляем исходное значение

  const updatedProperty = await property.save();
  
  // Возвращаем обновленные данные с populate
  const populatedProperty = await Property.findById(updatedProperty._id)
    .populate('cityId') // Город будет в ответе
    .populate('propertyType')
    .populate('amenities')
    .populate('ownerId');

  res.status(200).json(populatedProperty);
});

const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  await property.deleteOne();

  res.status(200).json({ message: 'Property deleted successfully' });
});


const getAdminBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate('renterId');
  res.status(200).json(bookings);
});


const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('renterId');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  res.status(200).json(booking);
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  booking.renterId = req.body.renterId || booking.renterId;
  booking.status = req.body.status || booking.status;
  booking.checkIn = req.body.checkIn || booking.checkIn;
  booking.checkOut = req.body.checkOut || booking.checkOut;
  booking.totalPrice = req.body.totalPrice || booking.totalPrice;
  booking.numberOfGuests = req.body.numberOfGuests || booking.numberOfGuests;

  const updated = await booking.save();

  const populated = await Booking.findById(updated._id)
    .populate('renterId');

  res.status(200).json(populated);
});


const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  await booking.deleteOne();
  res.status(200).json({ message: 'Booking deleted successfully' });
});

// Отримати всіх орендарів
const getAdminRenters = asyncHandler(async (req, res) => {
  const renters = await User.find({ userType: 'Renter' }).select('-password');
  res.status(200).json(renters);
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAdminProperties,
  updateProperty,
  deleteProperty,
  getAdminBookings,     // ← нове
  getBookingById,       // ← нове
  updateBooking,        // ← нове
  deleteBooking,
  getAdminRenters
};
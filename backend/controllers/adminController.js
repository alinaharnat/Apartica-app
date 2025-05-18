const { generateUserId } = require('../utilits/generateId');

const User = require('../models/user');
const asyncHandler = require('express-async-handler');

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
  const { email, name, phoneNumber, userType } = req.body;

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
    isEmailVerified: true
  });

  res.status(201).json({
    _id: user._id,
    userId: user.userId,
    email: user.email,
    name: user.name,
    userType: user.userType,
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

  // Обновляем только разрешенные поля
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
  user.userType = req.body.userType || user.userType;
  user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    userId: updatedUser.userId,
    email: updatedUser.email,
    name: updatedUser.name,
    userType: updatedUser.userType,
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

  // Не позволяем администратору удалять самого себя
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  await user.deleteOne();
  res.status(200).json({ message: 'User removed successfully' });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
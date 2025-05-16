//controllers/authController.js
const User = require('../models/user');
const { generateToken, generateEmailVerificationToken } = require('../utilits/generateToken');
const { generateUserId } = require('../utilits/generateId');
const { sendVerificationEmail } = require('../config/email');

// @desc    Реєстрація нового користувача (email)
const registerUser = async (req, res) => {
  try {
    const { email, name, phoneNumber, profilePicture } = req.body;

    if (!email || !name || !phoneNumber) {
      return res.status(400).json({ message: 'Будь ласка, заповніть всі обов\'язкові поля' });
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Користувач з такою електронною поштою вже існує' });
      }

      const user = await User.create({
        userId: await generateUserId(),
        email,
        name,
        displayName: name,
        phoneNumber,
        profilePicture: profilePicture || '',
        isBlocked: false,
        isEmailVerified: false
      });

      const verificationToken = generateEmailVerificationToken();
      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        message: 'Реєстрація успішна! Код підтвердження надіслано на вашу електронну пошту',
        email: user.email
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// @desc    Запит коду підтвердження
  const emailLogin = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Будь ласка, вкажіть електронну пошту' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Користувача не знайдено' });
      }

      const token = generateEmailVerificationToken();
      user.emailVerificationToken = token;
      user.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendVerificationEmail(email, token);

      res.status(200).json({ message: 'Код надіслано на пошту', email });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// @desc    Підтвердження email
  const verifyEmail = async (req, res) => {
    try {
      const { email, token } = req.body;

      const user = await User.findOne({
        email,
        emailVerificationToken: token,
        emailVerificationTokenExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Недійсний або прострочений код' });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationTokenExpires = undefined;
      await user.save();

      const authToken = generateToken(user._id);
      res.status(200).json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phoneNumber: user.phoneNumber,
        token: authToken
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// @desc    Callback після Google OAuth
  const googleCallback = (req, res) => {
    try {
      const token = generateToken(req.user._id);
      res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  };

  module.exports = {
    registerUser,
    emailLogin,
    verifyEmail,
    googleCallback
  };

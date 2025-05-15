// controllers/authController.js
const User = require('../../models/user');
const { generateToken, generateEmailVerificationToken } = require('../utils/generateToken');
const { generateUserId } = require('../utils/generateId');
const { sendVerificationEmail } = require('../config/email');

// @desc    Реєстрація нового користувача
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, name, phoneNumber, profilePicture } = req.body;

    // Перевірка всіх обов'язкових полів
    if (!email || !name || !phoneNumber) {
      return res.status(400).json({ 
        message: 'Будь ласка, заповніть всі обов\'язкові поля' 
      });
    }

    // Перевірка, чи існує користувач з такою поштою
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        message: 'Користувач з такою електронною поштою вже існує' 
      });
    }

    // Створення нового користувача
    const user = await User.create({
      userId: await generateUserId(),
      email,
      name,
      phoneNumber,
      profilePicture: profilePicture || '',
      isBlocked: false,
      isEmailVerified: false
    });

    if (user) {
      // Після реєстрації одразу надсилаємо код для входу
      const verificationToken = generateEmailVerificationToken();
      const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 хвилин
      
      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenExpires = verificationTokenExpires;
      await user.save();

      // Відправляємо електронний лист з кодом
      await sendVerificationEmail(email, verificationToken);
      
      res.status(201).json({
        message: 'Реєстрація успішна! Код підтвердження надіслано на вашу електронну пошту',
        email: user.email
      });
    } else {
      res.status(400).json({ message: 'Невірні дані користувача' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Відправлення коду підтвердження для входу через пошту
// @route   POST /api/auth/email-login
// @access  Public
const emailLogin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Будь ласка, вкажіть електронну пошту' });
    }

    // Перевіряємо, чи існує користувач
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'Користувача з такою електронною поштою не знайдено. Спочатку зареєструйтесь.' 
      });
    }

    // Генеруємо токен підтвердження та оновлюємо користувача
    const verificationToken = generateEmailVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 хвилин
    
    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Відправляємо електронний лист з кодом
    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({ 
      message: 'Код підтвердження надіслано на вашу електронну пошту',
      email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Підтвердження коду електронної пошти для входу
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ message: 'Необхідні електронна пошта та код підтвердження' });
    }

    const user = await User.findOne({ 
      email,
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Недійсний або прострочений код підтвердження' });
    }

    // Код підтверджено, оновлюємо користувача
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    // Генеруємо JWT токен для автентифікації
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

// Інші методи (getMe, googleCallback) залишаються без змін

module.exports = { 
  registerUser, 
  emailLogin, 
  verifyEmail, 
  getMe, 
  googleCallback 
};
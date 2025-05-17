const User = require('../models/user');
const { generateToken, generateEmailVerificationToken } = require('../utilits/generateToken');
const { generateUserId } = require('../utilits/generateId');
const { sendVerificationEmail } = require('../config/email');
const asyncHandler = require('express-async-handler');

const registerUser = asyncHandler(async (req, res) => {
  const { email, name, phoneNumber, profilePicture } = req.body;

  if (!email || !name) {
    res.status(400);
    throw new Error("Будь ласка, заповніть поля: email та ім'я");
  }

  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    if (!user.isEmailVerified) {
      const verificationToken = generateEmailVerificationToken();
      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      user.name = name || user.name;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.profilePicture = profilePicture || user.profilePicture;
      if (!Array.isArray(user.roles) || user.roles.length === 0) {
          user.roles = ['Renter'];
      }
      await user.save();
      await sendVerificationEmail(user.email, verificationToken, user.name);
      res.status(200).json({
        message: 'Користувач вже існує, але пошта не підтверджена. Новий код підтвердження надіслано.',
        email: user.email,
      });
      return;
    }
    res.status(400);
    throw new Error('Користувач з такою електронною поштою вже існує та підтверджений');
  }

  const newUserId = await generateUserId();
  user = new User({
    userId: newUserId,
    email,
    name,
    phoneNumber,
    profilePicture: profilePicture || '',
    roles: ['Renter'],
    isEmailVerified: false,
  });

  const verificationToken = generateEmailVerificationToken();
  user.emailVerificationToken = verificationToken;
  user.emailVerificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

  await user.save();
  await sendVerificationEmail(user.email, verificationToken, user.name);

  res.status(201).json({
    message: 'Реєстрація успішна! Код підтвердження надіслано на вашу електронну пошту.',
    email: user.email,
  });
});

const emailLogin = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Будь ласка, вкажіть електронну пошту');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('Користувача з такою електронною поштою не знайдено. Будь ласка, зареєструйтесь.');
    }

    const token = generateEmailVerificationToken();
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, token, user.name);

    res.status(200).json({ message: 'Код для входу/підтвердження надіслано на вашу електронну пошту.', email: user.email });
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { email, token: verificationCode } = req.body;

    if (!email || !verificationCode) {
        res.status(400);
        throw new Error('Email та код підтвердження є обов\'язковими.');
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: verificationCode,
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser.isEmailVerified && existingUser.emailVerificationToken !== verificationCode) {
         res.status(400);
         throw new Error('Код невірний або вже використаний. Спробуйте запросити новий код.');
      }
      if (existingUser && existingUser.emailVerificationTokenExpires <= Date.now()) {
          res.status(400);
          throw new Error('Термін дії коду минув. Будь ласка, запросіть новий код.');
      }
      res.status(400);
      throw new Error('Недійсний код або термін його дії минув.');
    }

    const isInitialVerification = !user.isEmailVerified;

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id);

    res.status(200).json({
      message: isInitialVerification ? 'Електронну пошту успішно підтверджено! Вхід виконано.' : 'Вхід успішний!',
      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
      },
      token: authToken,
    });
});

const googleCallback = asyncHandler(async (req, res) => {
    if (!req.user) {
      console.error('Google callback: req.user is undefined');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed_user_undefined`);
    }
    const token = generateToken(req.user._id);

    const userDataToStore = {
        _id: req.user._id,
        userId: req.user.userId,
        name: req.user.name,
        displayName: req.user.displayName,
        email: req.user.email,
        roles: req.user.roles,
        isEmailVerified: req.user.isEmailVerified,
        profilePicture: req.user.profilePicture,
        token: token,
    };

    res.redirect(`${process.env.FRONTEND_URL}/auth-success?userData=${encodeURIComponent(JSON.stringify(userDataToStore))}`);
});

module.exports = {
  registerUser,
  emailLogin,
  verifyEmail,
  googleCallback,
};

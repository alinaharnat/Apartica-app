
const User = require('../models/user');
const { generateToken, generateEmailVerificationToken } = require('../utilits/generateToken');
const { generateUserId } = require('../utilits/generateId');
const { sendVerificationEmail } = require('../config/email'); // Переконайтеся, що шлях правильний

// @desc    Реєстрація нового користувача (email)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, name, phoneNumber, profilePicture } = req.body;

    // Валідація на сервері (додатково до Mongoose валідації)
    if (!email || !name) { // phoneNumber зробимо опціональним на цьому етапі, але Mongoose schema може вимагати його
      return res.status(400).json({ message: "Будь ласка, заповніть поля: email та ім'я" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      // Якщо користувач існує, але не підтвердив пошту, можна повторно надіслати код
      if (!user.isEmailVerified) {
        const verificationToken = generateEmailVerificationToken();
        user.emailVerificationToken = verificationToken;
        user.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 хвилин
        // Оновлюємо ім'я та телефон, якщо вони були передані знову
        user.name = name || user.name;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.profilePicture = profilePicture || user.profilePicture;
        await user.save();

        await sendVerificationEmail(user.email, verificationToken, user.name);
        return res.status(200).json({
          message: 'Користувач вже існує, але пошта не підтверджена. Новий код підтвердження надіслано.',
          email: user.email,
        });
      }
      return res.status(400).json({ message: 'Користувач з такою електронною поштою вже існує та підтверджений' });
    }

    // Створення нового користувача
    const newUserId = await generateUserId();
    user = new User({
      userId: newUserId,
      email, // Mongoose schema переведе в lowercase
      name,
      displayName: name, // Mongoose pre-save hook також може це зробити
      phoneNumber,
      profilePicture: profilePicture || '', // Встановлюємо пустий рядок, якщо не надано
      isEmailVerified: false, // За замовчуванням
      // userType залишається 'Renter' за замовчуванням
    });

    const verificationToken = generateEmailVerificationToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 хвилин

    await user.save(); // Тут спрацює Mongoose валідація

    // Надсилання коду підтвердження
    await sendVerificationEmail(user.email, verificationToken, user.name);

    res.status(201).json({
      message: 'Реєстрація успішна! Код підтвердження надіслано на вашу електронну пошту.',
      email: user.email,
      // Не повертаємо дані користувача до підтвердження пошти
    });
  } catch (error) {
    // Обробка помилок валідації Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    console.error('Register user error:', error);
    res.status(500).json({ message: error.message || 'Помилка сервера під час реєстрації' });
  }
};

// ... інші методи (emailLogin, verifyEmail, googleCallback) залишаються тут ...
// У emailLogin потрібно буде змінити логіку, якщо реєстрація і вхід це різні процеси
// Зараз emailLogin надсилає код для ВЖЕ існуючого користувача. Це правильно для "входу".
// Для первинної реєстрації ми вже надсилаємо код у registerUser.

const emailLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Будь ласка, вкажіть електронну пошту' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Якщо політика така, що для входу користувач має бути зареєстрований,
      // то повертаємо помилку. Або можна перенаправляти на реєстрацію.
      return res.status(404).json({ message: 'Користувача з такою електронною поштою не знайдено. Будь ласка, зареєструйтесь.' });
    }

    // Якщо користувач є, але ще не підтвердив пошту (наприклад, закрив вкладку після реєстрації)
    // І зараз намагається "увійти", то йому також потрібен код.
    // Якщо ж isEmailVerified = true, то це стандартний запит коду для входу.
    const token = generateEmailVerificationToken();
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 хвилин
    await user.save();

    // Використовуємо той самий шаблон листа, що й для реєстрації, але можна створити окремий
    await sendVerificationEmail(user.email, token, user.name);

    res.status(200).json({ message: 'Код для входу надіслано на вашу електронну пошту.', email: user.email });
  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({ message: error.message || 'Помилка сервера під час запиту коду для входу' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
        return res.status(400).json({ message: 'Email та код підтвердження є обов\'язковими.' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: Date.now() }, // Перевірка, що код не прострочений
    });

    if (!user) {
      // Перевіряємо, чи існує користувач з таким email, щоб дати більш конкретну помилку
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser.isEmailVerified && existingUser.emailVerificationToken !== token) {
         return res.status(400).json({ message: 'Код невірний або вже використаний. Спробуйте запросити новий код.' });
      }
      if (existingUser && existingUser.emailVerificationTokenExpires <= Date.now()) {
          return res.status(400).json({ message: 'Термін дії коду минув. Будь ласка, запросіть новий код.' });
      }
      return res.status(400).json({ message: 'Недійсний код або термін його дії минув.' });
    }

    const isInitialVerification = !user.isEmailVerified; // Перевіряємо, чи це первинна верифікація

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined; // Очищаємо токен після успішної верифікації
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    // Генеруємо JWT токен для сесії
    const authToken = generateToken(user._id);

    res.status(200).json({
      message: isInitialVerification ? 'Електронну пошту успішно підтверджено! Вхід виконано.' : 'Вхід успішний!',
      _id: user._id,
      userId: user.userId,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      userType: user.userType,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      token: authToken, // JWT токен для подальших запитів
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: error.message || 'Помилка сервера під час підтвердження пошти' });
  }
};


// Google OAuth callback
const googleCallback = async (req, res) => { // Змінено на async для можливих операцій з БД
  try {
    // req.user тут надається Passport'ом після успішної аутентифікації/створення користувача
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
    const token = generateToken(req.user._id);
    // Перенаправлення на фронтенд з токеном
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}&userId=${req.user.userId}&name=${encodeURIComponent(req.user.name)}&email=${req.user.email}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_processing_failed`);
  }
};

module.exports = {
  registerUser,
  emailLogin,
  verifyEmail,
  googleCallback,
};
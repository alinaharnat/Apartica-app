const jwt = require('jsonwebtoken');
const User = require('../../models/user');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-emailVerificationToken -emailVerificationTokenExpires');
      if (!req.user) {
        return res.status(401).json({ message: 'Користувача не знайдено' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Невірний токен' });
    }
  } else {
    return res.status(401).json({ message: 'Немає токена' });
  }
};

module.exports = { protect };
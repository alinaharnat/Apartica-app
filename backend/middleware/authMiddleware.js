const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-emailVerificationToken -emailVerificationTokenExpires');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (req.user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact support for assistance.' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};

const auth = protect;

module.exports = { protect, auth };
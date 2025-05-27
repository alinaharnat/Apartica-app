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
        console.error('User not found for ID:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    console.error('No valid Authorization header');
    return res.status(401).json({ message: 'No token provided' });
  }
};

module.exports = { protect };

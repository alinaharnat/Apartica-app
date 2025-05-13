// utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const generateEmailVerificationToken = () => {
  // Генеруємо 6-значний код
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { generateToken, generateEmailVerificationToken };
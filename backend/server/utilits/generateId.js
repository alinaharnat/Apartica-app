const User = require('../../models/user');

/**
 * Генерує унікальний числовий userId на основі найбільшого значення в базі
 * @returns {Promise<number>} новий унікальний userId
 */
const generateUserId = async () => {
  const lastUser = await User.findOne().sort({ userId: -1 }).select('userId');

  const lastId = lastUser?.userId || 100000; // Початкове значення
  return lastId + 1;
};

module.exports = { generateUserId };
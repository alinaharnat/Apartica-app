const asyncHandler = require('express-async-handler');

const checkModerator = asyncHandler(async (req, res, next) => {
  // Проверяем, что пользователь аутентифицирован
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Проверяем, что пользователь имеет роль модератора
  if (!req.user.userType.includes('Moderator')) {
    res.status(403);
    throw new Error('Access denied. Moderator rights required.');
  }

  next();
});

module.exports = { checkModerator };
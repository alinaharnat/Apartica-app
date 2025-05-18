const asyncHandler = require('express-async-handler');

const checkAdmin = asyncHandler(async (req, res, next) => {
  // Проверяем, что пользователь аутентифицирован
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Проверяем, что пользователь имеет роль администратора
  if (!req.user.userType.includes('Administrator')) {
    res.status(403);
    throw new Error('Access denied. Administrator rights required.');
  }

  next();
});

module.exports = { checkAdmin };
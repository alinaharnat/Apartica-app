const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkAdmin } = require('../middleware/adminMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/adminController');

// Все маршруты защищены аутентификацией и проверкой администратора
router.use(protect);
router.use(checkAdmin);

router.route('/users')
  .get(getAllUsers)
  .post(createUser);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
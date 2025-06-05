const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkModerator } = require('../middleware/moderatorMiddleware');
const {
  getAllUsers,
  updateUserBlockedStatus,
  getModeratorProperties,
  updatePropertyListedStatus,
  deleteProperty,
  getAllReviews,
  deleteReview
} = require('../controllers/moderatorController');

// Застосовуємо middleware до всіх маршрутів
router.use(protect);
router.use(checkModerator);

// Маршрути
router.route('/users')
  .get(getAllUsers); // Отримати всіх користувачів

router.route('/users/:id')
  .put(updateUserBlockedStatus); // Оновити статус блокування користувача

router.route('/properties')
  .get(getModeratorProperties); // Отримати всі об'єкти нерухомості

router.route('/properties/:id')
  .put(updatePropertyListedStatus) // Оновити статус лістингу об'єкта
  .delete(deleteProperty); // Видалити об'єкт нерухомості

router.route('/reviews')
  .get(getAllReviews); // Отримати всі відгуки

router.route('/reviews/:id')
  .delete(deleteReview); // Видалити відгук

module.exports = router;
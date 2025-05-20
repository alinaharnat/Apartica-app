const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkAdmin } = require('../middleware/adminMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAdminProperties,
  updateProperty,
  deleteProperty,
  getAdminBookings,     // ← нове
  getBookingById,       // ← нове
  updateBooking,        // ← нове
  deleteBooking,
  getAdminRenters
} = require('../controllers/adminController');

// Применяем middleware ко всем маршрутам
router.use(protect);
router.use(checkAdmin);

// Маршруты
router.route('/users')
  .get(getAllUsers)
  .post(createUser);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.get('/properties', getAdminProperties);
router.route('/properties/:id')
.put(updateProperty)
.delete(deleteProperty);

router.get('/bookings', getAdminBookings);
router.route('/bookings/:id')
  .get(getBookingById)
  .put(updateBooking)
  .delete(deleteBooking);


  router.get('/users/renters', getAdminRenters); // <- додати цей маршрут
  
module.exports = router;
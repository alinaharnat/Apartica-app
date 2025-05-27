const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/form-data', propertyController.getFormData);

// Отримання конкретного помешкання за ID
router.get('/:id', propertyController.getPropertyById);

// Створення нового помешкання
router.post('/', protect, propertyController.createPropertyWithRooms);

// Отримання списку всіх помешкань
router.get('/', propertyController.getProperties);

// Додаткові маршрути
router.get('/:id/available-rooms', propertyController.getAvailableRooms);
router.get('/:id/unavailable-dates', propertyController.getUnavailableDates);

module.exports = router;

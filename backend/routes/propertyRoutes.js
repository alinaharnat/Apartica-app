const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// Отримання конкретного помешкання за ID
router.get('/:id', propertyController.getPropertyById);

// Створення нового помешкання
router.post('/', propertyController.createPropertyWithRooms);

// Отримання списку всіх помешкань
router.get('/', propertyController.getProperties);

// Додаткові маршрути
router.get('/:id/available-rooms', propertyController.getAvailableRooms);
router.get('/:id/unavailable-dates', propertyController.getUnavailableDates);

module.exports = router;

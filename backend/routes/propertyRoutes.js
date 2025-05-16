const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// POST /api/properties
router.post('/', propertyController.createProperty);

module.exports = router;

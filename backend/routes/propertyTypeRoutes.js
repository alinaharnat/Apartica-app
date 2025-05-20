const express = require('express');
const router = express.Router();
const { getPropertyTypes } = require('../controllers/propertyTypeController');

router.get('/', getPropertyTypes);

module.exports = router;
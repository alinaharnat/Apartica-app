const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

router.get('/top', cityController.getTopCities);

module.exports = router;
